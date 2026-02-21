use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use web3::types::{Address, U256, H256};
use web3::Web3;
use web3::transports::Http;

#[derive(Debug, Clone)]
pub struct SmartContract {
    address: Address,
    abi: Vec<u8>,
    web3: Arc<Web3<Http>>,
}

impl SmartContract {
    pub fn new(address: Address, abi: Vec<u8>, web3: Arc<Web3<Http>>) -> Self {
        Self { address, abi, web3 }
    }

    pub async fn deploy(&self, bytecode: Vec<u8>, constructor_args: Vec<u8>) -> Result<H256, Box<dyn std::error::Error>> {
        let accounts = self.web3.eth().accounts().await?;
        let from = accounts[0];

        let tx = web3::types::TransactionRequest {
            from: Some(from),
            to: None,
            gas: Some(U256::from(3000000)),
            gas_price: Some(self.web3.eth().gas_price().await?),
            value: Some(U256::zero()),
            data: Some(bytecode.into()),
            nonce: Some(self.web3.eth().transaction_count(from, None).await?),
            ..Default::default()
        };

        let signed_tx = self.web3.accounts().sign_transaction(tx, &web3::signing::SecretKeyRef::new(&[0; 32])).await?;
        let tx_hash = self.web3.eth().send_raw_transaction(signed_tx.raw_transaction).await?;

        Ok(tx_hash)
    }

    pub async fn call(&self, method: &str, params: Vec<web3::types::Bytes>) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let function_signature = web3::contract::tokens::Function::new(method, vec![], vec![], false)?;
        let data = function_signature.encode_input(params)?;

        let tx = web3::types::TransactionRequest {
            to: Some(self.address),
            data: Some(data.into()),
            ..Default::default()
        };

        let result = self.web3.eth().call(tx, None).await?;
        Ok(result.0)
    }

    pub async fn send_transaction(&self, method: &str, params: Vec<web3::types::Bytes>, value: U256) -> Result<H256, Box<dyn std::error::Error>> {
        let accounts = self.web3.eth().accounts().await?;
        let from = accounts[0];

        let function_signature = web3::contract::tokens::Function::new(method, vec![], vec![], false)?;
        let data = function_signature.encode_input(params)?;

        let tx = web3::types::TransactionRequest {
            from: Some(from),
            to: Some(self.address),
            gas: Some(U256::from(200000)),
            gas_price: Some(self.web3.eth().gas_price().await?),
            value: Some(value),
            data: Some(data.into()),
            nonce: Some(self.web3.eth().transaction_count(from, None).await?),
            ..Default::default()
        };

        let signed_tx = self.web3.accounts().sign_transaction(tx, &web3::signing::SecretKeyRef::new(&[0; 32])).await?;
        let tx_hash = self.web3.eth().send_raw_transaction(signed_tx.raw_transaction).await?;

        Ok(tx_hash)
    }

    pub async fn get_balance(&self, address: Address) -> Result<U256, Box<dyn std::error::Error>> {
        let balance = self.web3.eth().balance(address, None).await?;
        Ok(balance)
    }

    pub async fn estimate_gas(&self, method: &str, params: Vec<web3::types::Bytes>) -> Result<U256, Box<dyn std::error::Error>> {
        let function_signature = web3::contract::tokens::Function::new(method, vec![], vec![], false)?;
        let data = function_signature.encode_input(params)?;

        let tx = web3::types::TransactionRequest {
            to: Some(self.address),
            data: Some(data.into()),
            ..Default::default()
        };

        let gas_estimate = self.web3.eth().estimate_gas(tx, None).await?;
        Ok(gas_estimate)
    }

    pub async fn get_events(&self, event_name: &str, from_block: U256, to_block: U256) -> Result<Vec<web3::types::Log>, Box<dyn std::error::Error>> {
        let event_signature = web3::contract::tokens::Event::new(event_name, vec![])?;
        let topics = vec![Some(event_signature.signature())];

        let filter = web3::types::FilterBuilder::default()
            .address(vec![self.address])
            .topics(Some(topics), None, None, None)
            .from_block(web3::types::BlockNumber::Number(from_block))
            .to_block(web3::types::BlockNumber::Number(to_block))
            .build();

        let logs = self.web3.eth().logs(filter).await?;
        Ok(logs)
    }

    pub async fn get_contract_code(&self) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let code = self.web3.eth().code(self.address, None).await?;
        Ok(code.0)
    }

    pub async fn get_storage_at(&self, position: U256) -> Result<H256, Box<dyn std::error::Error>> {
        let storage = self.web3.eth().storage(self.address, position, None).await?;
        Ok(storage)
    }

    pub async fn get_transaction_receipt(&self, tx_hash: H256) -> Result<Option<web3::types::TransactionReceipt>, Box<dyn std::error::Error>> {
        let receipt = self.web3.eth().transaction_receipt(tx_hash).await?;
        Ok(receipt)
    }

    pub async fn wait_for_transaction(&self, tx_hash: H256, confirmations: usize) -> Result<web3::types::TransactionReceipt, Box<dyn std::error::Error>> {
        let receipt = self.web3.eth().wait_for_transaction_receipt(tx_hash, Some(std::time::Duration::from_secs(60)), confirmations).await?;
        Ok(receipt)
    }

    pub async fn get_block_number(&self) -> Result<U256, Box<dyn std::error::Error>> {
        let block_number = self.web3.eth().block_number().await?;
        Ok(block_number)
    }

    pub async fn get_gas_price(&self) -> Result<U256, Box<dyn std::error::Error>> {
        let gas_price = self.web3.eth().gas_price().await?;
        Ok(gas_price)
    }

    pub async fn get_chain_id(&self) -> Result<U256, Box<dyn std::error::Error>> {
        let chain_id = self.web3.eth().chain_id().await?;
        Ok(chain_id)
    }

    pub async fn get_accounts(&self) -> Result<Vec<Address>, Box<dyn std::error::Error>> {
        let accounts = self.web3.eth().accounts().await?;
        Ok(accounts)
    }

    pub async fn sign_message(&self, message: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let accounts = self.web3.eth().accounts().await?;
        let signature = self.web3.accounts().sign(message, &web3::signing::SecretKeyRef::new(&[0; 32])).await?;
        Ok(signature.to_vec())
    }

    pub async fn verify_signature(&self, message: &[u8], signature: &[u8], address: Address) -> Result<bool, Box<dyn std::error::Error>> {
        let recovered_address = self.web3.accounts().recover(message, signature)?;
        Ok(recovered_address == address)
    }

    pub async fn batch_call(&self, calls: Vec<(String, Vec<web3::types::Bytes>)>) -> Result<Vec<Vec<u8>>, Box<dyn std::error::Error>> {
        let mut results = Vec::new();
        for (method, params) in calls {
            let result = self.call(&method, params).await?;
            results.push(result);
        }
        Ok(results)
    }

    pub async fn multicall(&self, calls: Vec<(Address, Vec<u8>)>) -> Result<Vec<Vec<u8>>, Box<dyn std::error::Error>> {
        let mut results = Vec::new();
        for (target, data) in calls {
            let tx = web3::types::TransactionRequest {
                to: Some(target),
                data: Some(data.into()),
                ..Default::default()
            };
            let result = self.web3.eth().call(tx, None).await?;
            results.push(result.0);
        }
        Ok(results)
    }

    pub async fn simulate_transaction(&self, tx: web3::types::TransactionRequest) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let result = self.web3.eth().call(tx, None).await?;
        Ok(result.0)
    }

    pub async fn get_past_logs(&self, filter: web3::types::Filter) -> Result<Vec<web3::types::Log>, Box<dyn std::error::Error>> {
        let logs = self.web3.eth().logs(filter).await?;
        Ok(logs)
    }

    pub async fn subscribe_to_events(&self, event_name: &str) -> Result<web3::api::SubscriptionStream<web3::transports::Http, web3::types::Log>, Box<dyn std::error::Error>> {
        let event_signature = web3::contract::tokens::Event::new(event_name, vec![])?;
        let topics = vec![Some(event_signature.signature())];

        let filter = web3::types::FilterBuilder::default()
            .address(vec![self.address])
            .topics(Some(topics), None, None, None)
            .build();

        let subscription = self.web3.eth_subscribe().subscribe_logs(filter).await?;
        Ok(subscription)
    }

    pub async fn unsubscribe(&self, subscription_id: U256) -> Result<bool, Box<dyn std::error::Error>> {
        let result = self.web3.eth_unsubscribe().unsubscribe(subscription_id).await?;
        Ok(result)
    }

    pub async fn get_transaction_count(&self, address: Address) -> Result<U256, Box<dyn std::error::Error>> {
        let nonce = self.web3.eth().transaction_count(address, None).await?;
        Ok(nonce)
    }

    pub async fn get_block(&self, block_number: U256) -> Result<Option<web3::types::Block<H256>>, Box<dyn std::error::Error>> {
        let block = self.web3.eth().block(web3::types::BlockId::Number(web3::types::BlockNumber::Number(block_number))).await?;
        Ok(block)
    }

    pub async fn get_transaction(&self, tx_hash: H256) -> Result<Option<web3::types::Transaction>, Box<dyn std::error::Error>> {
        let tx = self.web3.eth().transaction(web3::types::TransactionId::Hash(tx_hash)).await?;
        Ok(tx)
    }

    pub async fn get_network_version(&self) -> Result<String, Box<dyn std::error::Error>> {
        let version = self.web3.net().version().await?;
        Ok(version)
    }

    pub async fn is_syncing(&self) -> Result<web3::types::SyncState, Box<dyn std::error::Error>> {
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

    pub async fn get_mining(&self) -> Result<bool, Box<dyn std::error::Error>> {
        let mining = self.web3.eth().mining().await?;
        Ok(mining)
    }

    pub async fn get_coinbase(&self) -> Result<Address, Box<dyn std::error::Error>> {
        let coinbase = self.web3.eth().coinbase().await?;
        Ok(coinbase)
    }

    pub async fn get_compilers(&self) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        let compilers = self.web3.eth().compilers().await?;
        Ok(compilers)
    }

    pub async fn compile_solidity(&self, source: &str) -> Result<HashMap<String, web3::types::Bytes>, Box<dyn std::error::Error>> {
        let compiled = self.web3.eth().compile_solidity(source).await?;
        Ok(compiled)
    }

    pub async fn compile_lll(&self, source: &str) -> Result<web3::types::Bytes, Box<dyn std::error::Error>> {
        let compiled = self.web3.eth().compile_lll(source).await?;
        Ok(compiled)
    }

    pub async fn compile_serpent(&self, source: &str) -> Result<web3::types::Bytes, Box<dyn std::error::Error>> {
        let compiled = self.web3.eth().compile_serpent(source).await?;
        Ok(compiled)
    }

    pub async fn new_filter(&self, filter: web3::types::Filter) -> Result<U256, Box<dyn std::error::Error>> {
        let filter_id = self.web3.eth().new_filter(filter).await?;
        Ok(filter_id)
    }

    pub async fn uninstall_filter(&self, filter_id: U256) -> Result<bool, Box<dyn std::error::Error>> {
        let result = self.web3.eth().uninstall_filter(filter_id).await?;
        Ok(result)
    }

    pub async fn get_filter_changes(&self, filter_id: U256) -> Result<web3::types::FilterChanges, Box<dyn std::error::Error>> {
        let changes = self.web3.eth().filter_changes(filter_id).await?;
        Ok(changes)
    }

    pub async fn get_filter_logs(&self, filter_id: U256) -> Result<Vec<web3::types::Log>, Box<dyn std::error::Error>> {
        let logs = self.web3.eth().filter_logs(filter_id).await?;
        Ok(logs)
    }

    pub async fn get_work(&self) -> Result<Vec<web3::types::Bytes>, Box<dyn std::error::Error>> {
        let work = self.web3.eth().work().await?;
        Ok(work)
    }

    pub async fn submit_work(&self, nonce: H256, header: H256, mix_digest: H256) -> Result<bool, Box<dyn std::error::Error>> {
        let result = self.web3.eth().submit_work(nonce, header, mix_digest).await?;
        Ok(result)
    }

    pub async fn submit_hashrate(&self, hashrate: U256, id: H256) -> Result<bool, Box<dyn std::error::Error>> {
        let result = self.web3.eth().submit_hashrate(hashrate, id).await?;
        Ok(result)
    }

    pub async fn shh_version(&self) -> Result<String, Box<dyn std::error::Error>> {
        let version = self.web3.shh().version().await?;
        Ok(version)
    }

    pub async fn shh_post(&self, message: web3::types::WhisperPost) -> Result<bool, Box<dyn std::error::Error>> {
        let result = self.web3.shh().post(message).await?;
        Ok(result)
    }

    pub async fn shh_new_identity(&self) -> Result<Address, Box<dyn std::error::Error>> {
        let identity = self.web3.shh().new_identity().await?;
        Ok(identity)
    }

    pub async fn shh_has_identity(&self, identity: Address) -> Result<bool, Box<dyn std::error::Error>> {
        let has_identity = self.web3.shh().has_identity(identity).await?;
        Ok(has_identity)
    }

    pub async fn shh_new_group(&self) -> Result<Address, Box<dyn std::error::Error>> {
        let group = self.web3.shh().new_group().await?;
        Ok(group)
    }

    pub async fn shh_add_to_group(&self, group: Address) -> Result<bool, Box<dyn std::error::Error>> {
        let result = self.web3.shh().add_to_group(group).await?;
        Ok(result)
    }

    pub async fn shh_new_filter(&self, filter: web3::types::WhisperFilter) -> Result<U256, Box<dyn std::error::Error>> {
        let filter_id = self.web3.shh().new_filter(filter).await?;
        Ok(filter_id)
    }

    pub async fn shh_uninstall_filter(&self, filter_id: U256) -> Result<bool, Box<dyn std::error::Error>> {
        let result = self.web3.shh().uninstall_filter(filter_id).await?;
        Ok(result)
    }

    pub async fn shh_get_filter_changes(&self, filter_id: U256) -> Result<Vec<web3::types::WhisperMessage>, Box<dyn std::error::Error>> {
        let changes = self.web3.shh().get_filter_changes(filter_id).await?;
        Ok(changes)
    }

    pub async fn shh_get_messages(&self, filter_id: U256) -> Result<Vec<web3::types::WhisperMessage>, Box<dyn std::error::Error>> {
        let messages = self.web3.shh().get_messages(filter_id).await?;
        Ok(messages)
    }
}