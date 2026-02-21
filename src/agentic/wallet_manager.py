import os
import json
import hashlib
import hmac
import secrets
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from eth_account import Account
from eth_account.signers.local import LocalAccount
from web3 import Web3
from web3.types import TxParams, Wei
import bcrypt
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

@dataclass
class Wallet:
    address: str
    name: str
    balance: int
    nonce: int
    tokens: Dict[str, int]
    transactions: List[Dict[str, Any]]

@dataclass
class TransactionRecord:
    hash: str
    from_address: str
    to_address: Optional[str]
    value: int
    timestamp: int
    status: str
    gas_used: Optional[int]
    gas_price: int

@dataclass
class TokenBalance:
    token_address: str
    balance: int
    decimals: int
    symbol: str
    name: str

class WalletManager:
    def __init__(self, web3: Web3, keystore_path: str = "./keystore"):
        self.web3 = web3
        self.keystore_path = keystore_path
        self.wallets: Dict[str, Wallet] = {}
        self.encrypted_keys: Dict[str, bytes] = {}
        self._load_keystore()

    def _load_keystore(self):
        if os.path.exists(self.keystore_path):
            with open(self.keystore_path, 'r') as f:
                data = json.load(f)
                self.wallets = {k: Wallet(**v) for k, v in data.get('wallets', {}).items()}
                self.encrypted_keys = {k: bytes.fromhex(v) for k, v in data.get('keys', {}).items()}

    def _save_keystore(self):
        os.makedirs(os.path.dirname(self.keystore_path), exist_ok=True)
        data = {
            'wallets': {k: asdict(v) for k, v in self.wallets.items()},
            'keys': {k: v.hex() for k, v in self.encrypted_keys.items()}
        }
        with open(self.keystore_path, 'w') as f:
            json.dump(data, f, indent=2)

    def create_wallet(self, name: str, password: str) -> str:
        account = Account.create()
        address = account.address

        encrypted_key = self._encrypt_private_key(account.key.hex(), password)

        wallet = Wallet(
            address=address,
            name=name,
            balance=0,
            nonce=0,
            tokens={},
            transactions=[]
        )

        self.wallets[address] = wallet
        self.encrypted_keys[address] = encrypted_key
        self._save_keystore()

        return address

    def import_wallet(self, private_key: str, name: str, password: str) -> str:
        if private_key.startswith('0x'):
            private_key = private_key[2:]
        account = Account.from_key(private_key)
        address = account.address

        encrypted_key = self._encrypt_private_key(private_key, password)

        wallet = Wallet(
            address=address,
            name=name,
            balance=0,
            nonce=0,
            tokens={},
            transactions=[]
        )

        self.wallets[address] = wallet
        self.encrypted_keys[address] = encrypted_key
        self._save_keystore()

        return address

    def unlock_wallet(self, address: str, password: str) -> LocalAccount:
        if address not in self.encrypted_keys:
            raise ValueError("Wallet not found")

        encrypted_key = self.encrypted_keys[address]
        private_key_hex = self._decrypt_private_key(encrypted_key, password)

        return Account.from_key(private_key_hex)

    def get_wallet(self, address: str) -> Wallet:
        if address not in self.wallets:
            raise ValueError("Wallet not found")
        return self.wallets[address]

    def update_wallet_balance(self, address: str):
        balance = self.web3.eth.get_balance(address)
        nonce = self.web3.eth.get_transaction_count(address)

        if address in self.wallets:
            self.wallets[address].balance = balance
            self.wallets[address].nonce = nonce
            self._save_keystore()

    def send_transaction(self, from_address: str, to_address: str, value: Wei, password: str) -> str:
        account = self.unlock_wallet(from_address, password)
        wallet = self.get_wallet(from_address)

        tx = {
            'from': from_address,
            'to': to_address,
            'value': value,
            'gas': 21000,
            'gasPrice': self.web3.eth.gas_price,
            'nonce': wallet.nonce,
            'chainId': self.web3.eth.chain_id
        }

        signed_tx = account.sign_transaction(tx)
        tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Record transaction
        transaction_record = TransactionRecord(
            hash=tx_hash.hex(),
            from_address=from_address,
            to_address=to_address,
            value=value,
            timestamp=self.web3.eth.get_block('latest')['timestamp'],
            status='pending',
            gas_used=None,
            gas_price=tx['gasPrice']
        )

        wallet.transactions.append(asdict(transaction_record))
        wallet.nonce += 1
        self._save_keystore()

        return tx_hash.hex()

    def send_token(self, from_address: str, to_address: str, token_address: str, amount: int, password: str) -> str:
        account = self.unlock_wallet(from_address, password)

        # ERC-20 transfer
        contract = self.web3.eth.contract(address=token_address, abi=self._get_erc20_abi())
        tx = contract.functions.transfer(to_address, amount).build_transaction({
            'from': from_address,
            'gas': 100000,
            'gasPrice': self.web3.eth.gas_price,
            'nonce': self.get_wallet(from_address).nonce,
            'chainId': self.web3.eth.chain_id
        })

        signed_tx = account.sign_transaction(tx)
        tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Update token balance
        self.update_token_balance(from_address, token_address)

        return tx_hash.hex()

    def sign_message(self, address: str, message: str, password: str) -> str:
        account = self.unlock_wallet(address, password)
        signed_message = account.sign_message(text=message)
        return signed_message.signature.hex()

    def verify_signature(self, message: str, signature: str, address: str) -> bool:
        recovered_address = Account.recover_message(text=message, signature=signature)
        return recovered_address.lower() == address.lower()

    def get_token_balance(self, address: str, token_address: str) -> int:
        contract = self.web3.eth.contract(address=token_address, abi=self._get_erc20_abi())
        return contract.functions.balanceOf(address).call()

    def update_token_balance(self, address: str, token_address: str):
        balance = self.get_token_balance(address, token_address)
        if address in self.wallets:
            self.wallets[address].tokens[token_address] = balance
            self._save_keystore()

    def get_token_info(self, token_address: str) -> TokenBalance:
        contract = self.web3.eth.contract(address=token_address, abi=self._get_erc20_abi())

        name = contract.functions.name().call()
        symbol = contract.functions.symbol().call()
        decimals = contract.functions.decimals().call()
        total_supply = contract.functions.totalSupply().call()

        return TokenBalance(
            token_address=token_address,
            balance=0,  # This would be set when getting balance for a specific address
            decimals=decimals,
            symbol=symbol,
            name=name
        )

    def add_token(self, wallet_address: str, token_address: str):
        balance = self.get_token_balance(wallet_address, token_address)
        if wallet_address in self.wallets:
            self.wallets[wallet_address].tokens[token_address] = balance
            self._save_keystore()

    def remove_token(self, wallet_address: str, token_address: str):
        if wallet_address in self.wallets:
            self.wallets[wallet_address].tokens.pop(token_address, None)
            self._save_keystore()

    def get_transaction_history(self, address: str) -> List[TransactionRecord]:
        wallet = self.get_wallet(address)
        return [TransactionRecord(**tx) for tx in wallet.transactions]

    def estimate_gas(self, tx: TxParams) -> int:
        return self.web3.eth.estimate_gas(tx)

    def get_gas_price(self) -> Wei:
        return self.web3.eth.gas_price

    def batch_transactions(self, transactions: List[Tuple[str, TxParams]], password: str) -> List[str]:
        tx_hashes = []
        for from_address, tx in transactions:
            account = self.unlock_wallet(from_address, password)
            signed_tx = account.sign_transaction(tx)
            tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            tx_hashes.append(tx_hash.hex())
        return tx_hashes

    def export_wallet(self, address: str, password: str, export_password: str) -> str:
        account = self.unlock_wallet(address, password)
        return account.key.hex()

    def delete_wallet(self, address: str, password: str):
        # Verify password
        self.unlock_wallet(address, password)

        self.wallets.pop(address, None)
        self.encrypted_keys.pop(address, None)
        self._save_keystore()

    def backup_wallets(self, backup_path: str):
        data = {
            'wallets': {k: asdict(v) for k, v in self.wallets.items()},
            'keys': {k: v.hex() for k, v in self.encrypted_keys.items()}
        }
        with open(backup_path, 'w') as f:
            json.dump(data, f, indent=2)

    def restore_wallets(self, backup_path: str):
        with open(backup_path, 'r') as f:
            data = json.load(f)

        self.wallets = {k: Wallet(**v) for k, v in data.get('wallets', {}).items()}
        self.encrypted_keys = {k: bytes.fromhex(v) for k, v in data.get('keys', {}).items()}
        self._save_keystore()

    def get_wallet_stats(self, address: str) -> Dict[str, int]:
        wallet = self.get_wallet(address)
        stats = {
            'balance': wallet.balance,
            'nonce': wallet.nonce,
            'transaction_count': len(wallet.transactions),
            'token_count': len(wallet.tokens)
        }

        total_token_value = sum(wallet.tokens.values())
        stats['total_token_value'] = total_token_value

        return stats

    def monitor_wallet(self, address: str):
        self.update_wallet_balance(address)

    def get_wallet_value(self, address: str) -> int:
        wallet = self.get_wallet(address)
        total_value = wallet.balance

        # Simplified token value calculation
        for token_addr, balance in wallet.tokens.items():
            # In a real implementation, you'd get token prices
            total_value += balance

        return total_value

    def generate_new_address(self, name: str, password: str) -> str:
        return self.create_wallet(name, password)

    def change_wallet_password(self, address: str, old_password: str, new_password: str):
        account = self.unlock_wallet(address, old_password)
        new_encrypted_key = self._encrypt_private_key(account.key.hex(), new_password)
        self.encrypted_keys[address] = new_encrypted_key
        self._save_keystore()

    def validate_address(self, address: str) -> bool:
        return self.web3.is_address(address)

    def get_wallet_addresses(self) -> List[str]:
        return list(self.wallets.keys())

    def rename_wallet(self, address: str, new_name: str):
        if address in self.wallets:
            self.wallets[address].name = new_name
            self._save_keystore()

    def _encrypt_private_key(self, private_key: str, password: str) -> bytes:
        salt = secrets.token_bytes(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        f = Fernet(key)
        encrypted = f.encrypt(private_key.encode())
        return salt + encrypted

    def _decrypt_private_key(self, encrypted_data: bytes, password: str) -> str:
        salt = encrypted_data[:16]
        encrypted_key = encrypted_data[16:]

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        f = Fernet(key)
        decrypted = f.decrypt(encrypted_key)
        return decrypted.decode()

    def _get_erc20_abi(self) -> List[Dict[str, Any]]:
        return [
            {
                "constant": True,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": False,
                "inputs": [
                    {"name": "_to", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [],
                "name": "name",
                "outputs": [{"name": "", "type": "string"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [],
                "name": "symbol",
                "outputs": [{"name": "", "type": "string"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [],
                "name": "totalSupply",
                "outputs": [{"name": "", "type": "uint256"}],
                "type": "function"
            }
        ]