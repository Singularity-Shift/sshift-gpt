module sshift_dao_addr::subscription {
    use std::signer;
    use std::vector;

    use aptos_framework::event;
    use aptos_framework::aptos_account;
    use aptos_framework::account;
    use aptos_framework::type_info;
    use aptos_framework::timestamp;
    use aptos_framework::object;
    use aptos_framework::option::{Self, Option};
    use aptos_token_objects::token::{Self, Token};

    use sshift_dao_addr::fees;

    const EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION: u64 = 1;
    const ECOIN_ADDRESS_NOT_MATCH: u64 = 2;
    const ESUBSCRIPTION_PLAN_NOT_EXISTS: u64 = 3;
    const ENOT_OWNER: u64 = 4;

    struct CollectionAddressDiscount has key, store, drop, copy {
        collection_addr: address,
        discount_per_day: u64,
    }
    
    struct SubscriptionPlan has key {
        coin: address,
        price_per_day: u64,
        collections_discount: vector<CollectionAddressDiscount>,
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
            collections_discount: vector::empty(),
        })
    }

    public entry fun set_plan(sender: &signer, coin: address, price_per_day: u64, collection_addresses: vector<address>, discounts_per_day: vector<u64>) acquires SubscriptionPlan {
        check_admin(sender);

        let subscription_plan = borrow_global_mut<SubscriptionPlan>(@sshift_dao_addr);

        subscription_plan.price_per_day = price_per_day;
        subscription_plan.coin = coin;

        let collections_discount = vector::map(collection_addresses, |c| {
            let (_, i)= vector::index_of(&collection_addresses, &c);

            let dpd = vector::borrow(&discounts_per_day, i);

            let collection_discount = CollectionAddressDiscount {
                collection_addr: c,
                discount_per_day: *dpd,
            };

            collection_discount
        });

        subscription_plan.collections_discount = collections_discount
    }

    public entry fun buy_plan<AptosCoin>(sender: &signer, duration: u64, nfts_holding: vector<address>) acquires SubscriptionPlan {
        let days = duration * (24 * 60 * 60);

        let plan = borrow_global<SubscriptionPlan>(@sshift_dao_addr);

        let type_coin = type_info::type_of<AptosCoin>();

        assert!(type_info::account_address(&type_coin) == plan.coin, ECOIN_ADDRESS_NOT_MATCH);

        let resource_account_addr = fees::get_resource_account_address();
        
        let price = plan.price_per_day * days;

        let discount_per_day = get_highest_hold(sender, nfts_holding, plan);


        let discount: u64 = 0;

        if(price / 2 < discount_per_day * days) {
            discount = price / 2;
        } else {
            discount = discount_per_day * days;
        };

        aptos_account::transfer_coins<AptosCoin>(sender, resource_account_addr, plan.price_per_day * days - discount);

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
    public fun get_price_per_day(): u64 acquires SubscriptionPlan {
        let plan = borrow_global<SubscriptionPlan>(@sshift_dao_addr);

        plan.price_per_day
    }

    fun check_admin(sender: &signer) {
        let account_addr = signer::address_of(sender);
        let admin = fees::get_admin();
        assert!(admin == account_addr, EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION);
    }

    fun get_highest_hold(account: &signer, tokens: vector<address>, plan: &SubscriptionPlan): u64 {
        let account_address = signer::address_of(account);
        assert!(vector::all<address>(&tokens, |token_addr| {
            let token = object::address_to_object<Token>(*token_addr);
            object::owns(token, account_address)
        } ), ENOT_OWNER);

        let discounts = vector::map<CollectionAddressDiscount, u64>(plan.collections_discount, |cd| {
            let CollectionAddressDiscount {
                collection_addr, discount_per_day
            } = cd;

            let fit_tokens = vector::filter<address>(tokens, |token_addr| {
                let token = object::address_to_object<Token>(*token_addr);

                let belong_collection_object = token::collection_object(token);

                let belong_collection_addr = object::object_address(&belong_collection_object);

                collection_addr == belong_collection_addr
            });

            vector::length(&fit_tokens) * discount_per_day
        });

        vector::fold<u64, u64>(discounts, 0, |curr, prev| {
            if(curr > prev) {
                curr
            } else {
                prev
            }
        })
    }
}