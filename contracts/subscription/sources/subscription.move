module sshift_dao_addr::subscription {
    use std::vector;
    use aptos_std::smart_vector::{Self, SmartVector};
    use std::signer;
    use std::option::{Self, Option};
    use std::error;

    use aptos_framework::event;
    use aptos_framework::aptos_account;
    use aptos_framework::account::{Self, SignerCapability};

    use sshift_dao_addr::fees::{Self, FeesToClaim, FeesAdmin};

    const EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION: u64 = 1;
    
    struct SubscriptionPlan has store {
        plan_id: u64,
        name: vector<u8>,
        price: u64,
        duration: u64,
        active: bool,
    }

    struct SubscriptionPlansCreated has key {
        plans: SmartVector<SubscriptionPlan>,
    }

    struct UserSubscription has key {
        plan_id: u64,
        start_time: u64,
        end_time: u64,
    }

    #[event]
    struct PlanCreated has store, drop {
        plan_id: u64,
        name: vector<u8>,
        price: u64,
        duration: u64,
        created_at: u64,
    }

    #[event]
    struct UserSubscribed has store, drop {
        account: address,
        plan_id: u64,
        start_time: u64,
        end_time: u64,
        created_at: u64,
    }

    #[event]
    struct Claimed has store, drop {
        collector: address,
        amount: u64,
        created_at: u64,
    }

    fun init_module(sender: &signer) {
        move_to(sender, SubscriptionPlansCreated {
            plans: smart_vector::empty(),
        });
    }
}