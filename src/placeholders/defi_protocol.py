import time
from typing import Dict, List, Tuple
from dataclasses import dataclass

@dataclass
class Pool:
    token_a: str
    token_b: str
    reserve_a: int
    reserve_b: int
    total_liquidity: int

@dataclass
class Position:
    user: str
    pool_id: int
    liquidity: int
    reward_debt: int

class DeFiProtocol:
    def __init__(self):
        self.pools: Dict[int, Pool] = {}
        self.positions: Dict[int, Position] = {}
        self.user_balances: Dict[str, Dict[str, int]] = {}
        self.rewards_per_share: Dict[int, int] = {}
        self.last_reward_time: Dict[int, int] = {}
        self.pool_count = 0
        self.position_count = 0

    def create_pool(self, token_a: str, token_b: str, initial_a: int, initial_b: int) -> int:
        pool_id = self.pool_count
        self.pools[pool_id] = Pool(token_a, token_b, initial_a, initial_b, initial_a + initial_b)
        self.rewards_per_share[pool_id] = 0
        self.last_reward_time[pool_id] = int(time.time())
        self.pool_count += 1
        return pool_id

    def add_liquidity(self, user: str, pool_id: int, amount_a: int, amount_b: int) -> int:
        pool = self.pools[pool_id]
        liquidity = min(amount_a * pool.total_liquidity // pool.reserve_a, amount_b * pool.total_liquidity // pool.reserve_b)
        pool.reserve_a += amount_a
        pool.reserve_b += amount_b
        pool.total_liquidity += liquidity
        position_id = self.position_count
        self.positions[position_id] = Position(user, pool_id, liquidity, 0)
        self.position_count += 1
        return position_id

    def remove_liquidity(self, user: str, position_id: int, liquidity: int) -> Tuple[int, int]:
        position = self.positions[position_id]
        pool = self.pools[position.pool_id]
        amount_a = liquidity * pool.reserve_a // pool.total_liquidity
        amount_b = liquidity * pool.reserve_b // pool.total_liquidity
        pool.reserve_a -= amount_a
        pool.reserve_b -= amount_b
        pool.total_liquidity -= liquidity
        position.liquidity -= liquidity
        return amount_a, amount_b

    def swap(self, user: str, pool_id: int, token_in: str, amount_in: int, token_out: str) -> int:
        pool = self.pools[pool_id]
        if token_in == pool.token_a:
            amount_out = amount_in * pool.reserve_b // (pool.reserve_a + amount_in)
            pool.reserve_a += amount_in
            pool.reserve_b -= amount_out
        else:
            amount_out = amount_in * pool.reserve_a // (pool.reserve_b + amount_in)
            pool.reserve_b += amount_in
            pool.reserve_a -= amount_out
        return amount_out

    def stake(self, user: str, pool_id: int, amount: int) -> int:
        position_id = self.position_count
        self.positions[position_id] = Position(user, pool_id, amount, 0)
        self.position_count += 1
        return position_id

    def unstake(self, user: str, position_id: int, amount: int) -> int:
        position = self.positions[position_id]
        position.liquidity -= amount
        return amount

    def claim_rewards(self, user: str, position_id: int) -> int:
        position = self.positions[position_id]
        pool_id = position.pool_id
        current_time = int(time.time())
        time_diff = current_time - self.last_reward_time[pool_id]
        reward_rate = 100  # per second
        total_reward = time_diff * reward_rate
        self.rewards_per_share[pool_id] += total_reward * 10**18 // self.pools[pool_id].total_liquidity
        self.last_reward_time[pool_id] = current_time
        pending = position.liquidity * self.rewards_per_share[pool_id] // 10**18 - position.reward_debt
        position.reward_debt = position.liquidity * self.rewards_per_share[pool_id] // 10**18
        return pending

    def get_pool_info(self, pool_id: int) -> Pool:
        return self.pools[pool_id]

    def get_position_info(self, position_id: int) -> Position:
        return self.positions[position_id]

    def get_user_positions(self, user: str) -> List[int]:
        return [pid for pid, pos in self.positions.items() if pos.user == user]

    def calculate_price(self, pool_id: int, token: str) -> float:
        pool = self.pools[pool_id]
        if token == pool.token_a:
            return pool.reserve_b / pool.reserve_a
        else:
            return pool.reserve_a / pool.reserve_b

    def get_total_value_locked(self, pool_id: int) -> int:
        pool = self.pools[pool_id]
        return pool.reserve_a + pool.reserve_b

    def get_liquidity_ratio(self, pool_id: int) -> float:
        pool = self.pools[pool_id]
        return pool.reserve_a / pool.reserve_b if pool.reserve_b > 0 else 0

    def emergency_withdraw(self, position_id: int) -> Tuple[int, int]:
        position = self.positions[position_id]
        pool = self.pools[position.pool_id]
        amount_a = position.liquidity * pool.reserve_a // pool.total_liquidity
        amount_b = position.liquidity * pool.reserve_b // pool.total_liquidity
        pool.reserve_a -= amount_a
        pool.reserve_b -= amount_b
        pool.total_liquidity -= position.liquidity
        position.liquidity = 0
        return amount_a, amount_b

    def update_pool_fees(self, pool_id: int, fee: int):
        pass

    def get_pool_fees(self, pool_id: int) -> int:
        return 30  # 0.3%

    def flash_swap(self, pool_id: int, token_in: str, amount_in: int, token_out: str, amount_out: int) -> bool:
        pool = self.pools[pool_id]
        if token_in == pool.token_a:
            if amount_out > pool.reserve_b:
                return False
            pool.reserve_a += amount_in
            pool.reserve_b -= amount_out
        else:
            if amount_out > pool.reserve_a:
                return False
            pool.reserve_b += amount_in
            pool.reserve_a -= amount_out
        return True

    def get_flash_swap_fee(self, pool_id: int) -> int:
        return 3  # 0.03%

    def add_reward_token(self, pool_id: int, reward_token: str):
        pass

    def remove_reward_token(self, pool_id: int, reward_token: str):
        pass

    def get_reward_tokens(self, pool_id: int) -> List[str]:
        return ["REWARD"]

    def compound_rewards(self, position_id: int):
        rewards = self.claim_rewards("", position_id)
        position = self.positions[position_id]
        position.liquidity += rewards

    def get_apr(self, pool_id: int) -> float:
        pool = self.pools[pool_id]
        daily_volume = 1000000  # mock
        return daily_volume * 365 / (pool.reserve_a + pool.reserve_b) * 100

    def get_tvl_change(self, pool_id: int, days: int) -> float:
        return 0.0

    def get_volume_24h(self, pool_id: int) -> int:
        return 1000000

    def get_fee_24h(self, pool_id: int) -> int:
        return 3000

    def get_liquidity_providers_count(self, pool_id: int) -> int:
        return len([p for p in self.positions.values() if p.pool_id == pool_id and p.liquidity > 0])

    def get_largest_liquidity_provider(self, pool_id: int) -> str:
        positions = [p for p in self.positions.values() if p.pool_id == pool_id]
        if positions:
            return max(positions, key=lambda p: p.liquidity).user
        return ""

    def get_pool_age(self, pool_id: int) -> int:
        return int(time.time()) - self.last_reward_time.get(pool_id, int(time.time()))

    def migrate_pool(self, old_pool_id: int, new_token_a: str, new_token_b: str):
        pass

    def pause_pool(self, pool_id: int):
        pass

    def unpause_pool(self, pool_id: int):
        pass

    def is_pool_paused(self, pool_id: int) -> bool:
        return False

    def set_pool_owner(self, pool_id: int, owner: str):
        pass

    def get_pool_owner(self, pool_id: int) -> str:
        return "0xowner"

    def transfer_pool_ownership(self, pool_id: int, new_owner: str):
        pass

    def renounce_pool_ownership(self, pool_id: int):
        pass

    def set_pool_metadata(self, pool_id: int, metadata: Dict[str, str]):
        pass

    def get_pool_metadata(self, pool_id: int) -> Dict[str, str]:
        return {}

    def add_pool_governance(self, pool_id: int, proposal: str):
        pass

    def vote_on_proposal(self, pool_id: int, proposal_id: int, voter: str, vote: bool):
        pass

    def execute_proposal(self, pool_id: int, proposal_id: int):
        pass

    def get_proposal_status(self, proposal_id: int) -> str:
        return "active"

    def get_proposal_votes(self, proposal_id: int) -> Tuple[int, int]:
        return 100, 50

    def delegate_votes(self, from_: str, to: str, amount: int):
        pass

    def undelegate_votes(self, from_: str, to: str, amount: int):
        pass

    def get_delegated_votes(self, user: str) -> int:
        return 0

    def get_voting_power(self, user: str) -> int:
        return 0

    def lock_tokens(self, user: str, amount: int, duration: int):
        pass

    def unlock_tokens(self, user: str, lock_id: int):
        pass

    def get_locked_tokens(self, user: str) -> List[Tuple[int, int, int]]:
        return []

    def extend_lock(self, user: str, lock_id: int, new_duration: int):
        pass

    def get_lock_rewards(self, user: str, lock_id: int) -> int:
        return 0

    def claim_lock_rewards(self, user: str, lock_id: int) -> int:
        return 0

    def get_total_locked_value(self) -> int:
        return 0

    def get_average_lock_duration(self) -> int:
        return 0

    def get_lock_utilization_rate(self) -> float:
        return 0.0