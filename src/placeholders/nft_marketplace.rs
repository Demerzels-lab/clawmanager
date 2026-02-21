use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use web3::types::{Address, U256, H256};
use web3::Web3;
use web3::transports::Http;

#[derive(Debug, Clone)]
pub struct NFTMarketplace {
    web3: Arc<Web3<Http>>,
    marketplace_contract: Address,
    nft_contracts: HashMap<String, Address>,
    listings: Arc<Mutex<HashMap<U256, NFTListing>>>,
}

#[derive(Debug, Clone)]
pub struct NFTListing {
    pub token_id: U256,
    pub nft_contract: Address,
    pub seller: Address,
    pub price: U256,
    pub currency: Address,
    pub active: bool,
    pub created_at: U256,
}

#[derive(Debug, Clone)]
pub struct NFTCollection {
    pub address: Address,
    pub name: String,
    pub symbol: String,
    pub total_supply: U256,
    pub floor_price: U256,
    pub volume_traded: U256,
}

#[derive(Debug, Clone)]
pub struct NFTTrait {
    pub trait_type: String,
    pub value: String,
    pub rarity: f64,
}

#[derive(Debug, Clone)]
pub struct NFTMetadata {
    pub name: String,
    pub description: String,
    pub image: String,
    pub attributes: Vec<NFTTrait>,
    pub rarity_score: f64,
}

impl NFTMarketplace {
    pub fn new(web3: Arc<Web3<Http>>, marketplace_contract: Address) -> Self {
        let mut nft_contracts = HashMap::new();
        nft_contracts.insert("cryptopunks".to_string(), Address::from_low_u64_be(1));
        nft_contracts.insert("bored_ape_yacht_club".to_string(), Address::from_low_u64_be(2));
        nft_contracts.insert("world_of_women".to_string(), Address::from_low_u64_be(3));
        nft_contracts.insert("azuki".to_string(), Address::from_low_u64_be(4));
        nft_contracts.insert("doodles".to_string(), Address::from_low_u64_be(5));

        Self {
            web3,
            marketplace_contract,
            nft_contracts,
            listings: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn create_listing(&self, nft_contract: Address, token_id: U256, price: U256, currency: Address) -> Result<H256, Box<dyn std::error::Error>> {
        let marketplace_contract = super::smart_contract::SmartContract::new(self.marketplace_contract, vec![], self.web3.clone());

        let tx_hash = marketplace_contract.send_transaction(
            "createListing",
            vec![
                self.encode_address(nft_contract),
                self.encode_uint256(token_id),
                self.encode_uint256(price),
                self.encode_address(currency),
            ],
            U256::zero(),
        ).await?;

        let listing = NFTListing {
            token_id,
            nft_contract,
            seller: Address::zero(), // Would be set by contract
            price,
            currency,
            active: true,
            created_at: U256::from(std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH)?.as_secs()),
        };

        let mut listings = self.listings.lock().await;
        listings.insert(token_id, listing);

        Ok(tx_hash)
    }

    pub async fn cancel_listing(&self, nft_contract: Address, token_id: U256) -> Result<H256, Box<dyn std::error::Error>> {
        let marketplace_contract = super::smart_contract::SmartContract::new(self.marketplace_contract, vec![], self.web3.clone());

        let tx_hash = marketplace_contract.send_transaction(
            "cancelListing",
            vec![
                self.encode_address(nft_contract),
                self.encode_uint256(token_id),
            ],
            U256::zero(),
        ).await?;

        let mut listings = self.listings.lock().await;
        if let Some(listing) = listings.get_mut(&token_id) {
            listing.active = false;
        }

        Ok(tx_hash)
    }

    pub async fn buy_nft(&self, nft_contract: Address, token_id: U256, max_price: U256) -> Result<H256, Box<dyn std::error::Error>> {
        let marketplace_contract = super::smart_contract::SmartContract::new(self.marketplace_contract, vec![], self.web3.clone());

        let tx_hash = marketplace_contract.send_transaction(
            "buyNFT",
            vec![
                self.encode_address(nft_contract),
                self.encode_uint256(token_id),
            ],
            max_price,
        ).await?;

        let mut listings = self.listings.lock().await;
        listings.remove(&token_id);

        Ok(tx_hash)
    }

    pub async fn make_offer(&self, nft_contract: Address, token_id: U256, price: U256, currency: Address, expiration: U256) -> Result<H256, Box<dyn std::error::Error>> {
        let marketplace_contract = super::smart_contract::SmartContract::new(self.marketplace_contract, vec![], self.web3.clone());

        let tx_hash = marketplace_contract.send_transaction(
            "makeOffer",
            vec![
                self.encode_address(nft_contract),
                self.encode_uint256(token_id),
                self.encode_uint256(price),
                self.encode_address(currency),
                self.encode_uint256(expiration),
            ],
            U256::zero(),
        ).await?;

        Ok(tx_hash)
    }

    pub async fn accept_offer(&self, nft_contract: Address, token_id: U256, offer_maker: Address) -> Result<H256, Box<dyn std::error::Error>> {
        let marketplace_contract = super::smart_contract::SmartContract::new(self.marketplace_contract, vec![], self.web3.clone());

        let tx_hash = marketplace_contract.send_transaction(
            "acceptOffer",
            vec![
                self.encode_address(nft_contract),
                self.encode_uint256(token_id),
                self.encode_address(offer_maker),
            ],
            U256::zero(),
        ).await?;

        let mut listings = self.listings.lock().await;
        listings.remove(&token_id);

        Ok(tx_hash)
    }

    pub async fn get_listing(&self, nft_contract: Address, token_id: U256) -> Result<Option<NFTListing>, Box<dyn std::error::Error>> {
        let marketplace_contract = super::smart_contract::SmartContract::new(self.marketplace_contract, vec![], self.web3.clone());

        let result = marketplace_contract.call(
            "getListing",
            vec![
                self.encode_address(nft_contract),
                self.encode_uint256(token_id),
            ],
        ).await?;

        if result.is_empty() {
            return Ok(None);
        }

        let listing = NFTListing {
            token_id,
            nft_contract,
            seller: self.decode_address(&result[12..32]),
            price: self.decode_uint256(&result[32..64]),
            currency: self.decode_address(&result[76..96]),
            active: result[96] != 0,
            created_at: self.decode_uint256(&result[97..129]),
        };

        Ok(Some(listing))
    }

    pub async fn get_all_listings(&self) -> Result<Vec<NFTListing>, Box<dyn std::error::Error>> {
        let marketplace_contract = super::smart_contract::SmartContract::new(self.marketplace_contract, vec![], self.web3.clone());

        let total_listings: U256 = self.decode_uint256(&marketplace_contract.call("getTotalListings", vec![]).await?);

        let mut listings = Vec::new();
        for i in 0..total_listings.as_u64() {
            let listing_data = marketplace_contract.call("getListingByIndex", vec![self.encode_uint256(U256::from(i))]).await?;
            let token_id = self.decode_uint256(&listing_data[0..32]);
            let nft_contract = self.decode_address(&listing_data[32..52]);

            if let Some(listing) = self.get_listing(nft_contract, token_id).await? {
                listings.push(listing);
            }
        }

        Ok(listings)
    }

    pub async fn get_nft_metadata(&self, nft_contract: Address, token_id: U256) -> Result<NFTMetadata, Box<dyn std::error::Error>> {
        let nft_contract_instance = super::smart_contract::SmartContract::new(nft_contract, vec![], self.web3.clone());

        let token_uri: String = String::from_utf8(nft_contract_instance.call("tokenURI", vec![self.encode_uint256(token_id)]).await?)?;

        // In a real implementation, you'd fetch the metadata from IPFS or HTTP URL
        // For this example, we'll create mock metadata
        let metadata = NFTMetadata {
            name: format!("NFT #{}", token_id),
            description: "A unique digital collectible".to_string(),
            image: format!("ipfs://QmExample{}", token_id),
            attributes: vec![
                NFTTrait {
                    trait_type: "Background".to_string(),
                    value: "Blue".to_string(),
                    rarity: 0.3,
                },
                NFTTrait {
                    trait_type: "Eyes".to_string(),
                    value: "Laser".to_string(),
                    rarity: 0.1,
                },
            ],
            rarity_score: 85.5,
        };

        Ok(metadata)
    }

    pub async fn get_collection_info(&self, collection_address: Address) -> Result<NFTCollection, Box<dyn std::error::Error>> {
        let nft_contract = super::smart_contract::SmartContract::new(collection_address, vec![], self.web3.clone());

        let name: String = String::from_utf8(nft_contract.call("name", vec![]).await?)?;
        let symbol: String = String::from_utf8(nft_contract.call("symbol", vec![]).await?)?;
        let total_supply: U256 = self.decode_uint256(&nft_contract.call("totalSupply", vec![]).await?);

        // Mock floor price and volume - in reality, you'd calculate these from marketplace data
        let floor_price = U256::from(1000000000000000000); // 1 ETH
        let volume_traded = U256::from(1000000000000000000000); // 1000 ETH

        Ok(NFTCollection {
            address: collection_address,
            name,
            symbol,
            total_supply,
            floor_price,
            volume_traded,
        })
    }

    pub async fn get_collection_floor_price(&self, collection_address: Address) -> Result<U256, Box<dyn std::error::Error>> {
        let listings = self.get_all_listings().await?;
        let mut prices = Vec::new();

        for listing in listings {
            if listing.nft_contract == collection_address && listing.active {
                prices.push(listing.price);
            }
        }

        if prices.is_empty() {
            return Ok(U256::zero());
        }

        prices.sort();
        Ok(prices[0])
    }

    pub async fn get_nft_ownership_history(&self, nft_contract: Address, token_id: U256) -> Result<Vec<(Address, U256)>, Box<dyn std::error::Error>> {
        // This would typically query transfer events from the NFT contract
        // For this example, we'll return mock data
        let history = vec![
            (Address::from_low_u64_be(1), U256::from(1000000)),
            (Address::from_low_u64_be(2), U256::from(2000000)),
            (Address::from_low_u64_be(3), U256::from(3000000)),
        ];

        Ok(history)
    }

    pub async fn calculate_nft_rarity(&self, nft_contract: Address, token_id: U256) -> Result<f64, Box<dyn std::error::Error>> {
        let metadata = self.get_nft_metadata(nft_contract, token_id).await?;
        Ok(metadata.rarity_score)
    }

    pub async fn batch_list_nfts(&self, listings: Vec<(Address, U256, U256, Address)>) -> Result<Vec<H256>, Box<dyn std::error::Error>> {
        let mut transaction_hashes = Vec::new();

        for (nft_contract, token_id, price, currency) in listings {
            let tx_hash = self.create_listing(nft_contract, token_id, price, currency).await?;
            transaction_hashes.push(tx_hash);
        }

        Ok(transaction_hashes)
    }

    pub async fn batch_buy_nfts(&self, purchases: Vec<(Address, U256, U256)>) -> Result<Vec<H256>, Box<dyn std::error::Error>> {
        let mut transaction_hashes = Vec::new();

        for (nft_contract, token_id, max_price) in purchases {
            let tx_hash = self.buy_nft(nft_contract, token_id, max_price).await?;
            transaction_hashes.push(tx_hash);
        }

        Ok(transaction_hashes)
    }

    pub async fn get_marketplace_stats(&self) -> Result<HashMap<String, U256>, Box<dyn std::error::Error>> {
        let marketplace_contract = super::smart_contract::SmartContract::new(self.marketplace_contract, vec![], self.web3.clone());

        let total_volume: U256 = self.decode_uint256(&marketplace_contract.call("getTotalVolume", vec![]).await?);
        let total_listings: U256 = self.decode_uint256(&marketplace_contract.call("getTotalListings", vec![]).await?);
        let total_sales: U256 = self.decode_uint256(&marketplace_contract.call("getTotalSales", vec![]).await?);

        let mut stats = HashMap::new();
        stats.insert("total_volume".to_string(), total_volume);
        stats.insert("total_listings".to_string(), total_listings);
        stats.insert("total_sales".to_string(), total_sales);

        Ok(stats)
    }

    pub async fn get_user_listings(&self, user: Address) -> Result<Vec<NFTListing>, Box<dyn std::error::Error>> {
        let all_listings = self.get_all_listings().await?;
        let user_listings: Vec<NFTListing> = all_listings.into_iter()
            .filter(|listing| listing.seller == user && listing.active)
            .collect();

        Ok(user_listings)
    }

    pub async fn get_user_offers(&self, user: Address) -> Result<Vec<(Address, U256, U256)>, Box<dyn std::error::Error>> {
        // This would query offer events for the user
        // Mock implementation
        let offers = vec![
            (Address::from_low_u64_be(1), U256::from(1), U256::from(2000000000000000000)), // 2 ETH for token 1
        ];

        Ok(offers)
    }

    pub async fn transfer_nft(&self, nft_contract: Address, from: Address, to: Address, token_id: U256) -> Result<H256, Box<dyn std::error::Error>> {
        let nft_contract_instance = super::smart_contract::SmartContract::new(nft_contract, vec![], self.web3.clone());

        let tx_hash = nft_contract_instance.send_transaction(
            "transferFrom",
            vec![
                self.encode_address(from),
                self.encode_address(to),
                self.encode_uint256(token_id),
            ],
            U256::zero(),
        ).await?;

        Ok(tx_hash)
    }

    pub async fn approve_nft(&self, nft_contract: Address, approved: Address, token_id: U256) -> Result<H256, Box<dyn std::error::Error>> {
        let nft_contract_instance = super::smart_contract::SmartContract::new(nft_contract, vec![], self.web3.clone());

        let tx_hash = nft_contract_instance.send_transaction(
            "approve",
            vec![
                self.encode_address(approved),
                self.encode_uint256(token_id),
            ],
            U256::zero(),
        ).await?;

        Ok(tx_hash)
    }

    pub async fn set_approval_for_all(&self, nft_contract: Address, operator: Address, approved: bool) -> Result<H256, Box<dyn std::error::Error>> {
        let nft_contract_instance = super::smart_contract::SmartContract::new(nft_contract, vec![], self.web3.clone());

        let tx_hash = nft_contract_instance.send_transaction(
            "setApprovalForAll",
            vec![
                self.encode_address(operator),
                self.encode_bool(approved),
            ],
            U256::zero(),
        ).await?;

        Ok(tx_hash)
    }

    pub async fn get_nft_balance(&self, nft_contract: Address, owner: Address) -> Result<U256, Box<dyn std::error::Error>> {
        let nft_contract_instance = super::smart_contract::SmartContract::new(nft_contract, vec![], self.web3.clone());

        let balance: U256 = self.decode_uint256(&nft_contract_instance.call("balanceOf", vec![self.encode_address(owner)]).await?);
        Ok(balance)
    }

    pub async fn get_nft_owner(&self, nft_contract: Address, token_id: U256) -> Result<Address, Box<dyn std::error::Error>> {
        let nft_contract_instance = super::smart_contract::SmartContract::new(nft_contract, vec![], self.web3.clone());

        let owner: Address = self.decode_address(&nft_contract_instance.call("ownerOf", vec![self.encode_uint256(token_id)]).await?);
        Ok(owner)
    }

    pub async fn mint_nft(&self, nft_contract: Address, to: Address, token_uri: String) -> Result<H256, Box<dyn std::error::Error>> {
        let nft_contract_instance = super::smart_contract::SmartContract::new(nft_contract, vec![], self.web3.clone());

        let tx_hash = nft_contract_instance.send_transaction(
            "mint",
            vec![
                self.encode_address(to),
                self.encode_string(token_uri),
            ],
            U256::zero(),
        ).await?;

        Ok(tx_hash)
    }

    pub async fn burn_nft(&self, nft_contract: Address, token_id: U256) -> Result<H256, Box<dyn std::error::Error>> {
        let nft_contract_instance = super::smart_contract::SmartContract::new(nft_contract, vec![], self.web3.clone());

        let tx_hash = nft_contract_instance.send_transaction(
            "burn",
            vec![self.encode_uint256(token_id)],
            U256::zero(),
        ).await?;

        Ok(tx_hash)
    }

    pub async fn create_auction(&self, nft_contract: Address, token_id: U256, starting_price: U256, duration: U256) -> Result<H256, Box<dyn std::error::Error>> {
        let marketplace_contract = super::smart_contract::SmartContract::new(self.marketplace_contract, vec![], self.web3.clone());

        let tx_hash = marketplace_contract.send_transaction(
            "createAuction",
            vec![
                self.encode_address(nft_contract),
                self.encode_uint256(token_id),
                self.encode_uint256(starting_price),
                self.encode_uint256(duration),
            ],
            U256::zero(),
        ).await?;

        Ok(tx_hash)
    }

    pub async fn bid_on_auction(&self, nft_contract: Address, token_id: U256, bid_amount: U256) -> Result<H256, Box<dyn std::error::Error>> {
        let marketplace_contract = super::smart_contract::SmartContract::new(self.marketplace_contract, vec![], self.web3.clone());

        let tx_hash = marketplace_contract.send_transaction(
            "bid",
            vec![
                self.encode_address(nft_contract),
                self.encode_uint256(token_id),
            ],
            bid_amount,
        ).await?;

        Ok(tx_hash)
    }

    pub async fn end_auction(&self, nft_contract: Address, token_id: U256) -> Result<H256, Box<dyn std::error::Error>> {
        let marketplace_contract = super::smart_contract::SmartContract::new(self.marketplace_contract, vec![], self.web3.clone());

        let tx_hash = marketplace_contract.send_transaction(
            "endAuction",
            vec![
                self.encode_address(nft_contract),
                self.encode_uint256(token_id),
            ],
            U256::zero(),
        ).await?;

        Ok(tx_hash)
    }

    pub async fn get_auction_info(&self, nft_contract: Address, token_id: U256) -> Result<HashMap<String, U256>, Box<dyn std::error::Error>> {
        let marketplace_contract = super::smart_contract::SmartContract::new(self.marketplace_contract, vec![], self.web3.clone());

        let result = marketplace_contract.call(
            "getAuction",
            vec![
                self.encode_address(nft_contract),
                self.encode_uint256(token_id),
            ],
        ).await?;

        let mut auction_info = HashMap::new();
        auction_info.insert("highest_bid".to_string(), self.decode_uint256(&result[0..32]));
        auction_info.insert("highest_bidder".to_string(), self.decode_uint256(&result[32..64])); // Address encoded as uint
        auction_info.insert("end_time".to_string(), self.decode_uint256(&result[64..96]));

        Ok(auction_info)
    }

    // Helper functions for encoding/decoding
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

    fn encode_bool(&self, value: bool) -> web3::types::Bytes {
        let byte = if value { 1u8 } else { 0u8 };
        vec![byte].into()
    }

    fn encode_string(&self, value: String) -> web3::types::Bytes {
        let mut bytes = vec![0u8; 32];
        let string_bytes = value.as_bytes();
        let len = std::cmp::min(string_bytes.len(), 32);
        bytes[32-len..32].copy_from_slice(&string_bytes[string_bytes.len()-len..]);
        bytes.into()
    }

    fn decode_address(&self, data: &[u8]) -> Address {
        Address::from_slice(&data[12..32])
    }

    fn decode_uint256(&self, data: &[u8]) -> U256 {
        U256::from_big_endian(data)
    }
}