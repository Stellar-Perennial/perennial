#![no_std]
//! Fixture contract for Perennial: writes one value into each storage type.
//! Not used by the vitest unit tests. Deploy it to testnet to exercise
//! restore/extend by hand (see README, "What to verify first").
use soroban_sdk::{contract, contractimpl, Env, Symbol};

#[contract]
pub struct Fixture;

#[contractimpl]
impl Fixture {
    pub fn put_persistent(env: Env, key: Symbol, value: u32) {
        env.storage().persistent().set(&key, &value);
    }

    pub fn put_temporary(env: Env, key: Symbol, value: u32) {
        env.storage().temporary().set(&key, &value);
    }

    /// Instance storage is one entry for the whole contract: every `key` here
    /// lives inside that single entry and shares its TTL.
    pub fn put_instance(env: Env, key: Symbol, value: u32) {
        env.storage().instance().set(&key, &value);
    }

    pub fn get_persistent(env: Env, key: Symbol) -> Option<u32> {
        env.storage().persistent().get(&key)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{symbol_short, Env};

    #[test]
    fn persistent_roundtrip() {
        let env = Env::default();
        let id = env.register(Fixture, ());
        let client = FixtureClient::new(&env, &id);
        client.put_persistent(&symbol_short!("a"), &1);
        assert_eq!(client.get_persistent(&symbol_short!("a")), Some(1));
    }
}
