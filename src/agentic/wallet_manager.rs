use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use web3::types::{Address, U256, H256, Transaction, SignedTransaction};
use web3::Web3;
use web3::transports::Http;
use web3::signing::{Key, SecretKey, SecretKeyRef};
use secp256k1::{Secp256k1, Message, ecdsa};
use rand::Rng;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletManager {
    web3: Arc<Web3<Http>>,
    wallets: Arc<Mutex<HashMap<String, Wallet>>>,
    keystore: Arc<Mutex<HashMap<String, EncryptedKey>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Wallet {
    pub address: Address,
    pub name: String,
    pub balance: U256,
    pub nonce: U256,
    pub tokens: HashMap<Address, U256>,
    pub transactions: Vec<TransactionRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionRecord {
    pub hash: H256,
    pub from: Address,
    pub to: Option<Address>,
    pub value: U256,
    pub timestamp: U256,
    pub status: TransactionStatus,
    pub gas_used: Option<U256>,
    pub gas_price: U256,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransactionStatus {
    Pending,
    Confirmed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedKey {
    pub address: Address,
    pub encrypted_private_key: Vec<u8>,
    pub salt: Vec<u8>,
    pub iv: Vec<u8>,
}

#[derive(Debug, Clone)]
pub struct TransactionRequest {
    pub to: Address,
    pub value: U256,
    pub gas_limit: Option<U256>,
    pub gas_price: Option<U256>,
    pub data: Option<Vec<u8>>,
    pub nonce: Option<U256>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenBalance {
    pub token_address: Address,
    pub balance: U256,
    pub decimals: u8,
    pub symbol: String,
    pub name: String,
}

impl WalletManager {
    pub fn new(web3: Arc<Web3<Http>>) -> Self {
        Self {
            web3,
            wallets: Arc::new(Mutex::new(HashMap::new())),
            keystore: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn create_wallet(&self, name: &str, password: &str) -> Result<Address, Box<dyn std::error::Error>> {
        let secret_key = SecretKey::new(&mut rand::thread_rng());
        let public_key = secret_key.public_key(&Secp256k1::new());
        let address = public_key_to_address(&public_key);

        let encrypted_key = self.encrypt_private_key(&secret_key, password)?;

        let wallet = Wallet {
            address,
            name: name.to_string(),
            balance: U256::zero(),
            nonce: U256::zero(),
            tokens: HashMap::new(),
            transactions: Vec::new(),
        };

        let mut wallets = self.wallets.lock().await;
        let mut keystore = self.keystore.lock().await;

        wallets.insert(address.to_string(), wallet);
        keystore.insert(address.to_string(), encrypted_key);

        Ok(address)
    }

    pub async fn import_wallet(&self, private_key_hex: &str, name: &str, password: &str) -> Result<Address, Box<dyn std::error::Error>> {
        let secret_key = SecretKey::from_slice(&hex::decode(private_key_hex)?)?;
        let public_key = secret_key.public_key(&Secp256k1::new());
        let address = public_key_to_address(&public_key);

        let encrypted_key = self.encrypt_private_key(&secret_key, password)?;

        let wallet = Wallet {
            address,
            name: name.to_string(),
            balance: U256::zero(),
            nonce: U256::zero(),
            tokens: HashMap::new(),
            transactions: Vec::new(),
        };

        let mut wallets = self.wallets.lock().await;
        let mut keystore = self.keystore.lock().await;

        wallets.insert(address.to_string(), wallet);
        keystore.insert(address.to_string(), encrypted_key);

        Ok(address)
    }

    pub async fn unlock_wallet(&self, address: Address, password: &str) -> Result<SecretKey, Box<dyn std::error::Error>> {
        let keystore = self.keystore.lock().await;
        let encrypted_key = keystore.get(&address.to_string())
            .ok_or("Wallet not found")?;

        self.decrypt_private_key(encrypted_key, password)
    }

    pub async fn get_wallet(&self, address: Address) -> Result<Wallet, Box<dyn std::error::Error>> {
        let wallets = self.wallets.lock().await;
        wallets.get(&address.to_string())
            .cloned()
            .ok_or("Wallet not found".into())
    }

    pub async fn update_wallet_balance(&self, address: Address) -> Result<(), Box<dyn std::error::Error>> {
        let balance = self.web3.eth().balance(address, None).await?;
        let nonce = self.web3.eth().transaction_count(address, None).await?;

        let mut wallets = self.wallets.lock().await;
        if let Some(wallet) = wallets.get_mut(&address.to_string()) {
            wallet.balance = balance;
            wallet.nonce = nonce;
        }

        Ok(())
    }

    pub async fn send_transaction(&self, from: Address, to: Address, value: U256, password: &str) -> Result<H256, Box<dyn std::error::Error>> {
        let secret_key = self.unlock_wallet(from, password).await?;
        let wallet = self.get_wallet(from).await?;

        let tx_request = TransactionRequest {
            to,
            value,
            gas_limit: Some(U256::from(21000)),
            gas_price: None,
            data: None,
            nonce: Some(wallet.nonce),
        };

        let tx_hash = self.sign_and_send_transaction(tx_request, &secret_key).await?;

        // Record the transaction
        let transaction_record = TransactionRecord {
            hash: tx_hash,
            from,
            to: Some(to),
            value,
            timestamp: U256::from(std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH)?.as_secs()),
            status: TransactionStatus::Pending,
            gas_used: None,
            gas_price: self.web3.eth().gas_price().await?,
        };

        let mut wallets = self.wallets.lock().await;
        if let Some(wallet) = wallets.get_mut(&from.to_string()) {
            wallet.transactions.push(transaction_record);
            wallet.nonce += U256::one();
        }

        Ok(tx_hash)
    }

    pub async fn send_token(&self, from: Address, to: Address, token_address: Address, amount: U256, password: &str) -> Result<H256, Box<dyn std::error::Error>> {
        let secret_key = self.unlock_wallet(from, password).await?;

        // ERC-20 transfer function call
        let transfer_signature = "transfer(address,uint256)";
        let transfer_selector = web3::contract::tokens::Function::new(transfer_signature, vec![], vec![], false)?.encode_input(vec![
            self.encode_address(to),
            self.encode_uint256(amount),
        ])?;

        let tx_request = TransactionRequest {
            to: token_address,
            value: U256::zero(),
            gas_limit: Some(U256::from(100000)),
            gas_price: None,
            data: Some(transfer_selector),
            nonce: None,
        };

        let tx_hash = self.sign_and_send_transaction(tx_request, &secret_key).await?;

        // Update token balance
        self.update_token_balance(from, token_address).await?;

        Ok(tx_hash)
    }

    pub async fn sign_message(&self, address: Address, message: &str, password: &str) -> Result<String, Box<dyn std::error::Error>> {
        let secret_key = self.unlock_wallet(address, password).await?;
        let message_hash = web3::signing::hash_message(message.as_bytes());
        let signature = self.web3.accounts().sign(&message_hash, &SecretKeyRef::new(&secret_key)).await?;
        Ok(format!("0x{}", hex::encode(signature.to_vec())))
    }

    pub async fn verify_signature(&self, message: &str, signature: &str, address: Address) -> Result<bool, Box<dyn std::error::Error>> {
        let message_hash = web3::signing::hash_message(message.as_bytes());
        let signature_bytes = hex::decode(&signature[2..])?;
        let recovered_address = self.web3.accounts().recover(&message_hash, &signature_bytes)?;
        Ok(recovered_address == address)
    }

    pub async fn get_token_balance(&self, address: Address, token_address: Address) -> Result<U256, Box<dyn std::error::Error>> {
        let contract = super::smart_contract::SmartContract::new(token_address, vec![], self.web3.clone());
        let balance_data = contract.call("balanceOf", vec![self.encode_address(address)]).await?;
        Ok(self.decode_uint256(&balance_data))
    }

    pub async fn update_token_balance(&self, address: Address, token_address: Address) -> Result<(), Box<dyn std::error::Error>> {
        let balance = self.get_token_balance(address, token_address).await?;

        let mut wallets = self.wallets.lock().await;
        if let Some(wallet) = wallets.get_mut(&address.to_string()) {
            wallet.tokens.insert(token_address, balance);
        }

        Ok(())
    }

    pub async fn get_token_info(&self, token_address: Address) -> Result<TokenBalance, Box<dyn std::error::Error>> {
        let contract = super::smart_contract::SmartContract::new(token_address, vec![], self.web3.clone());

        let name_data = contract.call("name", vec![]).await?;
        let name = String::from_utf8_lossy(&name_data).trim_matches('\0').to_string();

        let symbol_data = contract.call("symbol", vec![]).await?;
        let symbol = String::from_utf8_lossy(&symbol_data).trim_matches('\0').to_string();

        let decimals_data = contract.call("decimals", vec![]).await?;
        let decimals = self.decode_uint256(&decimals_data).as_u64() as u8;

        let total_supply = self.decode_uint256(&contract.call("totalSupply", vec![]).await?);

        Ok(TokenBalance {
            token_address,
            balance: U256::zero(), // This would be set when getting balance for a specific address
            decimals,
            symbol,
            name,
        })
    }

    pub async fn add_token(&self, wallet_address: Address, token_address: Address) -> Result<(), Box<dyn std::error::Error>> {
        let balance = self.get_token_balance(wallet_address, token_address).await?;
        let token_info = self.get_token_info(token_address).await?;

        let mut wallets = self.wallets.lock().await;
        if let Some(wallet) = wallets.get_mut(&wallet_address.to_string()) {
            wallet.tokens.insert(token_address, balance);
        }

        Ok(())
    }

    pub async fn remove_token(&self, wallet_address: Address, token_address: Address) -> Result<(), Box<dyn std::error::Error>> {
        let mut wallets = self.wallets.lock().await;
        if let Some(wallet) = wallets.get_mut(&wallet_address.to_string()) {
            wallet.tokens.remove(&token_address);
        }

        Ok(())
    }

    pub async fn get_transaction_history(&self, address: Address) -> Result<Vec<TransactionRecord>, Box<dyn std::error::Error>> {
        let wallet = self.get_wallet(address).await?;
        Ok(wallet.transactions)
    }

    pub async fn estimate_gas(&self, tx_request: TransactionRequest) -> Result<U256, Box<dyn std::error::Error>> {
        let web3_tx = web3::types::TransactionRequest {
            from: None,
            to: Some(tx_request.to),
            gas: tx_request.gas_limit,
            gas_price: tx_request.gas_price,
            value: Some(tx_request.value),
            data: tx_request.data.map(|d| d.into()),
            nonce: tx_request.nonce,
            ..Default::default()
        };

        let gas_estimate = self.web3.eth().estimate_gas(web3_tx, None).await?;
        Ok(gas_estimate)
    }

    pub async fn get_gas_price(&self) -> Result<U256, Box<dyn std::error::Error>> {
        let gas_price = self.web3.eth().gas_price().await?;
        Ok(gas_price)
    }

    pub async fn batch_transactions(&self, transactions: Vec<(Address, TransactionRequest)>, password: &str) -> Result<Vec<H256>, Box<dyn std::error::Error>> {
        let mut tx_hashes = Vec::new();

        for (from, tx_request) in transactions {
            let secret_key = self.unlock_wallet(from, password).await?;
            let tx_hash = self.sign_and_send_transaction(tx_request, &secret_key).await?;
            tx_hashes.push(tx_hash);
        }

        Ok(tx_hashes)
    }

    pub async fn export_wallet(&self, address: Address, password: &str, export_password: &str) -> Result<String, Box<dyn std::error::Error>> {
        let secret_key = self.unlock_wallet(address, password).await?;
        let private_key_hex = format!("0x{}", hex::encode(secret_key.secret_bytes()));
        Ok(private_key_hex)
    }

    pub async fn delete_wallet(&self, address: Address, password: &str) -> Result<(), Box<dyn std::error::Error>> {
        // Verify password by unlocking
        self.unlock_wallet(address, password).await?;

        let mut wallets = self.wallets.lock().await;
        let mut keystore = self.keystore.lock().await;

        wallets.remove(&address.to_string());
        keystore.remove(&address.to_string());

        Ok(())
    }

    pub async fn backup_wallets(&self, backup_path: &str) -> Result<(), Box<dyn std::error::Error>> {
        let wallets = self.wallets.lock().await;
        let keystore = self.keystore.lock().await;

        let backup_data = serde_json::json!({
            "wallets": *wallets,
            "keystore": *keystore,
        });

        std::fs::write(backup_path, serde_json::to_string_pretty(&backup_data)?)?;
        Ok(())
    }

    pub async fn restore_wallets(&self, backup_path: &str) -> Result<(), Box<dyn std::error::Error>> {
        let backup_content = std::fs::read_to_string(backup_path)?;
        let backup_data: serde_json::Value = serde_json::from_str(&backup_content)?;

        let restored_wallets: HashMap<String, Wallet> = serde_json::from_value(backup_data["wallets"].clone())?;
        let restored_keystore: HashMap<String, EncryptedKey> = serde_json::from_value(backup_data["keystore"].clone())?;

        let mut wallets = self.wallets.lock().await;
        let mut keystore = self.keystore.lock().await;

        *wallets = restored_wallets;
        *keystore = restored_keystore;

        Ok(())
    }

    pub async fn get_wallet_stats(&self, address: Address) -> Result<HashMap<String, U256>, Box<dyn std::error::Error>> {
        let wallet = self.get_wallet(address).await?;
        let mut stats = HashMap::new();

        stats.insert("balance".to_string(), wallet.balance);
        stats.insert("nonce".to_string(), wallet.nonce);
        stats.insert("transaction_count".to_string(), U256::from(wallet.transactions.len()));

        let mut total_token_value = U256::zero();
        for (token_addr, balance) in &wallet.tokens {
            // Simplified: assume 1:1 ratio for demo
            total_token_value += *balance;
        }
        stats.insert("total_token_value".to_string(), total_token_value);

        Ok(stats)
    }

    pub async fn monitor_wallet(&self, address: Address) -> Result<(), Box<dyn std::error::Error>> {
        // This would set up monitoring for the wallet
        // For this example, we'll just update the balance
        self.update_wallet_balance(address).await?;
        Ok(())
    }

    pub async fn get_wallet_value(&self, address: Address) -> Result<U256, Box<dyn std::error::Error>> {
        let wallet = self.get_wallet(address).await?;
        let mut total_value = wallet.balance;

        for (token_addr, balance) in &wallet.tokens {
            // In a real implementation, you'd get the token price
            // For demo, we'll assume 1 ETH = 1 Token
            total_value += *balance;
        }

        Ok(total_value)
    }

    pub async fn generate_new_address(&self, name: &str, password: &str) -> Result<Address, Box<dyn std::error::Error>> {
        self.create_wallet(name, password).await
    }

    pub async fn change_wallet_password(&self, address: Address, old_password: &str, new_password: &str) -> Result<(), Box<dyn std::error::Error>> {
        let secret_key = self.unlock_wallet(address, old_password).await?;
        let new_encrypted_key = self.encrypt_private_key(&secret_key, new_password)?;

        let mut keystore = self.keystore.lock().await;
        keystore.insert(address.to_string(), new_encrypted_key);

        Ok(())
    }

    pub async fn validate_address(&self, address: &str) -> Result<bool, Box<dyn std::error::Error>> {
        Ok(address.starts_with("0x") && address.len() == 42 && hex::decode(&address[2..]).is_ok())
    }

    pub async fn get_wallet_addresses(&self) -> Result<Vec<Address>, Box<dyn std::error::Error>> {
        let wallets = self.wallets.lock().await;
        Ok(wallets.keys().filter_map(|k| k.parse().ok()).collect())
    }

    pub async fn rename_wallet(&self, address: Address, new_name: &str) -> Result<(), Box<dyn std::error::Error>> {
        let mut wallets = self.wallets.lock().await;
        if let Some(wallet) = wallets.get_mut(&address.to_string()) {
            wallet.name = new_name.to_string();
        }
        Ok(())
    }

    // Private helper methods
    async fn sign_and_send_transaction(&self, tx_request: TransactionRequest, secret_key: &SecretKey) -> Result<H256, Box<dyn std::error::Error>> {
        let gas_price = tx_request.gas_price.unwrap_or_else(|| self.web3.eth().gas_price().await.unwrap_or(U256::from(20000000000)));
        let gas_limit = tx_request.gas_limit.unwrap_or(U256::from(21000));
        let nonce = tx_request.nonce.unwrap_or_else(|| self.web3.eth().transaction_count(Address::zero(), None).await.unwrap_or(U256::zero()));

        let tx = web3::types::TransactionRequest {
            to: Some(tx_request.to),
            gas: Some(gas_limit),
            gas_price: Some(gas_price),
            value: Some(tx_request.value),
            data: tx_request.data.map(|d| d.into()),
            nonce: Some(nonce),
            ..Default::default()
        };

        let signed_tx = self.web3.accounts().sign_transaction(tx, &SecretKeyRef::new(secret_key)).await?;
        let tx_hash = self.web3.eth().send_raw_transaction(signed_tx.raw_transaction).await?;

        Ok(tx_hash)
    }

    fn encrypt_private_key(&self, secret_key: &SecretKey, password: &str) -> Result<EncryptedKey, Box<dyn std::error::Error>> {
        use aes_gcm::{Aes256Gcm, Key, Nonce};
        use aes_gcm::aead::{Aead, NewAead};

        let salt: [u8; 32] = rand::random();
        let mut key = [0u8; 32];
        pbkdf2::pbkdf2::<hmac::Hmac<sha2::Sha256>>(password.as_bytes(), &salt, 10000, &mut key);

        let cipher = Aes256Gcm::new(Key::from_slice(&key));
        let nonce: [u8; 12] = rand::random();
        let nonce = Nonce::from_slice(&nonce);

        let encrypted = cipher.encrypt(nonce, secret_key.secret_bytes().as_ref())?;

        Ok(EncryptedKey {
            address: public_key_to_address(&secret_key.public_key(&Secp256k1::new())),
            encrypted_private_key: encrypted,
            salt: salt.to_vec(),
            iv: nonce.to_vec(),
        })
    }

    fn decrypt_private_key(&self, encrypted_key: &EncryptedKey, password: &str) -> Result<SecretKey, Box<dyn std::error::Error>> {
        use aes_gcm::{Aes256Gcm, Key, Nonce};
        use aes_gcm::aead::{Aead, NewAead};

        let mut key = [0u8; 32];
        pbkdf2::pbkdf2::<hmac::Hmac<sha2::Sha256>>(password.as_bytes(), &encrypted_key.salt, 10000, &mut key);

        let cipher = Aes256Gcm::new(Key::from_slice(&key));
        let nonce = Nonce::from_slice(&encrypted_key.iv);

        let decrypted = cipher.decrypt(nonce, encrypted_key.encrypted_private_key.as_ref())?;
        let secret_key = SecretKey::from_slice(&decrypted)?;

        Ok(secret_key)
    }

    fn encode_address(&self, address: Address) -> web3::types::Bytes {
        let mut bytes = vec![0u8; 32];
        bytes[12..32].copy_from_slice(address.as_bytes());
        bytes.into()
    }

    fn encode_uint256(&self, value: U256) -> web3::types::Bytes {
        let mut bytes = vec![0u8; 32];
        value.to_big_endian(&mut bytes);
        bytes.into()
    }

    fn decode_uint256(&self, data: &[u8]) -> U256 {
        U256::from_big_endian(data)
    }
}

fn public_key_to_address(public_key: &secp256k1::PublicKey) -> Address {
    let public_key = public_key.serialize_uncompressed();
    let hash = web3::signing::keccak256(&public_key[1..]);
    Address::from_slice(&hash[12..])
}