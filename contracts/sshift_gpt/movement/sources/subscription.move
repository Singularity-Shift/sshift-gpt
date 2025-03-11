module sshift_gpt_addr::subscription {
    use std::signer;
    use std::vector;
    use std::string::String;

    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::primary_fungible_store;
    use aptos_framework::fungible_asset::{Metadata};
    use aptos_framework::object;
    use aptos_token_objects::token::{Self, Token};

    use sshift_gpt_addr::fees;

    const EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION: u64 = 1;
    const ECOIN_ADDRESS_NOT_MATCH: u64 = 2;
    const ESUBSCRIPTION_PLAN_NOT_EXISTS: u64 = 3;
    const ENOT_OWNER: u64 = 4;
    const ENOT_SET_MOVE_BOT_ID: u64 = 5;
    const ENOT__FREE_SUBSCRIPTION_TO_CLAIM: u64 = 6;
    const ENOT_ENOUGH_BALANCE: u64 = 7;
    const ESHOULD_BE_MORE_THAN_ONE_DAY_SUBSCRIPTION: u64 = 8;
    const EHAS_SUBSCRIPTION_ACTIVE: u64 = 9;
    const EHAS_SUBSCRIPTION_TO_CLAIM: u64 = 10;


    struct CollectionAddressDiscount has key, store, drop, copy {
        collection_addr: address,
        discount_per_day: u64
    }

    struct SubscriptionPlan has key, copy {
        prices: vector<u64>,
        collections_discount: vector<CollectionAddressDiscount>,
    }

    struct MoveBotFields {
        token_creator: address,
        token_collection: String,
        token_name: String,
        token_property_version: u64,
    }

    struct FreeSubscription has store, copy {
        account: address,
        duration: u64,
    }

    struct SubscriptionsGifted has key {
        subscriptions: vector<FreeSubscription>,
    }

    struct UserSubscription has key {
        start_time: u64,
        end_time: u64
    }

    #[event]
    struct UserSubscribed has store, drop {
        account: address,
        start_time: u64,
        end_time: u64,
        price: u64,
        created_at: u64
    }

    fun init_module(sender: &signer) {
        move_to(
            sender,
            SubscriptionPlan {
                prices: vector::empty(),
                collections_discount: vector::empty(),
            }
        );

        move_to(
            sender, SubscriptionsGifted {
                subscriptions: vector::empty(),
            }
        );
    }

    public entry fun set_plan(
        sender: &signer,
        prices: vector<u64>,
        collection_addresses: vector<address>,
        discounts_per_day: vector<u64>,
    ) acquires SubscriptionPlan {
        check_admin(sender);

        let subscription_plan = borrow_global_mut<SubscriptionPlan>(@sshift_gpt_addr);

        subscription_plan.prices = prices;

        let collections_discount = vector::map(
            collection_addresses,
            |c| {
                let (_, i) = vector::index_of(&collection_addresses, &c);

                let dpd = vector::borrow(&discounts_per_day, i);

                let collection_discount = CollectionAddressDiscount {
                    collection_addr: c,
                    discount_per_day: *dpd
                };

                collection_discount
            }
        );

        subscription_plan.collections_discount = collections_discount
    }

    public entry fun gift_subscription(sender: &signer, account: address, duration: u64) acquires SubscriptionsGifted, UserSubscription {
        check_admin(sender);

        assert!(!has_subscription_active(account), EHAS_SUBSCRIPTION_ACTIVE);
        assert!(!has_subscription_to_claim(account), EHAS_SUBSCRIPTION_TO_CLAIM);
        

        let free_subscriptions = borrow_global_mut<SubscriptionsGifted>(@sshift_gpt_addr);

        let (has_free_subscription, index) = vector::find(&free_subscriptions.subscriptions,|s| {
            let FreeSubscription {
                account: account_addr,
                duration: _duration,
            }= *s;

            account_addr == account
        });

        if(has_free_subscription) {
            let subscription_to_update = vector::borrow_mut(&mut free_subscriptions.subscriptions, index);

            subscription_to_update.account = account;
            subscription_to_update.duration = duration;
        } else {
            let subscription = FreeSubscription {
                account,
                duration,
            };

            vector::push_back(&mut free_subscriptions.subscriptions, subscription);
        };
    }

    public entry fun claim_subscription(sender: &signer) acquires SubscriptionsGifted, UserSubscription {
        let account_addr = signer::address_of(sender);

        let free_subscriptions = borrow_global_mut<SubscriptionsGifted>(@sshift_gpt_addr);

        let (has_free_subscription, index) = vector::find(&free_subscriptions.subscriptions, |s| {
            let FreeSubscription {
                account,
                duration: duration,
            }= *s;

            account == account_addr && duration > 0
        });

        assert!(has_free_subscription, ENOT__FREE_SUBSCRIPTION_TO_CLAIM);

        let subscription = vector::borrow_mut<FreeSubscription>(&mut free_subscriptions.subscriptions, index);

        let start_time = timestamp::now_seconds();

        if(exists<UserSubscription>(account_addr)) {
            let subscription_obj = borrow_global_mut<UserSubscription>(account_addr);

            subscription_obj.start_time = start_time;
            subscription_obj.end_time = start_time + subscription.duration;

        } else {
            move_to(
                sender,
                UserSubscription { start_time, end_time: start_time + subscription.duration }
            );
        };

        subscription.duration = 0;

        event::emit(
            UserSubscribed {
                account: account_addr,
                start_time,
                end_time: start_time + subscription.duration,
                price: 0,
                created_at: timestamp::now_seconds(),
            }
        );
    }

    public entry fun buy_plan(
        sender: &signer,
        duration: u64,
        nfts_holding: vector<address>
    ) acquires SubscriptionPlan, UserSubscription {
        let buyer_addr = signer::address_of(sender);

        assert!(!has_subscription_active(buyer_addr), EHAS_SUBSCRIPTION_ACTIVE);

        let days = duration / (24 * 60 * 60);

        assert!(days >= 1, ESHOULD_BE_MORE_THAN_ONE_DAY_SUBSCRIPTION);

        let plan = borrow_global<SubscriptionPlan>(@sshift_gpt_addr);

        let currency_addr = fees::get_currency_addr();

        let currency_metadata = object::address_to_object<Metadata>(currency_addr);

        let resource_account_addr = fees::get_resource_account_address();

        let price = *vector::borrow(&plan.prices, days - 1);

        let discount_per_day = get_highest_hold(sender, nfts_holding, plan);

        let discount: u64;

        if (price / 2 < discount_per_day * days) {
            discount = price / 2;
        } else {
            discount = discount_per_day * days;
        };

        let sender_balance = primary_fungible_store::balance(buyer_addr, currency_metadata);

        assert!(price - discount < sender_balance, ENOT_ENOUGH_BALANCE);

        primary_fungible_store::transfer(sender, currency_metadata, resource_account_addr, price - discount);

        let start_time = timestamp::now_seconds();

        if(exists<UserSubscription>(buyer_addr)) {
            let subscription = borrow_global_mut<UserSubscription>(buyer_addr);

            subscription.start_time = start_time;
            subscription.end_time = start_time + duration;

        } else {
            move_to(
                sender,
                UserSubscription { start_time, end_time: start_time + duration }
            );
        };

        event::emit(
            UserSubscribed {
                account: buyer_addr,
                start_time,
                end_time: start_time + duration,
                price: price - discount,
                created_at: timestamp::now_seconds(),
            }
        );
    }

    #[view]
    public fun get_subscription_config(): SubscriptionPlan acquires SubscriptionPlan {
        *borrow_global<SubscriptionPlan>(@sshift_gpt_addr)
    }


    #[view]
    public fun get_plan(account: address): (u64, u64) acquires UserSubscription {
        let user_subsciption = borrow_global<UserSubscription>(account);

        (user_subsciption.start_time, user_subsciption.end_time)
    }

    #[view]
    public fun get_prices(): vector<u64> acquires SubscriptionPlan {
        let plan = borrow_global<SubscriptionPlan>(@sshift_gpt_addr);

        plan.prices
    }

    #[view]
    public fun has_subscription_active(account: address): bool acquires UserSubscription {
        let is_active = false;

        if(exists<UserSubscription>(account)) {
            let user_subsciption = borrow_global<UserSubscription>(account);

            if(timestamp::now_seconds() < user_subsciption.end_time) {
                is_active = true;
            }
        };
        
        is_active
    }

    #[view]
    public fun has_subscription_to_claim(account: address): bool acquires SubscriptionsGifted {
        let free_subscriptions = borrow_global<SubscriptionsGifted>(@sshift_gpt_addr);

        let (has_free_subscription, _index) = vector::find(&free_subscriptions.subscriptions,|s| {
            let FreeSubscription {
                account: account_addr,
                duration,
            }= *s;

            account_addr == account&& duration > 0
        });

        if(has_free_subscription) { return true };

        false
    }

    #[view]
    public fun get_subscription_to_claim(account_addr: address): FreeSubscription acquires SubscriptionsGifted {
        let free_subscriptions = borrow_global<SubscriptionsGifted>(@sshift_gpt_addr);

        let (has_free_subscription, index) = vector::find(&free_subscriptions.subscriptions,|s| {
            let FreeSubscription {
                account,
                duration: _duration,
            }= *s;

            account == account_addr
        });

        assert!(has_free_subscription, ENOT__FREE_SUBSCRIPTION_TO_CLAIM);

        *vector::borrow<FreeSubscription>(&free_subscriptions.subscriptions, index)
    }


    fun check_admin(sender: &signer) {
        let account_addr = signer::address_of(sender);
        let admin = fees::get_admin();
        assert!(
            admin == account_addr, EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION
        );
    }

    fun get_highest_hold(
        account: &signer, tokens: vector<address>, plan: &SubscriptionPlan
    ): u64 {
        let account_address = signer::address_of(account);
        assert!(
            vector::all<address>(
                &tokens,
                |token_addr| {
                    let token = object::address_to_object<Token>(*token_addr);
                    object::owns(token, account_address)
                }
            ),
            ENOT_OWNER
        );

        let discounts = vector::map<CollectionAddressDiscount, u64>(
            plan.collections_discount,
            |cd| {
                let CollectionAddressDiscount { collection_addr, discount_per_day } = cd;

                let fit_tokens = vector::filter<address>(
                    tokens,
                    |token_addr| {
                        let token = object::address_to_object<Token>(*token_addr);

                        let belong_collection_object = token::collection_object(token);

                        let belong_collection_addr =
                            object::object_address(&belong_collection_object);

                        collection_addr == belong_collection_addr
                    }
                );

                vector::length(&fit_tokens) * discount_per_day
            }
        );

        vector::fold<u64, u64>(
            discounts,
            0,
            |curr, prev| {
                if (curr > prev) { curr }
                else { prev }
            }
        )
    }

    #[test_only]
    use aptos_token_objects::collection::{Self, Collection};

    #[test_only]
    use aptos_framework::account;

    #[test_only]
    use aptos_framework::aptos_coin::{Self, AptosCoin};

    #[test_only]
    use aptos_framework::coin;

    #[test_only]
    use std::string;

    #[test_only]
    use aptos_framework::object::{Object};

    #[test_only]
    use aptos_std::string_utils;

    #[test_only]
    use aptos_framework::fungible_asset::{Self, MintRef, TransferRef};

    #[test_only]
    use aptos_std::debug::print;

    #[test_only]
    use std::option;

    #[test_only]
    const EINCORRECT_BALANCE: u64 = 7;
    
    #[test_only]
    const ECLAIM_FREE_SUBSCRIPTION: u64 = 8;

    #[test_only]
    const ESHOULD_HAVE_SUBSCRIPTION_ACTIVE: u64 = 9;

    #[test_only]
    const ESHOULD_NOT_HAVE_SUBSCRIPTION_ACTIVE: u64 = 10;

    #[test_only]
    const EPRICES_LIST_SHOULD_HAVE_30_ELEMENTS: u64 = 11;

    #[test_only]
    struct FAController has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
    }

    #[test_only]
    fun create_resource_account(sender: &signer, admin: &signer) {
        let admin_addr = signer::address_of(admin);

        fees::initialize_for_test(sender);

        fees::create_resource_account(sender, b"test", vector[admin_addr]);

        fees::create_collector_object(admin);
    }

    #[test_only]
    fun create_fa(): Object<Metadata> {
        let fa_owner_obj_constructor_ref = &object::create_object(@sshift_gpt_addr);
        let fa_owner_obj_signer = &object::generate_signer(fa_owner_obj_constructor_ref);

        let name = string::utf8(b"usdt test");

        let fa_obj_constructor_ref = &object::create_named_object(
            fa_owner_obj_signer,
            *string::bytes(&name),
        );

        let fa_obj_signer = &object::generate_signer(fa_obj_constructor_ref);


        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            fa_obj_constructor_ref,
            option::none(),
            name,
            string::utf8(b"USDT"),
            8,
            string::utf8(b"test"),
            string::utf8(b"usdt_project"),
        );

        let fa_obj = object::object_from_constructor_ref<Metadata>(fa_obj_constructor_ref);

        let mint_ref = fungible_asset::generate_mint_ref(fa_obj_constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(fa_obj_constructor_ref);

        move_to(fa_obj_signer, FAController {
            mint_ref,
            transfer_ref,
        });

        fa_obj
    }

    #[test_only]
    fun mint_fa(sender: &signer, mint_ref: &MintRef, amount: u64) {
        let account_addr = signer::address_of(sender);

        primary_fungible_store::mint(mint_ref, account_addr, amount);
    }

    #[test_only]
    fun create_collection(creator: &signer, description: String, amount: u64, name: String, url: String ): address {
        let collection_obj_constructor_ref = collection::create_fixed_collection(
            creator, 
            description,
            amount,
            name,
            option::none(),
            url
        );
        
        let collection_obj_signer = object::generate_signer(&collection_obj_constructor_ref);
        signer::address_of(&collection_obj_signer)
    }

    #[test_only]
    fun mint_nft(creator: &signer, collection_address: address, name: String, description: String, uri: String, to: address): address { 
        let collection_obj = object::address_to_object<Collection>(collection_address);
        let collection_name = collection::name(collection_obj);

        let construct_ref = token::create_named_token(creator, collection_name, description, name, option::none(), uri);

        let transfer_ref = object::generate_transfer_ref(&construct_ref);

        let token_object = object::object_from_constructor_ref<Token>(&construct_ref);

        object::transfer(creator, token_object, to);

        object::enable_ungated_transfer(&transfer_ref);

        object::object_address(&token_object)
    }

    #[test_only]
    fun create_subscription(sender: &signer, admin: &signer): (address, address) acquires SubscriptionPlan {
        let admin_addr = signer::address_of(admin);

        create_resource_account(sender, admin);

        fees::set_pending_admin(sender, admin_addr);

        fees::accept_admin(admin);


        let collection_addr_1 = create_collection(
            admin,
            string::utf8(b"Sshift test v1"),
            5000,
            string::utf8(b"Sshift NFT v1"),
            string::utf8(b"https://gateway.irys.xyz/manifest_id/collection.json")
        );

        let collection_addr_2 = create_collection(
            admin,
            string::utf8(b"Sshift test v2"),
            5000,
            string::utf8(b"Sshift NFT v2"),
            string::utf8(b"https://gateway.irys.xyz/manifest_id/collection.json")
        );

        let collections_v2 = vector::empty();
        vector::push_back(&mut collections_v2, collection_addr_1);
        vector::push_back(&mut collections_v2, collection_addr_2);

        let discounts = vector::empty();
        vector::push_back(&mut discounts, 1000000);
        vector::push_back(&mut discounts, 2000000);

        init_module(sender);

        let prices: vector<u64> = vector[200000000,326000000,434000000,531000000,622000000,707000000,789000000,866000000,941000000,1014000000,1084000000,1153000000,1220000000,1285000000,1350000000,1412000000,1474000000,1535000000,1594000000,1653000000,1711000000,1768000000,1824000000,1880000000,1935000000,1989000000,2043000000,2096000000,2148000000,2200000000];

        set_plan(admin,
            prices,
            collections_v2,
            discounts
        );

        (collection_addr_1, collection_addr_2)
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200
        )
    ]
    fun should_create_subscription(aptos_framework: &signer, owner: &signer, admin: &signer) acquires SubscriptionPlan {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);

        let admin_addr = signer::address_of(admin);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        create_subscription(owner, admin);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_buy_subscription(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, FAController, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        create_subscription(owner, admin);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees::set_currency(admin, fa_addr);

        buy_plan(user, 604800, vector::empty());

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

        assert!(user_balance == 19999211000000, EINCORRECT_BALANCE);

        let prices_list = get_prices();

        assert!(vector::length(&prices_list) == 30, EPRICES_LIST_SHOULD_HAVE_30_ELEMENTS);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_buy_subscription_if_previous_expired(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, FAController, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        create_subscription(owner, admin);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees::set_currency(admin, fa_addr);

        buy_plan(user, 604800, vector::empty());

        timestamp::update_global_time_for_test_secs(804800);

        buy_plan(user, 604800, vector::empty());

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

        assert!(user_balance == 19998422000000, EINCORRECT_BALANCE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_buy_subscription_with_discount_per_one_nft(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, FAController, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        let (collection_addr_1, _collection_addr_2) = create_subscription(owner, admin);

        let token_addr = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n1 v1"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr);

        let token_holding = vector::empty();

        vector::push_back(&mut token_holding, token_addr);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees::set_currency(admin, fa_addr);

        buy_plan(user, 604800, token_holding);

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

        assert!(user_balance == 19999218000000, EINCORRECT_BALANCE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_buy_subscription_with_discount_per_three_nft(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, FAController, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        let (collection_addr_1, _collection_addr_2) = create_subscription(owner, admin);

        let token_addr_1 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n1 v1"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr);
        let token_addr_2 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n2 v1"), string::utf8(b"Sshift token n2"), string::utf8(b"Sshift"), user_addr);
        let token_addr_3 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n3 v1"), string::utf8(b"Sshift token n3"), string::utf8(b"Sshift"), user_addr);

        let token_holding = vector::empty();

        vector::push_back(&mut token_holding, token_addr_1);
        vector::push_back(&mut token_holding, token_addr_2);
        vector::push_back(&mut token_holding, token_addr_3);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees::set_currency(admin, fa_addr);

        buy_plan(user, 604800, token_holding);

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

        print(&user_balance);

        assert!(user_balance == 19999232000000, EINCORRECT_BALANCE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_buy_subscription_with_discount_with_highest_holding(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, FAController, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        let (collection_addr_1, collection_addr_2) = create_subscription(owner, admin);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees::set_currency(admin, fa_addr);


        let token_addr_1 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n1 v1"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr);
        let token_addr_2 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n2 v1"), string::utf8(b"Sshift token n2"), string::utf8(b"Sshift"), user_addr);
        let token_addr_3 = mint_nft(admin, collection_addr_2, string::utf8(b"Sshift token n1 v2"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr);

        let token_holding = vector::empty();

        vector::push_back(&mut token_holding, token_addr_1);
        vector::push_back(&mut token_holding, token_addr_2);
        vector::push_back(&mut token_holding, token_addr_3);

        buy_plan(user, 604800, token_holding);

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

        assert!(user_balance == 19999225000000, EINCORRECT_BALANCE);
        

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_buy_subscription_with_max_discount(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, FAController, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        let (collection_addr_1, _collection_addr_2) = create_subscription(owner, admin);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees::set_currency(admin, fa_addr);

        let token_holding = vector::empty();

        for(i in 0..100) {
            let token_addr = mint_nft(admin, collection_addr_1, string_utils::format1(&b"Sshift token n{} v1", i), string_utils::format1(&b"Sshift token n{}", i), string::utf8(b"Sshift"), user_addr);
            vector::push_back(&mut token_holding, token_addr);
        };

        buy_plan(user, 604800, token_holding);

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

        assert!(user_balance == 19999605500000, EINCORRECT_BALANCE);
        
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_claim_free_subscription(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionsGifted, SubscriptionPlan, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        create_subscription(owner, admin);

        timestamp::update_global_time_for_test_secs(10000);

        gift_subscription(admin, user_addr, 604800);

        claim_subscription(user);

        let (start_time, end_time) = get_plan(user_addr);

        assert!(start_time > 0 && end_time > start_time, ECLAIM_FREE_SUBSCRIPTION);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_have_active_subscription_after_buying(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, UserSubscription, FAController {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        create_subscription(owner, admin);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees::set_currency(admin, fa_addr);

        buy_plan(user, 604800, vector::empty());

        let is_active = has_subscription_active(user_addr);

        assert!(is_active == true, ESHOULD_HAVE_SUBSCRIPTION_ACTIVE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_not_have_active_duration_after_expire(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, UserSubscription, FAController {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        create_subscription(owner, admin);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees::set_currency(admin, fa_addr);

        buy_plan(user, 604800, vector::empty());

        timestamp::update_global_time_for_test_secs(804800);

        let is_active = has_subscription_active(user_addr);

        assert!(is_active == false, ESHOULD_NOT_HAVE_SUBSCRIPTION_ACTIVE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_have_active_subscription_after_claim(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionsGifted, SubscriptionPlan, UserSubscription {
          let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        create_subscription(owner, admin);

        timestamp::update_global_time_for_test_secs(10000);

        gift_subscription(admin, user_addr, 604800);

        claim_subscription(user);

        let is_active = has_subscription_active(user_addr);

        assert!(is_active == true, ESHOULD_HAVE_SUBSCRIPTION_ACTIVE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_be_able_to_gift_again_after_previous_expired(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionsGifted, SubscriptionPlan, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        create_subscription(owner, admin);

        timestamp::update_global_time_for_test_secs(10000);

        gift_subscription(admin, user_addr, 604800);

        claim_subscription(user);

        timestamp::update_global_time_for_test_secs(704800);

        let is_active = has_subscription_active(user_addr);

        assert!(!is_active, ESHOULD_NOT_HAVE_SUBSCRIPTION_ACTIVE);

        gift_subscription(admin, user_addr, 604800);

        claim_subscription(user);

        is_active = has_subscription_active(user_addr);

        assert!(is_active == true, ESHOULD_HAVE_SUBSCRIPTION_ACTIVE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_not_have_active_free_subscription_after_expire(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionsGifted, SubscriptionPlan, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        create_subscription(owner, admin);

        timestamp::update_global_time_for_test_secs(10000);

        gift_subscription(admin, user_addr, 604800);

        claim_subscription(user);

        timestamp::update_global_time_for_test_secs(804800);

        let is_active = has_subscription_active(user_addr);

        assert!(is_active == false, ESHOULD_NOT_HAVE_SUBSCRIPTION_ACTIVE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_not_have_active_subscription_without_claiming_or_buying(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        create_subscription(owner, admin);

        let is_active = has_subscription_active(user_addr);

        assert!(is_active == false, ESHOULD_NOT_HAVE_SUBSCRIPTION_ACTIVE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    #[expected_failure(abort_code = 8, location = Self)]
    fun should_not_buy_subscription_for_less_one_day(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, FAController, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        create_subscription(owner, admin);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees::set_currency(admin, fa_addr);

        buy_plan(user, 100, vector::empty());

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

        assert!(user_balance == 19999999300000, EINCORRECT_BALANCE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    #[expected_failure(abort_code = 1, location = Self)]
    fun set_plan_with_not_admin_account(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        let admin_addr = signer::address_of(admin);

        create_resource_account(owner, admin);

        fees::set_pending_admin(owner, admin_addr);

        fees::accept_admin(admin);


        let collection_addr_1 = create_collection(
            admin,
            string::utf8(b"Sshift test v1"),
            1000,
            string::utf8(b"Sshift NFT v1"),
            string::utf8(b"https://gateway.irys.xyz/manifest_id/collection.json")
        );

        let collection_addr_2 = create_collection(
            admin,
            string::utf8(b"Sshift test v2"),
            1000,
            string::utf8(b"Sshift NFT v2"),
            string::utf8(b"https://gateway.irys.xyz/manifest_id/collection.json")
        );

        let collections_v2 = vector::empty();
        vector::push_back(&mut collections_v2, collection_addr_1);
        vector::push_back(&mut collections_v2, collection_addr_2);

        let discounts = vector::empty();
        vector::push_back(&mut discounts, 3000);
        vector::push_back(&mut discounts, 4000);
        

        init_module(owner);

        let prices: vector<u64> = vector[200000000,326000000,434000000,531000000,622000000,707000000,789000000,866000000,941000000,1014000000,1084000000,1153000000,1220000000,1285000000,1350000000,1412000000,1474000000,1535000000,1594000000,1653000000,1711000000,1768000000,1824000000,1880000000,1935000000,1989000000,2043000000,2096000000,2148000000,2200000000];

        set_plan(user,
            prices,
            collections_v2,
            discounts,
        );

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    #[expected_failure(abort_code = 1, location = Self)]
    fun gift_subscription_with_not_admin_account(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, SubscriptionsGifted, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        create_subscription(owner, admin);

        timestamp::update_global_time_for_test_secs(10000);

        gift_subscription(user, user_addr, 604800);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user1 = @0x300,
            user2 = @0x400,
        )
    ]
    #[expected_failure(abort_code = 4, location = Self)]
    fun buying_subscription_pretending_having_discount_with_nft_that_account_not_hold(aptos_framework: &signer, owner: &signer, admin: &signer, user1: &signer, user2: &signer) acquires SubscriptionPlan, FAController, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr1 = signer::address_of(user1);
        let user_addr2 = signer::address_of(user2);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr1);
        coin::register<AptosCoin>(user1);

        aptos_coin::mint(aptos_framework, user_addr1, 20000000000);

        account::create_account_for_test(user_addr2);
        coin::register<AptosCoin>(user2);

        aptos_coin::mint(aptos_framework, user_addr2, 20000000000);

        let (collection_addr_1, _collection_addr_2) = create_subscription(owner, admin);

        let fa_obj = create_fa();
        
        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        fees::set_currency(admin, fa_addr);

        mint_fa(user2, &fa_controller.mint_ref, 20000000000000);

        let token_addr_1 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n1 v1"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr1);

        let token_holding = vector::empty();

        vector::push_back(&mut token_holding, token_addr_1);

        buy_plan(user2, 604800, token_holding);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300,
        )
    ]
    #[expected_failure(abort_code = 10, location = Self)]
    fun should_not_gift_subscription_an_account_which_has_already_one(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionsGifted, SubscriptionPlan, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        create_subscription(owner, admin);

        gift_subscription(admin, user_addr, 604800);

        gift_subscription(admin, user_addr, 604800);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300,
        )
    ]
    #[expected_failure(abort_code = 9, location = Self)]
    fun should_not_gift_subscription_an_account_which_has_on_activated(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionsGifted, SubscriptionPlan, UserSubscription, FAController {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        create_subscription(owner, admin);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees::set_currency(admin, fa_addr);

        buy_plan(user, 604800, vector::empty());

        gift_subscription(admin, user_addr, 604800);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300,
        )
    ]
    #[expected_failure(abort_code = 9, location = Self)]
    fun should_not_buy_subscription_when_account_has_one_activated(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, UserSubscription, FAController {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        create_subscription(owner, admin);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees::set_currency(admin, fa_addr);

        buy_plan(user, 604800, vector::empty());

        buy_plan(user, 604800, vector::empty());

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    #[expected_failure(abort_code = 6, location = Self)]
    fun should_not_claim_active_free_subscription_after_expire(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionsGifted, SubscriptionPlan, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        create_subscription(owner, admin);

        timestamp::update_global_time_for_test_secs(10000);

        gift_subscription(admin, user_addr, 604800);

        claim_subscription(user);

        timestamp::update_global_time_for_test_secs(804800);

        claim_subscription(user);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_gpt_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    #[expected_failure(abort_code = 6, location = Self)]
    fun should_not_claim_active_free_subscription_if_already_claimed(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionsGifted, SubscriptionPlan, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        create_subscription(owner, admin);

        timestamp::update_global_time_for_test_secs(10000);

        gift_subscription(admin, user_addr, 604800);

        claim_subscription(user);

        claim_subscription(user);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }
}
