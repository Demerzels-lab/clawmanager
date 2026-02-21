use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use web3::types::{Address, U256, H256, BlockNumber, Transaction, Log, Filter};
use web3::Web3;
use web3::transports::Http;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockchainUtils {
    web3: Arc<Web3<Http>>,
    network_info: Arc<Mutex<NetworkInfo>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInfo {
    pub chain_id: U256,
    pub network_name: String,
    pub rpc_url: String,
    pub block_time: u64,
    pub gas_price: U256,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionInfo {
    pub hash: H256,
    pub from: Address,
    pub to: Option<Address>,
    pub value: U256,
    pub gas_price: U256,
    pub gas_limit: U256,
    pub gas_used: Option<U256>,
    pub status: Option<bool>,
    pub block_number: Option<U256>,
    pub timestamp: Option<U256>,
    pub logs: Vec<Log>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockInfo {
    pub number: U256,
    pub hash: H256,
    pub parent_hash: H256,
    pub timestamp: U256,
    pub gas_used: U256,
    pub gas_limit: U256,
    pub transactions: Vec<H256>,
    pub transaction_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountInfo {
    pub address: Address,
    pub balance: U256,
    pub nonce: U256,
    pub code: Vec<u8>,
    pub storage: HashMap<H256, H256>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractInfo {
    pub address: Address,
    pub creator: Address,
    pub creation_tx: H256,
    pub deployed_at: U256,
    pub bytecode: Vec<u8>,
    pub abi: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenInfo {
    pub address: Address,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: U256,
    pub owner: Option<Address>,
}

impl BlockchainUtils {
    pub async fn new(rpc_url: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let transport = Http::new(rpc_url)?;
        let web3 = Arc::new(Web3::new(transport));

        let chain_id = web3.eth().chain_id().await?;
        let network_name = Self::get_network_name(chain_id);
        let gas_price = web3.eth().gas_price().await?;
        let block_time = Self::estimate_block_time(&web3).await?;

        let network_info = NetworkInfo {
            chain_id,
            network_name,
            rpc_url: rpc_url.to_string(),
            block_time,
            gas_price,
        };

        Ok(Self {
            web3,
            network_info: Arc::new(Mutex::new(network_info)),
        })
    }

    fn get_network_name(chain_id: U256) -> String {
        match chain_id.as_u64() {
            1 => "Ethereum Mainnet".to_string(),
            3 => "Ropsten Testnet".to_string(),
            4 => "Rinkeby Testnet".to_string(),
            5 => "Goerli Testnet".to_string(),
            42 => "Kovan Testnet".to_string(),
            56 => "Binance Smart Chain".to_string(),
            97 => "BSC Testnet".to_string(),
            137 => "Polygon Mainnet".to_string(),
            80001 => "Mumbai Testnet".to_string(),
            43114 => "Avalanche C-Chain".to_string(),
            43113 => "Avalanche Fuji Testnet".to_string(),
            _ => format!("Unknown Network ({})", chain_id),
        }
    }

    async fn estimate_block_time(web3: &Web3<Http>) -> u64 {
        // Estimate average block time by checking recent blocks
        let latest_block = web3.eth().block_number().await.unwrap_or(U256::zero());
        if latest_block < U256::from(10) {
            return 15; // Default to 15 seconds for new networks
        }

        let mut timestamps = Vec::new();
        for i in 0..10 {
            if let Some(block) = web3.eth().block(BlockNumber::Number(latest_block - i)).await.unwrap_or(None) {
                timestamps.push(block.timestamp.as_u64());
            }
        }

        if timestamps.len() < 2 {
            return 15;
        }

        let mut total_diff = 0u64;
        for i in 1..timestamps.len() {
            total_diff += timestamps[i - 1] - timestamps[i];
        }

        total_diff / (timestamps.len() - 1) as u64
    }

    pub async fn get_network_info(&self) -> NetworkInfo {
        self.network_info.lock().await.clone()
    }

    pub async fn update_network_info(&self) -> Result<(), Box<dyn std::error::Error>> {
        let gas_price = self.web3.eth().gas_price().await?;
        let block_time = Self::estimate_block_time(&self.web3).await?;

        let mut network_info = self.network_info.lock().await;
        network_info.gas_price = gas_price;
        network_info.block_time = block_time;

        Ok(())
    }

    pub async fn get_block_info(&self, block_number: Option<U256>) -> Result<BlockInfo, Box<dyn std::error::Error>> {
        let block_number = block_number.unwrap_or_else(|| BlockNumber::Latest.into());
        let block = self.web3.eth().block(BlockNumber::Number(block_number)).await?
            .ok_or("Block not found")?;

        let transaction_count = block.transactions.len();

        Ok(BlockInfo {
            number: block.number.unwrap_or(U256::zero()),
            hash: block.hash.unwrap_or(H256::zero()),
            parent_hash: block.parent_hash,
            timestamp: block.timestamp,
            gas_used: block.gas_used,
            gas_limit: block.gas_limit,
            transactions: block.transactions,
            transaction_count,
        })
    }

    pub async fn get_transaction_info(&self, tx_hash: H256) -> Result<TransactionInfo, Box<dyn std::error::Error>> {
        let tx = self.web3.eth().transaction(tx_hash.into()).await?
            .ok_or("Transaction not found")?;

        let receipt = self.web3.eth().transaction_receipt(tx_hash).await?;
        let block = if let Some(block_number) = tx.block_number {
            self.web3.eth().block(BlockNumber::Number(block_number)).await?
        } else {
            None
        };

        Ok(TransactionInfo {
            hash: tx.hash,
            from: tx.from.unwrap_or(Address::zero()),
            to: tx.to,
            value: tx.value,
            gas_price: tx.gas_price.unwrap_or(U256::zero()),
            gas_limit: tx.gas.unwrap_or(U256::zero()),
            gas_used: receipt.as_ref().map(|r| r.gas_used),
            status: receipt.as_ref().and_then(|r| r.status.map(|s| s.as_u64() == 1)),
            block_number: tx.block_number.map(|bn| bn.into()),
            timestamp: block.as_ref().map(|b| b.timestamp),
            logs: receipt.map(|r| r.logs).unwrap_or_default(),
        })
    }

    pub async fn get_account_info(&self, address: Address) -> Result<AccountInfo, Box<dyn std::error::Error>> {
        let balance = self.web3.eth().balance(address, None).await?;
        let nonce = self.web3.eth().transaction_count(address, None).await?;
        let code = self.web3.eth().code(address, None).await?;

        // Get some storage slots (first 10)
        let mut storage = HashMap::new();
        for i in 0..10 {
            let slot = H256::from_low_u64_be(i);
            if let Ok(value) = self.web3.eth().storage(address, slot.into(), None).await {
                storage.insert(slot, value);
            }
        }

        Ok(AccountInfo {
            address,
            balance,
            nonce,
            code: code.0,
            storage,
        })
    }

    pub async fn get_contract_info(&self, address: Address) -> Result<ContractInfo, Box<dyn std::error::Error>> {
        let code = self.web3.eth().code(address, None).await?;
        if code.0.is_empty() {
            return Err("Address is not a contract".into());
        }

        // Find contract creation transaction
        let creation_info = self.find_contract_creation(address).await?;

        Ok(ContractInfo {
            address,
            creator: creation_info.0,
            creation_tx: creation_info.1,
            deployed_at: creation_info.2,
            bytecode: code.0,
            abi: None, // Would need to be provided or fetched from external source
        })
    }

    async fn find_contract_creation(&self, address: Address) -> Result<(Address, H256, U256), Box<dyn std::error::Error>> {
        // This is a simplified implementation. In practice, you'd need to search through
        // transaction history to find the creation transaction.
        // For this example, we'll return mock data.
        Ok((Address::zero(), H256::zero(), U256::zero()))
    }

    pub async fn get_token_info(&self, address: Address) -> Result<TokenInfo, Box<dyn std::error::Error>> {
        let contract = super::smart_contract::SmartContract::new(address, vec![], self.web3.clone());

        let name_bytes = contract.call("name", vec![]).await?;
        let name = String::from_utf8_lossy(&name_bytes).to_string();

        let symbol_bytes = contract.call("symbol", vec![]).await?;
        let symbol = String::from_utf8_lossy(&symbol_bytes).to_string();

        let decimals: u8 = self.decode_uint256(&contract.call("decimals", vec![]).await?).as_u64() as u8;
        let total_supply = self.decode_uint256(&contract.call("totalSupply", vec![]).await?);

        let owner = contract.call("owner", vec![]).await.ok()
            .map(|data| self.decode_address(&data));

        Ok(TokenInfo {
            address,
            name,
            symbol,
            decimals,
            total_supply,
            owner,
        })
    }

    pub async fn get_logs(&self, filter: Filter) -> Result<Vec<Log>, Box<dyn std::error::Error>> {
        let logs = self.web3.eth().logs(filter).await?;
        Ok(logs)
    }

    pub async fn estimate_gas(&self, tx: web3::types::TransactionRequest) -> Result<U256, Box<dyn std::error::Error>> {
        let gas_estimate = self.web3.eth().estimate_gas(tx, None).await?;
        Ok(gas_estimate)
    }

    pub async fn get_gas_price(&self) -> Result<U256, Box<dyn std::error::Error>> {
        let gas_price = self.web3.eth().gas_price().await?;
        Ok(gas_price)
    }

    pub async fn get_pending_transactions(&self) -> Result<Vec<H256>, Box<dyn std::error::Error>> {
        let pending_block = self.web3.eth().block(BlockNumber::Pending).await?;
        Ok(pending_block.map(|b| b.transactions).unwrap_or_default())
    }

    pub async fn get_mempool_size(&self) -> Result<usize, Box<dyn std::error::Error>> {
        let pending_txs = self.get_pending_transactions().await?;
        Ok(pending_txs.len())
    }

    pub async fn get_sync_status(&self) -> Result<web3::types::SyncState, Box<dyn std::error::Error>> {
        let sync_state = self.web3.eth().syncing().await?;
        Ok(sync_state)
    }

    pub async fn get_peer_count(&self) -> Result<U256, Box<dyn std::error::Error>> {
        let peer_count = self.web3.net().peer_count().await?;
        Ok(peer_count)
    }

    pub async fn get_hashrate(&self) -> Result<U256, Box<dyn std::error::Error>> {
        let hashrate = self.web3.eth().hashrate().await?;
        Ok(hashrate)
    }

    pub async fn get_mining_status(&self) -> Result<bool, Box<dyn std::error::Error>> {
        let mining = self.web3.eth().mining().await?;
        Ok(mining)
    }

    pub async fn get_node_info(&self) -> Result<String, Box<dyn std::error::Error>> {
        let client_version = self.web3.web3().client_version().await?;
        Ok(client_version)
    }

    pub async fn get_protocol_version(&self) -> Result<String, Box<dyn std::error::Error>> {
        let protocol_version = self.web3.eth().protocol_version().await?;
        Ok(protocol_version.to_string())
    }

    pub async fn get_network_id(&self) -> Result<String, Box<dyn std::error::Error>> {
        let network_id = self.web3.net().version().await?;
        Ok(network_id)
    }

    pub async fn is_listening(&self) -> Result<bool, Box<dyn std::error::Error>> {
        let listening = self.web3.net().listening().await?;
        Ok(listening)
    }

    pub async fn get_accounts(&self) -> Result<Vec<Address>, Box<dyn std::error::Error>> {
        let accounts = self.web3.eth().accounts().await?;
        Ok(accounts)
    }

    pub async fn sign_message(&self, address: Address, message: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let signature = self.web3.accounts().sign(message, &web3::signing::SecretKeyRef::new(&[0; 32])).await?;
        Ok(signature.to_vec())
    }

    pub async fn verify_signature(&self, message: &[u8], signature: &[u8], address: Address) -> Result<bool, Box<dyn std::error::Error>> {
        let recovered_address = self.web3.accounts().recover(message, signature)?;
        Ok(recovered_address == address)
    }

    pub async fn get_transaction_count(&self, address: Address) -> Result<U256, Box<dyn std::error::Error>> {
        let nonce = self.web3.eth().transaction_count(address, None).await?;
        Ok(nonce)
    }

    pub async fn get_code_at(&self, address: Address) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let code = self.web3.eth().code(address, None).await?;
        Ok(code.0)
    }

    pub async fn get_storage_at(&self, address: Address, position: U256) -> Result<H256, Box<dyn std::error::Error>> {
        let storage = self.web3.eth().storage(address, position, None).await?;
        Ok(storage)
    }

    pub async fn call_contract(&self, address: Address, data: Vec<u8>) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let tx = web3::types::TransactionRequest {
            to: Some(address),
            data: Some(data.into()),
            ..Default::default()
        };

        let result = self.web3.eth().call(tx, None).await?;
        Ok(result.0)
    }

    pub async fn send_raw_transaction(&self, raw_tx: Vec<u8>) -> Result<H256, Box<dyn std::error::Error>> {
        let tx_hash = self.web3.eth().send_raw_transaction(raw_tx.into()).await?;
        Ok(tx_hash)
    }

    pub async fn get_past_events(&self, address: Address, from_block: U256, to_block: U256, topics: Option<Vec<Option<H256>>>) -> Result<Vec<Log>, Box<dyn std::error::Error>> {
        let filter = Filter {
            from_block: BlockNumber::Number(from_block).into(),
            to_block: BlockNumber::Number(to_block).into(),
            address: Some(vec![address]),
            topics,
            ..Default::default()
        };

        self.get_logs(filter).await
    }

    pub async fn watch_contract_events(&self, address: Address, event_signature: H256) -> Result<(), Box<dyn std::error::Error>> {
        let filter = Filter {
            address: Some(vec![address]),
            topics: Some(vec![Some(event_signature)]),
            ..Default::default()
        };

        let subscription = self.web3.eth_subscribe().subscribe_logs(filter).await?;
        println!("Subscribed to contract events. Press Ctrl+C to stop.");

        subscription.for_each(|log| async {
            match log {
                Ok(log) => println!("Received event: {:?}", log),
                Err(e) => eprintln!("Error receiving event: {:?}", e),
            }
        }).await;

        Ok(())
    }

    pub async fn get_block_time(&self, block_number: U256) -> Result<U256, Box<dyn std::error::Error>> {
        let block = self.web3.eth().block(BlockNumber::Number(block_number)).await?
            .ok_or("Block not found")?;
        Ok(block.timestamp)
    }

    pub async fn calculate_block_time_average(&self, blocks: usize) -> Result<f64, Box<dyn std::error::Error>> {
        let latest_block = self.web3.eth().block_number().await?;
        let mut timestamps = Vec::new();

        for i in 0..blocks {
            if let Some(block_number) = latest_block.checked_sub(U256::from(i)) {
                if let Ok(timestamp) = self.get_block_time(block_number).await {
                    timestamps.push(timestamp.as_u64());
                }
            }
        }

        if timestamps.len() < 2 {
            return Ok(15.0); // Default block time
        }

        let mut total_diff = 0u64;
        for i in 1..timestamps.len() {
            total_diff += timestamps[i - 1] - timestamps[i];
        }

        Ok(total_diff as f64 / (timestamps.len() - 1) as f64)
    }

    pub async fn get_address_balance_history(&self, address: Address, from_block: U256, to_block: U256) -> Result<Vec<(U256, U256)>, Box<dyn std::error::Error>> {
        let mut balances = Vec::new();

        for block_number in (from_block.as_u64()..=to_block.as_u64()).step_by(100) {
            let balance = self.web3.eth().balance(address, Some(BlockNumber::Number(U256::from(block_number)).into())).await?;
            balances.push((U256::from(block_number), balance));
        }

        Ok(balances)
    }

    pub async fn get_transaction_volume(&self, from_block: U256, to_block: U256) -> Result<U256, Box<dyn std::error::Error>> {
        let mut total_volume = U256::zero();

        for block_number in from_block.as_u64()..=to_block.as_u64() {
            if let Ok(block) = self.web3.eth().block(BlockNumber::Number(U256::from(block_number))).await {
                if let Some(block) = block {
                    for tx_hash in &block.transactions {
                        if let Ok(tx) = self.web3.eth().transaction(tx_hash.clone().into()).await {
                            if let Some(tx) = tx {
                                total_volume += tx.value;
                            }
                        }
                    }
                }
            }
        }

        Ok(total_volume)
    }

    pub async fn get_gas_usage_stats(&self, from_block: U256, to_block: U256) -> Result<(U256, U256, f64), Box<dyn std::error::Error>> {
        let mut total_gas_used = U256::zero();
        let mut total_gas_limit = U256::zero();
        let mut block_count = 0u64;

        for block_number in from_block.as_u64()..=to_block.as_u64() {
            if let Ok(block) = self.web3.eth().block(BlockNumber::Number(U256::from(block_number))).await {
                if let Some(block) = block {
                    total_gas_used += block.gas_used;
                    total_gas_limit += block.gas_limit;
                    block_count += 1;
                }
            }
        }

        let average_gas_usage = if block_count > 0 {
            total_gas_used.as_u128() as f64 / total_gas_limit.as_u128() as f64
        } else {
            0.0
        };

        Ok((total_gas_used, total_gas_limit, average_gas_usage))
    }

    pub async fn decode_transaction_input(&self, input: &[u8]) -> Result<(String, Vec<String>), Box<dyn std::error::Error>> {
        if input.len() < 4 {
            return Ok(("".to_string(), vec![]));
        }

        let function_signature = &input[0..4];
        let params = &input[4..];

        // This is a simplified implementation. In practice, you'd need a proper ABI decoder.
        let function_name = format!("0x{}", hex::encode(function_signature));
        let param_strings = vec![hex::encode(params)];

        Ok((function_name, param_strings))
    }

    pub async fn encode_function_call(&self, function_signature: &str, params: Vec<web3::types::Bytes>) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        // This is a simplified implementation. In practice, you'd use a proper ABI encoder.
        let mut encoded = Vec::new();
        encoded.extend_from_slice(&hex::decode(&function_signature[2..])?);

        for param in params {
            encoded.extend_from_slice(&param.0);
        }

        Ok(encoded)
    }

    pub async fn get_contract_events(&self, address: Address, event_signature: &str, from_block: U256) -> Result<Vec<Log>, Box<dyn std::error::Error>> {
        let event_topic = web3::contract::tokens::Event::new(event_signature, vec![])?.signature();

        let filter = Filter {
            from_block: BlockNumber::Number(from_block).into(),
            address: Some(vec![address]),
            topics: Some(vec![Some(event_topic)]),
            ..Default::default()
        };

        self.get_logs(filter).await
    }

    pub async fn simulate_transaction(&self, tx: web3::types::TransactionRequest) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let result = self.web3.eth().call(tx, None).await?;
        Ok(result.0)
    }

    pub async fn get_transaction_trace(&self, tx_hash: H256) -> Result<String, Box<dyn std::error::Error>> {
        // This would require a tracing-enabled node like Geth with debug API
        // For this example, we'll return a mock trace
        Ok(format!("Mock trace for transaction {}", tx_hash))
    }

    pub async fn get_block_transaction_count(&self, block_number: U256) -> Result<U256, Box<dyn std::error::Error>> {
        let count = self.web3.eth().block_transaction_count(BlockNumber::Number(block_number)).await?;
        Ok(count)
    }

    pub async fn get_uncle_count(&self, block_number: U256) -> Result<U256, Box<dyn std::error::Error>> {
        let count = self.web3.eth().block_uncles_count(BlockNumber::Number(block_number)).await?;
        Ok(count)
    }

    pub async fn get_uncle(&self, block_number: U256, uncle_index: U256) -> Result<Option<web3::types::Block<H256>>, Box<dyn std::error::Error>> {
        let uncle = self.web3.eth().uncle(BlockNumber::Number(block_number), uncle_index).await?;
        Ok(uncle)
    }

    pub async fn get_work(&self) -> Result<Vec<web3::types::Bytes>, Box<dyn std::error::Error>> {
        let work = self.web3.eth().work().await?;
        Ok(work)
    }

    pub async fn submit_work(&self, nonce: H256, header: H256, mix_digest: H256) -> Result<bool, Box<dyn std::error::Error>> {
        let result = self.web3.eth().submit_work(nonce, header, mix_digest).await?;
        Ok(result)
    }

    pub async fn get_coinbase(&self) -> Result<Address, Box<dyn std::error::Error>> {
        let coinbase = self.web3.eth().coinbase().await?;
        Ok(coinbase)
    }

    pub async fn is_contract(&self, address: Address) -> Result<bool, Box<dyn std::error::Error>> {
        let code = self.web3.eth().code(address, None).await?;
        Ok(!code.0.is_empty())
    }

    pub async fn get_proxy_implementation(&self, proxy_address: Address) -> Result<Option<Address>, Box<dyn std::error::Error>> {
        // Check for EIP-1967 proxy implementation slot
        let implementation_slot = H256::from_slice(&hex::decode("360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc")?);
        let implementation = self.web3.eth().storage(proxy_address, implementation_slot.into(), None).await?;
        let implementation_address = Address::from_slice(&implementation.as_bytes()[12..32]);

        if implementation_address != Address::zero() {
            Ok(Some(implementation_address))
        } else {
            Ok(None)
        }
    }

    pub async fn get_contract_size(&self, address: Address) -> Result<usize, Box<dyn std::error::Error>> {
        let code = self.web3.eth().code(address, None).await?;
        Ok(code.0.len())
    }

    pub async fn batch_call(&self, calls: Vec<web3::types::TransactionRequest>) -> Result<Vec<Vec<u8>>, Box<dyn std::error::Error>> {
        let mut results = Vec::new();
        for call in calls {
            let result = self.web3.eth().call(call, None).await?;
            results.push(result.0);
        }
        Ok(results)
    }

    // Helper functions for encoding/decoding
    fn decode_address(&self, data: &[u8]) -> Address {
        Address::from_slice(&data[12..32])
    }

    fn decode_uint256(&self, data: &[u8]) -> U256 {
        U256::from_big_endian(data)
    }
}