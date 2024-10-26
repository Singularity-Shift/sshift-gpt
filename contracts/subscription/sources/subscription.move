module sshift_dao_addr::subscription {
    use std::signer;
    use std::vector;
    use std::option::{Self, Option};

    use aptos_framework::event;
    use aptos_framework::aptos_account;
    use aptos_framework::type_info;
    use aptos_framework::timestamp;
    use aptos_token::token as token_v1;
    use aptos_framework::object::{Self, Object};
    use aptos_token_objects::token::{Self, Token};

    use sshift_dao_addr::fees;

    const EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION: u64 = 1;
    const ECOIN_ADDRESS_NOT_MATCH: u64 = 2;
    const ESUBSCRIPTION_PLAN_NOT_EXISTS: u64 = 3;
    const ENOT_OWNER: u64 = 4;
    const ENOT_SET_MOVE_BOT_ID: u64 = 5;
    const ENOT__FREE_SUBSCRIPTION_TO_CLAIM: u64 = 6;

    struct CollectionAddressDiscount has key, store, drop, copy {
        collection_addr: address,
        discount_per_day: u64
    }

    struct SubscriptionPlan has key {
        coin: address,
        price_per_day: u64,
        collections_discount: vector<CollectionAddressDiscount>,
        move_bot_id: Option<token_v1::TokenId>,
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

    struct MoveBot has key {
        nft_id: token_v1::TokenId
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
        let owner_addr = signer::address_of(sender);

        move_to(
            sender,
            SubscriptionPlan {
                coin: owner_addr,
                price_per_day: 0,
                collections_discount: vector::empty(),
                move_bot_id: option::none(),
            }
        );

        move_to(
            sender, SubscriptionsGifted {
                subscriptions: vector::empty(),
            }
        )
    }

    public entry fun set_plan(
        sender: &signer,
        coin: address,
        price_per_day: u64,
        collection_addresses: vector<address>,
        discounts_per_day: vector<u64>,
        move_bot_obj: Object<MoveBot>,
    ) acquires SubscriptionPlan, MoveBot {
        check_admin(sender);

        let subscription_plan = borrow_global_mut<SubscriptionPlan>(@sshift_dao_addr);

        subscription_plan.price_per_day = price_per_day;
        subscription_plan.coin = coin;

        let move_bot_addr = object::object_address(&move_bot_obj);
        let move_bot = borrow_global<MoveBot>(move_bot_addr);

        let move_token_id = move_bot.nft_id;

        subscription_plan.move_bot_id = option::some(move_token_id);

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

    public entry fun gift_subscription(sender: &signer, account: address, duration: u64) acquires SubscriptionsGifted {
        check_admin(sender);

        let free_subscriptions = borrow_global_mut<SubscriptionsGifted>(@sshift_dao_addr);

        let subscription = FreeSubscription {
            account,
            duration,
        };

        vector::push_back(&mut free_subscriptions.subscriptions, subscription);
    }

    public entry fun claim_subscription(sender: &signer) acquires SubscriptionsGifted {
        let account_addr = signer::address_of(sender);

        let free_subscriptions = borrow_global<SubscriptionsGifted>(@sshift_dao_addr);

        let (has_free_subscription, index) = vector::find(&free_subscriptions.subscriptions, |s| {
            let FreeSubscription {
                account,
                duration: _duration,
            }= *s;

            account == account_addr
        });

        assert!(has_free_subscription, ENOT__FREE_SUBSCRIPTION_TO_CLAIM);

        let subscription = vector::borrow<FreeSubscription>(&free_subscriptions.subscriptions, index);

        let start_time = timestamp::now_seconds();

        move_to(
            sender,
            UserSubscription { start_time, end_time: start_time + subscription.duration }
        );

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

    public entry fun buy_plan<CoinType>(
        sender: &signer,
        duration: u64,
        nfts_holding: vector<address>
    ) acquires SubscriptionPlan {
        let buyer_addr = signer::address_of(sender);

        let days = duration / (24 * 60 * 60);

        let plan = borrow_global<SubscriptionPlan>(@sshift_dao_addr);

        assert!(option::is_some(&plan.move_bot_id), ENOT_SET_MOVE_BOT_ID);

        let type_coin = type_info::type_of<CoinType>();

        assert!(
            type_info::account_address(&type_coin) == plan.coin,
            ECOIN_ADDRESS_NOT_MATCH
        );

        let move_bot_id = option::borrow(&plan.move_bot_id);

        let hold_move_token = token_v1::balance_of(buyer_addr, *move_bot_id);

        let resource_account_addr = fees::get_resource_account_address();

        let price = plan.price_per_day * days;

        let discount_per_day = get_highest_hold(sender, nfts_holding, plan);

        let discount: u64;

        if (hold_move_token > 0) {
            discount = price / 2;
        } else {
            if (price / 2 < discount_per_day * days) {
                discount = price / 2;
            } else {
                discount = discount_per_day * days;
            };
        };

        aptos_account::transfer_coins<CoinType>(
            sender,
            resource_account_addr,
            plan.price_per_day * days - discount
        );

        let start_time = timestamp::now_seconds();

        move_to(
            sender,
            UserSubscription { start_time, end_time: start_time + duration }
        );

        event::emit(
            UserSubscribed {
                account: buyer_addr,
                start_time,
                end_time: start_time + duration,
                price: plan.price_per_day * days - discount,
                created_at: timestamp::now_seconds(),
            }
        );
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
    use std::string::{Self, String};

    #[test_only]
    use aptos_std::string_utils;

    #[test_only]
    const EINCORRECT_BALANCE: u64 = 7;
    
    #[test_only]
    const ECLAIM_FREE_SUBSCRIPTION: u64 = 8;

    #[test_only]
    const ESHOULD_HAVE_SUBSCRIPTION_ACTIVE: u64 = 9;

    #[test_only]
    const ESHOULD_NOT_HAVE_SUBSCRIPTION_ACTIVE: u64 = 10;

    #[test_only]
    struct UsdcCoin {}

    #[test_only]
    fun create_resource_account(sender: &signer, admin: &signer) {
        let admin_addr = signer::address_of(admin);

        fees::initialize_for_test(sender);

        fees::create_resource_account(sender, b"test", vector[admin_addr]);

        fees::create_collector_object(admin);
    }

    #[test_only]
    fun create_move_bot(sender: &signer): token_v1::TokenDataId {
        let collection_name = string::utf8(b"Move Bot");
        let description = string::utf8(b"Move Bot collection");
        let collection_uri = string::utf8(b"Move Bot url");
        let token_name = string::utf8(b"My Move Bot");
        let token_uri = string::utf8(b"My Token Move Bot");
        let maximum_supply = 0;
        let mutate_setting = vector<bool>[ false, false, false ];

        let resource_account_addr = fees::get_resource_account_address();

        // Create the nft collection.
        token_v1::create_collection(sender, collection_name, description, collection_uri, maximum_supply, mutate_setting);

        let token_data_id = token_v1::create_tokendata(
            sender,
            collection_name,
            token_name,
            string::utf8(b""),
            0,
            token_uri,
            resource_account_addr,
            1,
            0,
            token_v1::create_token_mutability_config(
                &vector<bool>[ false, false, false, false, true ]
            ),
            vector<String>[string::utf8(b"given_to")],
            vector<vector<u8>>[b""],
            vector<String>[ string::utf8(b"address") ],
        );

        token_data_id
    }

    #[test_only]
    fun mint_move_bot(sender: &signer, owner: &signer, token_data_id: token_v1::TokenDataId): token_v1::TokenId {
        let token_id = token_v1::mint_token(owner, token_data_id, 1);
        token_v1::direct_transfer(owner, sender, token_id, 1);

        token_id
    }

    #[test_only]
    fun mint_coin<CoinType>(admin: &signer, amount: u64, to: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<CoinType>(
            admin,
            string::utf8(b"Usdc"),
            string::utf8(b"Usdc coin"),
            8,
            true,
        );

        coin::register<CoinType>(to);
        
        let coins = coin::mint<CoinType>(amount, &mint_cap);
        coin::deposit<CoinType>(signer::address_of(to), coins);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
        coin::destroy_freeze_cap(freeze_cap);
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
    fun create_subscription<CoinType>(sender: &signer, admin: &signer): (token_v1::TokenDataId, address, address) acquires SubscriptionPlan, MoveBot {
        let admin_addr = signer::address_of(admin);

        create_resource_account(sender, admin);

        fees::set_pending_admin(sender, admin_addr);

        fees::accept_admin(admin);

        let token_data_id = create_move_bot(admin);

        let token_id = mint_move_bot(admin, admin, token_data_id);

        mint_coin<CoinType>(sender, 400000000000000000, admin);

        let type_coin = type_info::type_of<UsdcCoin>();

        let coin_addr = type_info::account_address(&type_coin);

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

        let move_bot = MoveBot {
            nft_id: token_id
        };

        let construct_ref = object::create_object(signer::address_of(admin));
        let object_signer = object::generate_signer(&construct_ref);

        move_to(&object_signer, move_bot);
        
        let move_bot_obj = object::address_to_object(signer::address_of(&object_signer));
        
        init_module(sender);

        set_plan(admin,
            coin_addr,
            100000,
            collections_v2,
            discounts,
            move_bot_obj,
        );

        (token_data_id, collection_addr_1, collection_addr_2)
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
            admin = @0x200
        )
    ]
    fun should_create_subscription(aptos_framework: &signer, owner: &signer, admin: &signer) acquires SubscriptionPlan, MoveBot {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);

        let admin_addr = signer::address_of(admin);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        create_subscription<UsdcCoin>(owner, admin);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_buy_subscription(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, MoveBot {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        aptos_coin::mint(aptos_framework, user_addr, 20000000000);

        create_subscription<UsdcCoin>(owner, admin);

        aptos_account::transfer_coins<UsdcCoin>(admin, user_addr, 20000000000000);

        buy_plan<UsdcCoin>(user, 604800, vector::empty());

        let user_balance = coin::balance<UsdcCoin>(user_addr);

        assert!(user_balance == 19999999300000, EINCORRECT_BALANCE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_buy_subscription_with_discount_per_one_nft(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, MoveBot {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        aptos_coin::mint(aptos_framework, user_addr, 20000000000);

        let (_token_data_id, collection_addr_1, _collection_addr_2) = create_subscription<UsdcCoin>(owner, admin);

        aptos_account::transfer_coins<UsdcCoin>(admin, user_addr, 20000000000000);

        let token_addr = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n1 v1"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr);

        let token_holding = vector::empty();

        vector::push_back(&mut token_holding, token_addr);

        buy_plan<UsdcCoin>(user, 604800, token_holding);

        let user_balance = coin::balance<UsdcCoin>(user_addr);

        assert!(user_balance == 19999999321000, EINCORRECT_BALANCE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_buy_subscription_with_discount_per_three_nft(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, MoveBot {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        aptos_coin::mint(aptos_framework, user_addr, 20000000000);

        let (_token_data_id, collection_addr_1, _collection_addr_2) = create_subscription<UsdcCoin>(owner, admin);

        aptos_account::transfer_coins<UsdcCoin>(admin, user_addr, 20000000000000);

        let token_addr_1 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n1 v1"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr);
        let token_addr_2 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n2 v1"), string::utf8(b"Sshift token n2"), string::utf8(b"Sshift"), user_addr);
        let token_addr_3 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n3 v1"), string::utf8(b"Sshift token n3"), string::utf8(b"Sshift"), user_addr);

        let token_holding = vector::empty();

        vector::push_back(&mut token_holding, token_addr_1);
        vector::push_back(&mut token_holding, token_addr_2);
        vector::push_back(&mut token_holding, token_addr_3);

        buy_plan<UsdcCoin>(user, 604800, token_holding);

        let user_balance = coin::balance<UsdcCoin>(user_addr);

        assert!(user_balance == 19999999363000, EINCORRECT_BALANCE);
        

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_buy_subscription_with_discount_with_highest_holding(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, MoveBot {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        aptos_coin::mint(aptos_framework, user_addr, 20000000000);

        let (_token_data_id, collection_addr_1, collection_addr_2) = create_subscription<UsdcCoin>(owner, admin);

        aptos_account::transfer_coins<UsdcCoin>(admin, user_addr, 20000000000000);

        let token_addr_1 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n1 v1"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr);
        let token_addr_2 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n2 v1"), string::utf8(b"Sshift token n2"), string::utf8(b"Sshift"), user_addr);
        let token_addr_3 = mint_nft(admin, collection_addr_2, string::utf8(b"Sshift token n1 v2"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr);

        let token_holding = vector::empty();

        vector::push_back(&mut token_holding, token_addr_1);
        vector::push_back(&mut token_holding, token_addr_2);
        vector::push_back(&mut token_holding, token_addr_3);

        buy_plan<UsdcCoin>(user, 604800, token_holding);

        let user_balance = coin::balance<UsdcCoin>(user_addr);

        assert!(user_balance == 19999999342000, EINCORRECT_BALANCE);
        

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_buy_subscription_with_discount_holding_move_bot(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, MoveBot {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        aptos_coin::mint(aptos_framework, user_addr, 20000000000);

        let (token_data_id, _collection_addr_1, _collection_addr_2) = create_subscription<UsdcCoin>(owner, admin);

        aptos_account::transfer_coins<UsdcCoin>(admin, user_addr, 20000000000000);

        mint_move_bot(user, admin, token_data_id);

        buy_plan<UsdcCoin>(user, 604800, vector::empty());

        let user_balance = coin::balance<UsdcCoin>(user_addr);

        assert!(user_balance == 19999999650000, EINCORRECT_BALANCE);
        

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_buy_subscription_with_max_discount(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, MoveBot {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        aptos_coin::mint(aptos_framework, user_addr, 20000000000);

        let (_token_data_id, collection_addr_1, _collection_addr_2) = create_subscription<UsdcCoin>(owner, admin);

        aptos_account::transfer_coins<UsdcCoin>(admin, user_addr, 20000000000000);

        let token_holding = vector::empty();

        for(i in 0..20) {
            let token_addr = mint_nft(admin, collection_addr_1, string_utils::format1(&b"Sshift token n{} v1", i), string_utils::format1(&b"Sshift token n{}", i), string::utf8(b"Sshift"), user_addr);
            vector::push_back(&mut token_holding, token_addr);
        };

        buy_plan<UsdcCoin>(user, 604800, token_holding);

        let user_balance = coin::balance<UsdcCoin>(user_addr);

        assert!(user_balance == 19999999650000, EINCORRECT_BALANCE);
        
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_claim_free_subscription(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionsGifted, SubscriptionPlan, MoveBot, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        create_subscription<UsdcCoin>(owner, admin);

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
            owner = @sshift_dao_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_have_active_subscription_after_buying(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, MoveBot, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        aptos_coin::mint(aptos_framework, user_addr, 20000000000);

        create_subscription<UsdcCoin>(owner, admin);

        aptos_account::transfer_coins<UsdcCoin>(admin, user_addr, 20000000000000);

        buy_plan<UsdcCoin>(user, 604800, vector::empty());

        let is_active = has_subscription_active(user_addr);

        assert!(is_active == true, ESHOULD_HAVE_SUBSCRIPTION_ACTIVE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_not_have_active_duration_after_expire(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, MoveBot, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        aptos_coin::mint(aptos_framework, user_addr, 20000000000);

        create_subscription<UsdcCoin>(owner, admin);

        aptos_account::transfer_coins<UsdcCoin>(admin, user_addr, 20000000000000);

        buy_plan<UsdcCoin>(user, 604800, vector::empty());

        timestamp::update_global_time_for_test_secs(804800);

        let is_active = has_subscription_active(user_addr);

        assert!(is_active == false, ESHOULD_NOT_HAVE_SUBSCRIPTION_ACTIVE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_have_active_subscription_after_claim(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionsGifted, SubscriptionPlan, MoveBot, UserSubscription {
          let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        create_subscription<UsdcCoin>(owner, admin);

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
            owner = @sshift_dao_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_not_have_active_free_subscription_after_expire(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionsGifted, SubscriptionPlan, MoveBot, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        create_subscription<UsdcCoin>(owner, admin);

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
            owner = @sshift_dao_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    fun should_not_have_active_subscription_without_claiming_or_buying(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, MoveBot, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        create_subscription<UsdcCoin>(owner, admin);

        let is_active = has_subscription_active(user_addr);

        assert!(is_active == false, ESHOULD_NOT_HAVE_SUBSCRIPTION_ACTIVE);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    #[expected_failure(abort_code = 1, location = Self)]
    fun set_plan_with_not_admin_account(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, MoveBot {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        let admin_addr = signer::address_of(admin);

        create_resource_account(owner, admin);

        fees::set_pending_admin(owner, admin_addr);

        fees::accept_admin(admin);

        let token_data_id = create_move_bot(admin);

        let token_id = mint_move_bot(admin, admin, token_data_id);

        mint_coin<UsdcCoin>(owner, 400000000000000000, admin);

        let type_coin = type_info::type_of<UsdcCoin>();

        let coin_addr = type_info::account_address(&type_coin);

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

        let move_bot = MoveBot {
            nft_id: token_id
        };

        let construct_ref = object::create_object(signer::address_of(admin));
        let object_signer = object::generate_signer(&construct_ref);

        move_to(&object_signer, move_bot);
        
        let move_bot_obj = object::address_to_object(signer::address_of(&object_signer));
        
        init_module(owner);

        set_plan(user,
            coin_addr,
            100000,
            collections_v2,
            discounts,
            move_bot_obj,
        );

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
            admin = @0x200,
            user = @0x300
        )
    ]
    #[expected_failure(abort_code = 1, location = Self)]
    fun gift_subscription_with_not_admin_account(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, MoveBot, SubscriptionsGifted {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        create_subscription<UsdcCoin>(owner, admin);

        timestamp::update_global_time_for_test_secs(10000);

        gift_subscription(user, user_addr, 604800);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
            admin = @0x200,
            user1 = @0x300,
            user2 = @0x400,
        )
    ]
    #[expected_failure(abort_code = 4, location = Self)]
    fun buying_subscription_pretending_having_discount_with_nft_that_account_not_hold(aptos_framework: &signer, owner: &signer, admin: &signer, user1: &signer, user2: &signer) acquires SubscriptionPlan, MoveBot {
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

        let (_token_data_id, collection_addr_1, _collection_addr_2) = create_subscription<UsdcCoin>(owner, admin);

        aptos_account::transfer_coins<UsdcCoin>(admin, user_addr2, 20000000000000);

        let token_addr_1 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n1 v1"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr1);

        let token_holding = vector::empty();

        vector::push_back(&mut token_holding, token_addr_1);

        buy_plan<UsdcCoin>(user2, 604800, token_holding);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }
}