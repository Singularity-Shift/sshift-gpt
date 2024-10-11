module sshift_dao_addr::subscription {
    use std::signer;

    use aptos_framework::event;
    use aptos_framework::aptos_account;
    use aptos_framework::account;
    use aptos_framework::type_info;
    use aptos_framework::timestamp;

    use sshift_dao_addr::fees;

    const EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION: u64 = 1;
    const ECOIN_ADDRESS_NOT_MATCH: u64 = 2;
    const ESUBSCRIPTION_PLAN_NOT_EXISTS: u64 = 3;
    
    struct SubscriptionPlan has key {
        coin: address,
        price_per_day: u64,
    }

    struct UserSubscription has key {
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

    fun init_module(sender: &signer) {
        let owner_addr = signer::address_of(sender);

        move_to(sender, SubscriptionPlan{
            coin: owner_addr,
            price_per_day: 0,
        })
    }

    public entry fun set_plan(sender: &signer, coin: address, price_per_day: u64) acquires SubscriptionPlan {
        check_admin(sender);

        let subscription_plan = borrow_global_mut<SubscriptionPlan>(@sshift_dao_addr);

        subscription_plan.price_per_day = price_per_day;
        subscription_plan.coin = coin;
    }

    public entry fun buy_plan<AptosCoin>(sender: &signer, duration: u64) acquires SubscriptionPlan {
        let days = duration * (24 * 60 * 60);

        let plan = borrow_global<SubscriptionPlan>(@sshift_dao_addr);

        let type_coin = type_info::type_of<AptosCoin>();

        assert!(type_info::account_address(&type_coin) == plan.coin, ECOIN_ADDRESS_NOT_MATCH);

        let resource_account_addr = fees::get_resource_account_address();

        aptos_account::transfer_coins<AptosCoin>(sender, resource_account_addr, plan.price_per_day * days);

        let start_time = timestamp::now_seconds();

        move_to(sender, UserSubscription {
            start_time,
            end_time: start_time + duration
        })
    }
    

    #[view]
    public fun get_plan(account: address): (u64, u64) acquires UserSubscription {
        let user_subsciption = borrow_global<UserSubscription>(account);

        (user_subsciption.start_time, user_subsciption.end_time)
    }

    #[view]
    public fun get_price_per_day(): u64 {
        let plan = borrow_global<SubscriptionPlan>(@sshift_dao_addr);

        plan.price_per_day
    }

    fun check_admin(sender: &signer) {
        let account_addr = signer::address_of(sender);
        let admin = fees::get_admin();
        assert!(admin == account_addr, EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION);
    }
}