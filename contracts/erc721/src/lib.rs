extern crate alloc;

mod erc721;

use stylus_sdk::{
    abi::Bytes,
    block,
    contract, // Add this
    msg,
    prelude::*,
    alloy_primitives::{Address, U256}
};
use alloy_sol_types::sol;
use crate::erc721::{Erc721, Erc721Params};

struct DsiParams;

impl Erc721Params for DsiParams {
    const NAME: &'static str = "DynamicSoulboundIdentity";
    const SYMBOL: &'static str = "DSI";
}

sol! {
    struct CharacterStats {
        uint256 level;
        uint256 xp;
        uint256 strength;
        uint256 agility;
        uint256 intelligence;
        uint256 vitality;
        uint256 last_action_timestamp;
        uint8 char_class; // 0=Novice, 1=Warrior, 2=Mage, 3=Rogue
        uint256[] inventory; // Array of Item IDs
        uint256 equipped_weapon; // Item ID (0 = none)
        uint256 equipped_armor; // Item ID (0 = none)
    }

    event LevelUp(uint256 indexed token_id, uint256 new_level);
    event EncounterMoster(uint256 indexed token_id, bool victory, uint256 xp_gained);
    event LootDropped(uint256 indexed token_id, uint256 item_id);
    
    error NotEnoughStamina();
    error TokenDoesNotExist();
    error NotOwnerOfToken();
}

sol_storage! {
    #[entrypoint]
    struct DynamicSoulboundRPG {
        mapping(uint256 => CharacterStats) characters;
        mapping(uint256 => string) token_uris;
        
        #[borrow]
        Erc721<DsiParams> erc721;
    }
}

#[derive(SolidityError)]
pub enum DynamicSoulboundRPGError {
    NotEnoughStamina(NotEnoughStamina),
    TokenDoesNotExist(TokenDoesNotExist),
    NotOwnerOfToken(NotOwnerOfToken),
}

#[public]
#[inherit(Erc721<DsiParams>)]
impl DynamicSoulboundRPG {
    /// Mints a new Soulbound RPG Identity to the sender
    pub fn mint_identity(&mut self) -> Result<(), Vec<u8>> {
        let minter = msg::sender();
        // For simplicity, we assume one token per address is enforced in Web2 or another mapping, 
        // or we just use the total supply as the token ID.
        let new_token_id = self.erc721.total_supply.get();
        self.erc721.mint(minter)?;

        // Initialize Base Character Stats
        let mut char_stats = self.characters.setter(new_token_id);
        char_stats.level.set(U256::from(1));
        char_stats.xp.set(U256::from(0));
        char_stats.strength.set(U256::from(10));
        char_stats.agility.set(U256::from(10));
        char_stats.intelligence.set(U256::from(10));
        char_stats.vitality.set(U256::from(10));
        char_stats.last_action_timestamp.set(U256::from(block::timestamp()));
        char_stats.char_class.set(0); // Novice

        Ok(())
    }

    /// Mints a procedurally generated Avatar NFT directly with JSON Base64 metadata
    pub fn mint_avatar(&mut self, uri: String) -> Result<(), Vec<u8>> {
        let minter = msg::sender();
        let new_token_id = self.erc721.total_supply.get();
        
        // Use the native ERC721 mint without throwing Soulbound restrictions because from=0x0
        self.erc721.mint(minter).map_err(|_| Vec::new())?;

        // Save the massive Base64 token URI string natively to the blockchain map
        let mut uri_setter = self.token_uris.setter(new_token_id);
        uri_setter.set_str(uri);

        Ok(())
    }

    /// Expose the standard ERC721 tokenURI for MetaMask / OpenSea rendering
    #[selector(name = "tokenURI")]
    pub fn token_uri(&self, token_id: U256) -> Result<String, Vec<u8>> {
        self.erc721.owner_of(token_id).map_err(|_| Vec::new())?; // Validates token exists
        let uri = self.token_uris.get(token_id).get_string();
        Ok(uri)
    }

    /// Train a specific stat (Costs Stamina, grants XP)
    /// stat_id: 0 = STR, 1 = AGI, 2 = INT, 3 = VIT
    pub fn train(&mut self, token_id: U256, stat_id: u8) -> Result<(), Vec<u8>> {
        self.require_owner(token_id)?;
        self.consume_stamina(token_id, 10)?; // Costs 10 Stamina

        let mut char_stats = self.characters.setter(token_id);
        
        // Increase the specific stat
        match stat_id {
            0 => {
                let current = char_stats.strength.get();
                char_stats.strength.set(current + U256::from(1));
            },
            1 => {
                let current = char_stats.agility.get();
                char_stats.agility.set(current + U256::from(1));
            },
            2 => {
                let current = char_stats.intelligence.get();
                char_stats.intelligence.set(current + U256::from(1));
            },
            3 => {
                let current = char_stats.vitality.get();
                char_stats.vitality.set(current + U256::from(1));
            },
            _ => {} // Invalid stat defaults to nothing
        }

        // Grant XP and check level up
        self.add_xp_internal(token_id, U256::from(20));

        Ok(())
    }

    /// On-chain deterministic encounter (Costs Stamina, grants XP on win)
    pub fn explore(&mut self, token_id: U256) -> Result<(), Vec<u8>> {
        self.require_owner(token_id)?;
        self.consume_stamina(token_id, 20)?; // Explore costs more stamina

        // Simple deterministic randomness using block timestamp and token id
        let pseudo_random = (block::timestamp() ^ token_id.to::<u64>()) % 100;

        let char_stats = self.characters.getter(token_id);
        let total_power = char_stats.strength.get() + char_stats.agility.get() + char_stats.intelligence.get();
        let mon_power = U256::from(15 + pseudo_random % 20); // Monster power varies

        let victory = total_power >= mon_power;
        
        if victory {
            // Reward XP based on monster power
            self.add_xp_internal(token_id, mon_power * U256::from(2));
            stylus_sdk::evm::log(EncounterMoster { token_id, victory: true, xp_gained: mon_power * U256::from(2) });
        } else {
            stylus_sdk::evm::log(EncounterMoster { token_id, victory: false, xp_gained: U256::from(0) });
        }

        // Update Class based on highest stat
        self.update_class_internal(token_id);

        Ok(())
    }

    /// Helpers

    fn require_owner(&self, token_id: U256) -> Result<(), Vec<u8>> {
        let owner = self.erc721.owner_of(token_id).map_err(|_| Vec::new())?; // In real app, convert error cleanly
        if owner != msg::sender() {
            return Err(DynamicSoulboundRPGError::NotOwnerOfToken(NotOwnerOfToken{}).into());
        }
        Ok(())
    }

    fn consume_stamina(&mut self, token_id: U256, cost: u64) -> Result<(), Vec<u8>> {
        let mut char_stats = self.characters.setter(token_id);
        let last_time = char_stats.last_action_timestamp.get().to::<u64>();
        let current_time = block::timestamp();
        
        let seconds_passed = current_time.saturating_sub(last_time);
        
        // Let's say max stamina is 100, regenerates 1 per 10 seconds.
        let mut stamina = seconds_passed / 10;
        if stamina > 100 {
            stamina = 100;
        }

        if stamina < cost {
            return Err(DynamicSoulboundRPGError::NotEnoughStamina(NotEnoughStamina{}).into());
        }

        // Reset timestamp by the consumed amount
        let time_consumed = cost * 10;
        char_stats.last_action_timestamp.set(U256::from(current_time - (seconds_passed - time_consumed)));

        Ok(())
    }

    fn add_xp_internal(&mut self, token_id: U256, xp_gained: U256) {
        let mut char_stats = self.characters.setter(token_id);
        let current_xp = char_stats.xp.get() + xp_gained;
        char_stats.xp.set(current_xp);

        // Simple level curve: Level = sqrt(XP / 50) + 1
        // Since we lack sqrt, we do a simplistic curve check for demonstration:
        // Next level = level * level * 50
        let current_level = char_stats.level.get().to::<u64>();
        let next_level_req = current_level * current_level * 50;
        
        if current_xp.to::<u64>() >= next_level_req {
            let new_level = current_level + 1;
            char_stats.level.set(U256::from(new_level));
            stylus_sdk::evm::log(LevelUp { token_id, new_level: U256::from(new_level) });
        }
    }

    fn update_class_internal(&mut self, token_id: U256) {
        let mut char_stats = self.characters.setter(token_id);
        let s = char_stats.strength.get();
        let a = char_stats.agility.get();
        let i = char_stats.intelligence.get();

        if s > a && s > i {
            char_stats.char_class.set(1); // Warrior
        } else if a > s && a > i {
            char_stats.char_class.set(3); // Rogue
        } else if i > s && i > a {
            char_stats.char_class.set(2); // Mage
        }
    }
}