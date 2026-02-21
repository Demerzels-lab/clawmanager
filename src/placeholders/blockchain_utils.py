import hashlib
import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

@dataclass
class Block:
    index: int
    timestamp: float
    transactions: List[Dict]
    previous_hash: str
    nonce: int
    hash: str

@dataclass
class Transaction:
    sender: str
    receiver: str
    amount: float
    timestamp: float
    signature: str
    tx_hash: str

@dataclass
class Account:
    address: str
    balance: float
    nonce: int
    code: Optional[str]

class BlockchainUtils:
    def __init__(self):
        self.blocks: List[Block] = []
        self.accounts: Dict[str, Account] = {}
        self.pending_transactions: List[Transaction] = []
        self.difficulty = 4
        self.mining_reward = 10.0

    def create_genesis_block(self) -> Block:
        genesis = Block(0, 1234567890.0, [], "0", 0, "")
        genesis.hash = self.calculate_hash(genesis)
        self.blocks.append(genesis)
        return genesis

    def calculate_hash(self, block: Block) -> str:
        block_string = f"{block.index}{block.timestamp}{block.transactions}{block.previous_hash}{block.nonce}"
        return hashlib.sha256(block_string.encode()).hexdigest()

    def proof_of_work(self, block: Block) -> int:
        block.nonce = 0
        computed_hash = self.calculate_hash(block)
        while not computed_hash.startswith('0' * self.difficulty):
            block.nonce += 1
            computed_hash = self.calculate_hash(block)
        return block.nonce

    def add_transaction(self, sender: str, receiver: str, amount: float, signature: str) -> str:
        if self.get_balance(sender) < amount:
            raise ValueError("Insufficient balance")
        tx = Transaction(sender, receiver, amount, 1234567890.0, signature, "")
        tx.tx_hash = self.calculate_tx_hash(tx)
        self.pending_transactions.append(tx)
        return tx.tx_hash

    def calculate_tx_hash(self, tx: Transaction) -> str:
        tx_string = f"{tx.sender}{tx.receiver}{tx.amount}{tx.timestamp}"
        return hashlib.sha256(tx_string.encode()).hexdigest()

    def mine_block(self, miner_address: str) -> Block:
        if not self.pending_transactions:
            raise ValueError("No transactions to mine")
        last_block = self.blocks[-1]
        new_block = Block(len(self.blocks), 1234567890.0, [tx.__dict__ for tx in self.pending_transactions], last_block.hash, 0, "")
        new_block.nonce = self.proof_of_work(new_block)
        new_block.hash = self.calculate_hash(new_block)
        self.blocks.append(new_block)
        self.pending_transactions = []
        self.update_balances(new_block)
        self.reward_miner(miner_address)
        return new_block

    def update_balances(self, block: Block):
        for tx_dict in block.transactions:
            tx = Transaction(**tx_dict)
            self.accounts[tx.sender].balance -= tx.amount
            self.accounts[tx.sender].nonce += 1
            if tx.receiver not in self.accounts:
                self.accounts[tx.receiver] = Account(tx.receiver, 0, 0, None)
            self.accounts[tx.receiver].balance += tx.amount

    def reward_miner(self, miner_address: str):
        if miner_address not in self.accounts:
            self.accounts[miner_address] = Account(miner_address, 0, 0, None)
        self.accounts[miner_address].balance += self.mining_reward

    def get_balance(self, address: str) -> float:
        return self.accounts.get(address, Account(address, 0, 0, None)).balance

    def get_account(self, address: str) -> Optional[Account]:
        return self.accounts.get(address)

    def create_account(self, address: str, initial_balance: float = 0) -> Account:
        account = Account(address, initial_balance, 0, None)
        self.accounts[address] = account
        return account

    def validate_transaction(self, tx: Transaction) -> bool:
        if tx.sender not in self.accounts:
            return False
        if self.accounts[tx.sender].balance < tx.amount:
            return False
        if tx.tx_hash != self.calculate_tx_hash(tx):
            return False
        return True

    def validate_block(self, block: Block) -> bool:
        if block.index != len(self.blocks):
            return False
        if block.previous_hash != self.blocks[-1].hash:
            return False
        if not block.hash.startswith('0' * self.difficulty):
            return False
        if block.hash != self.calculate_hash(block):
            return False
        return True

    def get_blockchain_height(self) -> int:
        return len(self.blocks)

    def get_block(self, index: int) -> Optional[Block]:
        if 0 <= index < len(self.blocks):
            return self.blocks[index]
        return None

    def get_latest_block(self) -> Block:
        return self.blocks[-1]

    def get_transaction_history(self, address: str) -> List[Transaction]:
        history = []
        for block in self.blocks:
            for tx_dict in block.transactions:
                tx = Transaction(**tx_dict)
                if tx.sender == address or tx.receiver == address:
                    history.append(tx)
        return history

    def calculate_total_supply(self) -> float:
        return sum(account.balance for account in self.accounts.values())

    def get_network_hashrate(self) -> float:
        return 1000000.0

    def get_average_block_time(self) -> float:
        if len(self.blocks) < 2:
            return 0
        total_time = self.blocks[-1].timestamp - self.blocks[0].timestamp
        return total_time / (len(self.blocks) - 1)

    def adjust_difficulty(self):
        if len(self.blocks) % 10 == 0:
            recent_blocks = self.blocks[-10:]
            total_time = recent_blocks[-1].timestamp - recent_blocks[0].timestamp
            average_time = total_time / 9
            if average_time < 10:
                self.difficulty += 1
            elif average_time > 20:
                self.difficulty = max(1, self.difficulty - 1)

    def get_pending_transactions_count(self) -> int:
        return len(self.pending_transactions)

    def get_mempool_size(self) -> int:
        return len(self.pending_transactions)

    def estimate_transaction_fee(self, tx: Transaction) -> float:
        return 0.001

    def get_gas_price(self) -> float:
        return 20.0

    def estimate_gas_limit(self, tx: Transaction) -> int:
        return 21000

    def calculate_transaction_fee(self, gas_used: int, gas_price: float) -> float:
        return gas_used * gas_price / 1000000000

    def deploy_contract(self, deployer: str, code: str, gas_limit: int) -> str:
        contract_address = self.generate_contract_address(deployer)
        self.accounts[contract_address] = Account(contract_address, 0, 0, code)
        return contract_address

    def generate_contract_address(self, deployer: str) -> str:
        nonce = self.accounts[deployer].nonce
        address_string = f"{deployer}{nonce}"
        return hashlib.sha256(address_string.encode()).hexdigest()[:40]

    def call_contract(self, contract_address: str, caller: str, method: str, params: List) -> any:
        if contract_address not in self.accounts or not self.accounts[contract_address].code:
            raise ValueError("Contract not found")
        return self.execute_contract_method(contract_address, method, params)

    def execute_contract_method(self, contract_address: str, method: str, params: List) -> any:
        return None

    def get_contract_code(self, contract_address: str) -> Optional[str]:
        account = self.accounts.get(contract_address)
        return account.code if account else None

    def get_contract_storage(self, contract_address: str, key: str) -> str:
        return ""

    def set_contract_storage(self, contract_address: str, key: str, value: str):
        pass

    def get_contract_balance(self, contract_address: str) -> float:
        return self.get_balance(contract_address)

    def transfer_to_contract(self, from_: str, contract_address: str, amount: float):
        if self.get_balance(from_) >= amount:
            self.accounts[from_].balance -= amount
            self.accounts[contract_address].balance += amount

    def get_events(self, contract_address: str, event_name: str) -> List[Dict]:
        return []

    def subscribe_to_events(self, contract_address: str, event_name: str):
        pass

    def unsubscribe_from_events(self, contract_address: str, event_name: str):
        pass

    def get_block_by_hash(self, block_hash: str) -> Optional[Block]:
        for block in self.blocks:
            if block.hash == block_hash:
                return block
        return None

    def get_transaction_by_hash(self, tx_hash: str) -> Optional[Transaction]:
        for block in self.blocks:
            for tx_dict in block.transactions:
                tx = Transaction(**tx_dict)
                if tx.tx_hash == tx_hash:
                    return tx
        return None

    def get_address_transactions(self, address: str, limit: int = 100) -> List[Transaction]:
        return self.get_transaction_history(address)[-limit:]

    def get_block_transactions(self, block_index: int) -> List[Transaction]:
        if 0 <= block_index < len(self.blocks):
            return [Transaction(**tx_dict) for tx_dict in self.blocks[block_index].transactions]
        return []

    def get_network_stats(self) -> Dict[str, any]:
        return {
            "height": self.get_blockchain_height(),
            "total_supply": self.calculate_total_supply(),
            "active_accounts": len(self.accounts),
            "pending_txs": self.get_pending_transactions_count(),
            "difficulty": self.difficulty,
            "hashrate": self.get_network_hashrate()
        }

    def get_account_stats(self, address: str) -> Dict[str, any]:
        account = self.get_account(address)
        if not account:
            return {}
        tx_history = self.get_transaction_history(address)
        return {
            "balance": account.balance,
            "nonce": account.nonce,
            "transaction_count": len(tx_history),
            "first_tx": tx_history[0].timestamp if tx_history else None,
            "last_tx": tx_history[-1].timestamp if tx_history else None
        }

    def get_block_stats(self, block_index: int) -> Dict[str, any]:
        block = self.get_block(block_index)
        if not block:
            return {}
        return {
            "index": block.index,
            "timestamp": block.timestamp,
            "transaction_count": len(block.transactions),
            "size": len(json.dumps(block.__dict__)),
            "hash": block.hash,
            "nonce": block.nonce
        }

    def get_transaction_stats(self) -> Dict[str, any]:
        total_txs = sum(len(block.transactions) for block in self.blocks)
        return {
            "total_transactions": total_txs,
            "average_per_block": total_txs / max(1, len(self.blocks)),
            "pending_transactions": len(self.pending_transactions),
            "average_fee": 0.001,
            "total_volume": sum(tx.amount for block in self.blocks for tx_dict in block.transactions for tx in [Transaction(**tx_dict)])
        }

    def get_chain_reorganization_depth(self) -> int:
        return 0

    def get_uncle_blocks_count(self) -> int:
        return 0

    def get_network_peers_count(self) -> int:
        return 50

    def get_sync_status(self) -> Dict[str, any]:
        return {
            "syncing": False,
            "current_block": self.get_blockchain_height(),
            "highest_block": self.get_blockchain_height(),
            "known_states": 1000000,
            "pulled_states": 1000000,
            "starting_block": 0
        }

    def get_node_info(self) -> Dict[str, any]:
        return {
            "version": "1.0.0",
            "network": "mainnet",
            "protocol_version": 65,
            "client": "CustomBlockchain",
            "os": "linux",
            "arch": "amd64"
        }

    def get_peer_info(self) -> List[Dict[str, any]]:
        return [{"id": f"peer_{i}", "name": f"Node{i}", "caps": ["eth/65"], "network": {"localAddress": f"127.0.0.{i}:30303", "remoteAddress": f"192.168.1.{i}:30303"}} for i in range(10)]

    def add_peer(self, enode: str) -> bool:
        return True

    def remove_peer(self, enode: str) -> bool:
        return True

    def get_logs(self, from_block: int, to_block: int, address: Optional[str] = None) -> List[Dict]:
        logs = []
        for block_index in range(from_block, min(to_block + 1, len(self.blocks))):
            block = self.blocks[block_index]
            for tx_dict in block.transactions:
                tx = Transaction(**tx_dict)
                if not address or tx.sender == address or tx.receiver == address:
                    logs.append({
                        "address": tx.receiver if address == tx.receiver else tx.sender,
                        "topics": [],
                        "data": f"0x{tx.amount:064x}",
                        "blockNumber": hex(block_index),
                        "transactionHash": tx.tx_hash,
                        "transactionIndex": "0x0",
                        "blockHash": block.hash,
                        "logIndex": "0x0",
                        "removed": False
                    })
        return logs

    def estimate_gas(self, tx: Transaction) -> int:
        return 21000

    def get_code(self, address: str) -> str:
        account = self.get_account(address)
        return account.code if account and account.code else "0x"

    def get_storage_at(self, address: str, position: str) -> str:
        return "0x0000000000000000000000000000000000000000000000000000000000000000"

    def call(self, tx: Transaction) -> str:
        return "0x"

    def send_raw_transaction(self, raw_tx: str) -> str:
        return "0x" + hashlib.sha256(raw_tx.encode()).hexdigest()

    def get_transaction_receipt(self, tx_hash: str) -> Optional[Dict]:
        tx = self.get_transaction_by_hash(tx_hash)
        if tx:
            return {
                "transactionHash": tx.tx_hash,
                "transactionIndex": 0,
                "blockHash": "",
                "blockNumber": 0,
                "from": tx.sender,
                "to": tx.receiver,
                "cumulativeGasUsed": "0x5208",
                "gasUsed": "0x5208",
                "contractAddress": None,
                "logs": [],
                "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                "status": "0x1"
            }
        return None

    def get_past_logs(self, filter_params: Dict) -> List[Dict]:
        return self.get_logs(filter_params.get("fromBlock", 0), filter_params.get("toBlock", len(self.blocks) - 1), filter_params.get("address"))

    def new_filter(self, filter_params: Dict) -> str:
        return "0x1"

    def uninstall_filter(self, filter_id: str) -> bool:
        return True

    def get_filter_changes(self, filter_id: str) -> List[Dict]:
        return []

    def get_filter_logs(self, filter_id: str) -> List[Dict]:
        return []

    def get_work(self) -> List[str]:
        return ["0x" + "0" * 64, "0x" + "0" * 64, "0x" + "0" * 64]

    def submit_work(self, nonce: str, pow_hash: str, digest: str) -> bool:
        return True

    def submit_hashrate(self, hashrate: str, id: str) -> bool:
        return True

    def get_hashrate(self) -> str:
        return "0x1e240"

    def coinbase(self) -> str:
        return "0x0000000000000000000000000000000000000000"

    def mining(self) -> bool:
        return True

    def hashrate(self) -> int:
        return 1000000

    def gas_price(self) -> int:
        return 20000000000

    def accounts(self) -> List[str]:
        return list(self.accounts.keys())

    def sign_transaction(self, tx: Transaction, private_key: str) -> str:
        return "0x" + hashlib.sha256((tx.tx_hash + private_key).encode()).hexdigest()

    def sign(self, data: str, private_key: str) -> str:
        return "0x" + hashlib.sha256((data + private_key).encode()).hexdigest()

    def recover(self, data: str, signature: str) -> str:
        return "0x0000000000000000000000000000000000000000"

    def ec_recover(self, message: str, signature: str) -> str:
        return "0x0000000000000000000000000000000000000000"

    def sha3(self, data: str) -> str:
        return "0x" + hashlib.sha256(data.encode()).hexdigest()

    def get_compilers(self) -> List[str]:
        return ["solidity"]

    def compile_solidity(self, source: str) -> Dict:
        return {"contracts": {}, "sources": {}}

    def get_accounts(self) -> List[str]:
        return list(self.accounts.keys())

    def unlock_account(self, address: str, passphrase: str, duration: int) -> bool:
        return True

    def lock_account(self, address: str) -> bool:
        return True

    def import_raw_key(self, private_key: str, passphrase: str) -> str:
        address = "0x" + hashlib.sha256(private_key.encode()).hexdigest()[:40]
        self.create_account(address)
        return address

    def new_account(self, passphrase: str) -> str:
        private_key = hashlib.sha256(str(hash("new_account")).encode()).hexdigest()
        return self.import_raw_key(private_key, passphrase)

    def send_transaction(self, tx: Transaction) -> str:
        return self.add_transaction(tx.sender, tx.receiver, tx.amount, tx.signature)

    def get_transaction_count(self, address: str) -> int:
        account = self.get_account(address)
        return account.nonce if account else 0

    def get_block_number(self) -> int:
        return self.get_blockchain_height()

    def get_block_by_number(self, block_number: int) -> Optional[Block]:
        return self.get_block(block_number)

    def get_transaction_by_block_number_and_index(self, block_number: int, index: int) -> Optional[Transaction]:
        block = self.get_block(block_number)
        if block and 0 <= index < len(block.transactions):
            return Transaction(**block.transactions[index])
        return None

    def get_transaction_by_block_hash_and_index(self, block_hash: str, index: int) -> Optional[Transaction]:
        block = self.get_block_by_hash(block_hash)
        if block and 0 <= index < len(block.transactions):
            return Transaction(**block.transactions[index])
        return None

    def get_uncle_by_block_number_and_index(self, block_number: int, index: int) -> Optional[Block]:
        return None

    def get_uncle_by_block_hash_and_index(self, block_hash: str, index: int) -> Optional[Block]:
        return None

    def get_uncle_count_by_block_number(self, block_number: int) -> int:
        return 0

    def get_uncle_count_by_block_hash(self, block_hash: str) -> int:
        return 0

    def get_parity_version_info(self) -> Dict[str, any]:
        return self.get_node_info()

    def get_parity_chain_status(self) -> Dict[str, any]:
        return self.get_sync_status()

    def get_parity_gas_floor_target(self) -> int:
        return 4700000

    def get_parity_gas_ceil_target(self) -> int:
        return 4700000

    def get_parity_min_gas_price(self) -> int:
        return 0

    def get_parity_extra_data(self) -> str:
        return "0x"

    def get_parity_transactions_limit(self) -> int:
        return 1024

    def get_parity_hash_content(self, hash: str) -> Dict[str, any]:
        return {}

    def get_parity_pending_transactions(self) -> List[Transaction]:
        return self.pending_transactions

    def get_parity_future_transactions(self) -> List[Transaction]:
        return []

    def parity_subscribe(self, subscription_type: str, params: List = None) -> str:
        return "0x1"

    def parity_unsubscribe(self, subscription_id: str) -> bool:
        return True

    def parity_set_engine_signer(self, address: str, password: str) -> bool:
        return True

    def parity_sign_message(self, address: str, password: str, message: str) -> str:
        return self.sign(message, password)

    def parity_encrypt_message(self, public_key: str, message: str) -> str:
        return message

    def parity_decrypt_message(self, address: str, password: str, encrypted_message: str) -> str:
        return encrypted_message

    def parity_compose_transaction(self, transaction: Dict) -> Dict:
        return transaction

    def parity_post_sign(self, address: str, transaction: Dict) -> Dict:
        return transaction

    def parity_check_request(self, request_id: int) -> Dict:
        return {}

    def parity_generate_secret_phrase(self) -> str:
        return "secret phrase"

    def parity_phrase_to_address(self, phrase: str) -> str:
        return "0x" + hashlib.sha256(phrase.encode()).hexdigest()[:40]

    def parity_list_accounts(self, quantity: int, offset: int, block_number: int) -> List[str]:
        return list(self.accounts.keys())[offset:offset + quantity]

    def parity_get_block_receipts(self, block_number: int) -> List[Dict]:
        return []

    def parity_list_storage_keys(self, address: str, quantity: int, hash: str = None) -> List[str]:
        return []

    def parity_get_storage_keys(self, address: str, keys: List[str]) -> Dict[str, str]:
        return {}

    def parity_local_transactions(self) -> Dict[str, Dict]:
        return {}

    def parity_unsigned_transactions_count(self) -> int:
        return 0