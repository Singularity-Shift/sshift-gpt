module sshift_dao_addr::subscription_v3 {
    use std::signer;
    use std::vector;
    use std::option::{Self, Option};
    use std::string::String;

    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::primary_fungible_store;
    use aptos_framework::fungible_asset::{Metadata};
    use aptos_token::token as token_v1;
    use aptos_framework::object;
    use aptos_token_objects::token::{Self, Token};

    use sshift_dao_addr::fees_v3;

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
    const EWRONG_CURRENCY: u64 = 11;
    const EEXTENSION_NOT_EXISTS: u64 = 12;
    const EHAS_HAS_EXTENSION_ACTIVE: u64 = 13;
    const ENOT_SUBSCRIPTION_ACTIVE: u64 = 14;
    const ESHOULD_BE_MORE_THAN_30_DAYS_SUBSCRIPTION: u64 = 8;


    struct CollectionAddressDiscount has key, store, drop, copy {
        collection_addr: address,
        discount_per_day: u64
    }

    struct Extension has key, copy, store, drop {
        name: String,
        prices: vector<u64>,
        credits: u64,
    }

    struct Upgrade has key, drop, store, copy {
        name: String,
        credits: u64,
    }

    struct SubscriptionPlan has key, copy {
        prices: vector<u64>,
        collections_discount: vector<CollectionAddressDiscount>,
        move_bot_id: Option<token_v1::TokenId>,
        extensions: vector<Extension>,
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
        end_time: u64,
        upgrades: vector<Upgrade>, 
    }

    #[event]
    struct UserSubscribed has store, drop {
        account: address,
        start_time: u64,
        end_time: u64,
        price: u64,
        created_at: u64,
        upgrades: vector<Upgrade>, 
    }

    fun init_module(sender: &signer) {
        move_to(
            sender,
            SubscriptionPlan {
                prices: vector::empty(),
                collections_discount: vector::empty(),
                move_bot_id: option::none(),
                extensions: vector::empty()
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
        token_creator: address,
        token_collection: String,
        token_name: String,
        token_property_version: u64,
    ) acquires SubscriptionPlan {
        check_admin(sender);

        let subscription_plan = borrow_global_mut<SubscriptionPlan>(@sshift_dao_addr);

        subscription_plan.prices = prices;

        let move_token_id = token_v1::create_token_id_raw(
            token_creator,
            token_collection,
            token_name,
            token_property_version
        );

        subscription_plan.move_bot_id = option::some(move_token_id);

        let collections_discount = collection_addresses.map(|c| {
            let (_, i) = collection_addresses.index_of(&c);

            let dpd = discounts_per_day.borrow(i);

            let collection_discount = CollectionAddressDiscount {
                collection_addr: c,
                discount_per_day: *dpd
            };

            collection_discount
        });

        subscription_plan.collections_discount = collections_discount
    }

    public entry fun add_extension(sender: &signer, name: String, prices: vector<u64>, credits: u64) acquires SubscriptionPlan {
        check_admin(sender);

        let subscription_plan = borrow_global_mut<SubscriptionPlan>(@sshift_dao_addr);

        let extension = Extension {
            name,
            prices,
            credits,
        };

        subscription_plan.extensions.push_back(extension);
    }


    public entry fun remove_extension(sender: &signer, name: String) acquires SubscriptionPlan {
        check_admin(sender);

        let subscription_plan = borrow_global_mut<SubscriptionPlan>(@sshift_dao_addr);

        let (has_extension, index) = subscription_plan.extensions.find(|e| &e.name == &name);

        assert!(has_extension, EEXTENSION_NOT_EXISTS);

        subscription_plan.extensions.remove(index);
    }

    public entry fun gift_subscription(sender: &signer, account: address, duration: u64) acquires SubscriptionsGifted, UserSubscription {
        check_admin(sender);

        assert!(!has_subscription_active(account), EHAS_SUBSCRIPTION_ACTIVE);
        assert!(!has_subscription_to_claim(account), EHAS_SUBSCRIPTION_TO_CLAIM);
        

        let free_subscriptions = borrow_global_mut<SubscriptionsGifted>(@sshift_dao_addr);

        let (has_free_subscription, index) = free_subscriptions.subscriptions.find(|s| {
            let FreeSubscription {
                account: account_addr,
                duration: _duration,
            }= *s;

            account_addr == account
        });

        if(has_free_subscription) {
            let subscription_to_update = free_subscriptions.subscriptions.borrow_mut(index);

            subscription_to_update.account = account;
            subscription_to_update.duration = duration;
        } else {
            let subscription = FreeSubscription {
                account,
                duration,
            };

            free_subscriptions.subscriptions.push_back(subscription);
        };
    }

    public entry fun claim_subscription(sender: &signer) acquires SubscriptionsGifted, UserSubscription {
        let account_addr = signer::address_of(sender);

        let free_subscriptions = borrow_global_mut<SubscriptionsGifted>(@sshift_dao_addr);

        let (has_free_subscription, index) = free_subscriptions.subscriptions.find(|s| {
            let FreeSubscription {
                account,
                duration,
            }= *s;

            account == account_addr && duration > 0
        });

        assert!(has_free_subscription, ENOT__FREE_SUBSCRIPTION_TO_CLAIM);

        let subscription = free_subscriptions.subscriptions.borrow_mut::<FreeSubscription>(index);

        let start_time = timestamp::now_seconds();

        let end_time = start_time + subscription.duration;

        if(exists<UserSubscription>(account_addr)) {
            let subscription_obj = borrow_global_mut<UserSubscription>(account_addr);

            subscription_obj.start_time = start_time;
            subscription_obj.end_time = start_time + subscription.duration;

        } else {
            move_to(
                sender,
                UserSubscription {
                    start_time,
                    end_time: start_time + subscription.duration,
                    upgrades: vector::empty()
                }
            );
        };

        subscription.duration = 0;

        event::emit(
            UserSubscribed {
                account: account_addr,
                start_time,
                end_time,
                price: 0,
                created_at: timestamp::now_seconds(),
                upgrades: vector::empty()
            }
        );
    }

    public entry fun buy_plan(
        sender: &signer,
        duration: u64,
        nfts_holding: vector<address>,
        extensions: vector<String>,
        credits: vector<u64>,
        currency: address,
    ) acquires SubscriptionPlan, UserSubscription {
        let buyer_addr = signer::address_of(sender);

        assert!(!has_subscription_active(buyer_addr), EHAS_SUBSCRIPTION_ACTIVE);

        let days = duration / (24 * 60 * 60);

        assert!(days >= 1, ESHOULD_BE_MORE_THAN_ONE_DAY_SUBSCRIPTION);

        assert!(days <= 30, ESHOULD_BE_MORE_THAN_30_DAYS_SUBSCRIPTION);

        let plan = borrow_global<SubscriptionPlan>(@sshift_dao_addr);

        assert!(plan.move_bot_id.is_some(), ENOT_SET_MOVE_BOT_ID);

        let currencies_addr = fees_v3::get_currencies_addr();

        let (has_currency, _) = currencies_addr.find(|c| c == &currency);
        assert!(has_currency, EWRONG_CURRENCY);

        let currency_metadata = object::address_to_object<Metadata>(currency);

        let move_bot_id = plan.move_bot_id.borrow();

        let hold_move_token = token_v1::balance_of(buyer_addr, *move_bot_id);

        let resource_account_addr = fees_v3::get_resource_account_address();

        let extensions_price = plan.extensions.fold::<u64, Extension>(0, |acc, curr| {
            let Extension {
                name,
                prices,
                credits: _
            } = curr;

            let (has_extension, _) = extensions.find(|e| e == &name);

            if(!has_extension) {
                acc
            } else {
                acc + prices[days]
            }
        });

        let price = plan.prices[days - 1];

        let discount_per_day = get_highest_hold(sender, nfts_holding, plan);

        let discount = get_discount(price + extensions_price, days, discount_per_day, hold_move_token);

        let sender_balance = primary_fungible_store::balance(buyer_addr, currency_metadata);

        assert!(price + extensions_price - discount < sender_balance, ENOT_ENOUGH_BALANCE);

        let final_price = price + extensions_price - discount;

        primary_fungible_store::transfer(sender, currency_metadata, resource_account_addr, final_price);

        let start_time = timestamp::now_seconds();

        let filtered_extensions = extensions.filter(|e| plan.extensions.any(|ext| &ext.name == e));

        let upgrades = filtered_extensions.map::<String, Upgrade>(|f| {
            let (_, i) = filtered_extensions.index_of(&f);

            Upgrade {
                name: f,
                credits: credits[i],
            }
        });


        if(exists<UserSubscription>(buyer_addr)) {
            let subscription = borrow_global_mut<UserSubscription>(buyer_addr);

            subscription.start_time = start_time;
            subscription.end_time = start_time + duration;

        } else {
            move_to(
                sender,
                UserSubscription {
                    start_time,
                    end_time: start_time + duration,
                    upgrades,
                }
            );
        };

        event::emit(
            UserSubscribed {
                account: buyer_addr,
                start_time,
                end_time: start_time + duration,
                price: final_price - discount,
                created_at: timestamp::now_seconds(),
                upgrades,
            }
        );
    }

    public entry fun buy_extension(
        sender: &signer,
        nfts_holding: vector<address>,
        extensions: vector<String>,
        currency: address,
    ) acquires SubscriptionPlan, UserSubscription {
        let buyer_addr = signer::address_of(sender);

        let plan = borrow_global<SubscriptionPlan>(@sshift_dao_addr);

        let extensions_to_buy = extensions.filter(|e| {
            plan.extensions.any(|ext| &ext.name == e) && !has_extension_active(buyer_addr, *e)
        });

        assert!(plan.move_bot_id.is_some(), ENOT_SET_MOVE_BOT_ID);

        let currencies_addr = fees_v3::get_currencies_addr();

        let (has_currency, _) = currencies_addr.find(|c| c == &currency);
        assert!(has_currency, EWRONG_CURRENCY);

        let currency_metadata = object::address_to_object<Metadata>(currency);

        let move_bot_id = plan.move_bot_id.borrow();

        let hold_move_token = token_v1::balance_of(buyer_addr, *move_bot_id);

        let resource_account_addr = fees_v3::get_resource_account_address();

        let user_subscription = borrow_global_mut<UserSubscription>(buyer_addr);

        let duration = user_subscription.end_time - timestamp::now_seconds();

        let days = duration / (24 * 60 * 60);

        if (days <= 1) {
            days = 1;
        };

        let extensions_price = extensions_to_buy.fold::<u64, String>(0, |acc, curr|{
            let (_,i) = plan.extensions.find(|ext| &ext.name == &curr);

            let extension = plan.extensions.borrow(i);

            acc + extension.prices[days]
        });


        let discount_per_day = get_highest_hold(sender, nfts_holding, plan);

        let discount = get_discount(extensions_price, days, discount_per_day, hold_move_token);

        let sender_balance = primary_fungible_store::balance(buyer_addr, currency_metadata);

        assert!(extensions_price - discount < sender_balance, ENOT_ENOUGH_BALANCE);

        let final_price = extensions_price - discount;

        primary_fungible_store::transfer(sender, currency_metadata, resource_account_addr, final_price);

        let upgrades_bought = extensions_to_buy.map::<String, Upgrade>(|e| {
            let (_,i) = plan.extensions.find(|ext| &ext.name == &e);

            let extension = plan.extensions.borrow(i);

            Upgrade {
                name: e,
                credits: extension.credits
            }
        });

        user_subscription.upgrades.append::<Upgrade>(upgrades_bought);

        event::emit(
            UserSubscribed {
                account: buyer_addr,
                start_time: user_subscription.start_time,
                end_time: user_subscription.end_time,
                price: final_price - discount,
                created_at: timestamp::now_seconds(),
                upgrades: user_subscription.upgrades,
            }
        );
    }

    public entry fun buy_duration(
        sender: &signer,
        nfts_holding: vector<address>,
        duration: u64,
        currency: address
    ) acquires SubscriptionPlan, UserSubscription {
        let buyer_addr = signer::address_of(sender);

        assert!(has_subscription_active(buyer_addr), ENOT_SUBSCRIPTION_ACTIVE);

        let days = duration / (24 * 60 * 60);

        assert!(days >= 1, ESHOULD_BE_MORE_THAN_ONE_DAY_SUBSCRIPTION);

        assert!(days <= 30, ESHOULD_BE_MORE_THAN_30_DAYS_SUBSCRIPTION);

        let plan = borrow_global<SubscriptionPlan>(@sshift_dao_addr);

        assert!(plan.move_bot_id.is_some(), ENOT_SET_MOVE_BOT_ID);

        let currencies_addr = fees_v3::get_currencies_addr();

        let (has_currency, _) = currencies_addr.find(|c| c == &currency);
        assert!(has_currency, EWRONG_CURRENCY);

        let currency_metadata = object::address_to_object<Metadata>(currency);

        let move_bot_id = plan.move_bot_id.borrow();

        let hold_move_token = token_v1::balance_of(buyer_addr, *move_bot_id);

        let resource_account_addr = fees_v3::get_resource_account_address();

        let user_subscription = borrow_global_mut<UserSubscription>(buyer_addr);

        let duration = user_subscription.end_time - timestamp::now_seconds();

        let price = plan.prices[days - 1];

        let extensions_price = user_subscription.upgrades.fold::<u64, Upgrade>(0, |acc, curr|{
            let Upgrade {
                name,
                credits: _,
            }  = curr;

            let (_,i) = plan.extensions.find(|ext| &ext.name == &name);

            let extension = plan.extensions.borrow(i);

            acc + extension.prices[days]
        });

        let discount_per_day = get_highest_hold(sender, nfts_holding, plan);

        let discount = get_discount(price + extensions_price, days, discount_per_day, hold_move_token);

        let sender_balance = primary_fungible_store::balance(buyer_addr, currency_metadata);

        assert!(price + extensions_price - discount < sender_balance, ENOT_ENOUGH_BALANCE);

        let final_price = price + extensions_price  - discount;

        primary_fungible_store::transfer(sender, currency_metadata, resource_account_addr, final_price);

        user_subscription.end_time += duration;

        event::emit(
            UserSubscribed {
                account: buyer_addr,
                start_time: user_subscription.start_time,
                end_time: user_subscription.end_time,
                price: final_price - discount,
                created_at: timestamp::now_seconds(),
                upgrades: user_subscription.upgrades,
            }
        );
    }

    #[view]
    public fun get_subscription_config(): SubscriptionPlan acquires SubscriptionPlan {
        *borrow_global<SubscriptionPlan>(@sshift_dao_addr)
    }

    #[view]
    public fun get_move_bot_fields(): MoveBotFields acquires SubscriptionPlan {
        let config = borrow_global<SubscriptionPlan>(@sshift_dao_addr);

        assert!(config.move_bot_id.is_some(), ESUBSCRIPTION_PLAN_NOT_EXISTS);

        let move_bot_id = config.move_bot_id.borrow();

        let token_data_id = token_v1::get_tokendata_id(*move_bot_id);

        let (token_creator, token_collection, token_name) = token_v1::get_token_data_id_fields(&token_data_id);

        let token_property_version = token_v1::get_tokendata_largest_property_version(token_creator, token_data_id);

        MoveBotFields {
            token_creator,
            token_collection,
            token_name,
            token_property_version,
        }
    }


    #[view]
    public fun get_plan(account: address): (u64, u64, vector<Upgrade>) acquires UserSubscription {
        let user_subsciption = borrow_global<UserSubscription>(account);

        (user_subsciption.start_time, user_subsciption.end_time, user_subsciption.upgrades)
    }

    #[view]
    public fun get_prices(): vector<u64> acquires SubscriptionPlan {
        let plan = borrow_global<SubscriptionPlan>(@sshift_dao_addr);

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
    public fun has_extension_active(account: address, extension: String): bool acquires UserSubscription {
        let has_subscription = has_subscription_active(account);

        assert!(has_subscription, ENOT_SUBSCRIPTION_ACTIVE);

        let user_subsciption = borrow_global<UserSubscription>(account);

        let (has_extension, _) = user_subsciption.upgrades.find(|u| &u.name == &extension);

        has_extension
    }

    #[view]
    public fun has_subscription_to_claim(account: address): bool acquires SubscriptionsGifted {
        let free_subscriptions = borrow_global<SubscriptionsGifted>(@sshift_dao_addr);

        let (has_free_subscription, _index) = free_subscriptions.subscriptions.find(|s| {
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
        let free_subscriptions = borrow_global<SubscriptionsGifted>(@sshift_dao_addr);

        let (has_free_subscription, index) = free_subscriptions.subscriptions.find(|s| {
            let FreeSubscription {
                account,
                duration: _duration,
            }= *s;

            account == account_addr
        });

        assert!(has_free_subscription, ENOT__FREE_SUBSCRIPTION_TO_CLAIM);

        free_subscriptions.subscriptions[index]
    }


    fun check_admin(sender: &signer) {
        let account_addr = signer::address_of(sender);
        let admin = fees_v3::get_admin();
        assert!(
            admin == account_addr, EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION
        );
    }

    fun get_highest_hold(
        account: &signer, tokens: vector<address>, plan: &SubscriptionPlan
    ): u64 {
        let account_address = signer::address_of(account);

        let is_owner = tokens.all::<address>(|token_addr| {
            let token = object::address_to_object<Token>(*token_addr);
            object::owns(token, account_address)
        });

        assert!(
            is_owner,
            ENOT_OWNER
        );

        let discounts = plan.collections_discount.map::<CollectionAddressDiscount, u64>(|cd| {
            let CollectionAddressDiscount { collection_addr, discount_per_day } = cd;

            let fit_tokens = tokens.filter::<address>(|token_addr| {
                let token = object::address_to_object<Token>(*token_addr);

                let belong_collection_object = token::collection_object(token);

                let belong_collection_addr =
                    object::object_address(&belong_collection_object);

                collection_addr == belong_collection_addr
            });

            fit_tokens.length() * discount_per_day
        });

        discounts.fold::<u64, u64>(0, |curr, prev| {
            if (curr > prev) { curr }
            else { prev }
        })
    }

    fun min_u64(a: u64, b: u64): u64 {
        if (a < b) { a } else { b }
    }

    fun get_discount(price: u64, days: u64, discount_per_day: u64, hold_move_token: u64): u64 {
        if (hold_move_token > 0) {
            price / 2
        } else {
            min_u64(price / 2, discount_per_day * days)
        }
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

        fees_v3::initialize_for_test(sender);

        fees_v3::create_resource_account(sender, b"test", vector[admin_addr]);

        fees_v3::create_collector_object(admin);
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

        let resource_account_addr = fees_v3::get_resource_account_address();

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
    fun create_fa(): Object<Metadata> {
        let fa_owner_obj_constructor_ref = &object::create_object(@sshift_dao_addr);
        let fa_owner_obj_signer = &object::generate_signer(fa_owner_obj_constructor_ref);

        let name = string::utf8(b"usdt test");

        let fa_obj_constructor_ref = &object::create_named_object(
            fa_owner_obj_signer,
            *name.bytes(),
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
    fun mint_move_bot(sender: &signer, owner: &signer, token_data_id: token_v1::TokenDataId): token_v1::TokenId {
        let token_id = token_v1::mint_token(owner, token_data_id, 1);
        token_v1::direct_transfer(owner, sender, token_id, 1);

        token_id
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
    fun create_subscription(sender: &signer, admin: &signer): (token_v1::TokenDataId, address, address) acquires SubscriptionPlan {
        let admin_addr = signer::address_of(admin);

        create_resource_account(sender, admin);

        fees_v3::set_pending_admin(sender, admin_addr);

        fees_v3::accept_admin(admin);

        let token_data_id = create_move_bot(admin);

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
        collections_v2.push_back(collection_addr_1);
        collections_v2.push_back(collection_addr_2);

        let discounts = vector::empty();
        discounts.push_back(1000000);
        discounts.push_back(2000000);

        init_module(sender);

        let prices: vector<u64> = vector[200000000,326000000,434000000,531000000,622000000,707000000,789000000,866000000,941000000,1014000000,1084000000,1153000000,1220000000,1285000000,1350000000,1412000000,1474000000,1535000000,1594000000,1653000000,1711000000,1768000000,1824000000,1880000000,1935000000,1989000000,2043000000,2096000000,2148000000,2200000000];

        set_plan(admin,
            prices,
            collections_v2,
            discounts,
            admin_addr,
            string::utf8(b"Move Bot"),
            string::utf8(b"My Move Bot"),
            token_v1::get_tokendata_largest_property_version(admin_addr, token_data_id),
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
            owner = @sshift_dao_addr,
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

        fees_v3::add_currency(admin, fa_addr);

        buy_plan(user, 604800, vector::empty(), vector::empty(), vector::empty(), fa_addr);

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

        assert!(user_balance == 19999211000000, EINCORRECT_BALANCE);

        let prices_list = get_prices();

        assert!(prices_list.length() == 30, EPRICES_LIST_SHOULD_HAVE_30_ELEMENTS);

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

        fees_v3::add_currency(admin, fa_addr);

        buy_plan(user, 604800, vector::empty(), vector::empty(), vector::empty(), fa_addr);

        timestamp::update_global_time_for_test_secs(804800);

        buy_plan(user, 604800, vector::empty(), vector::empty(), vector::empty(), fa_addr);

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

        assert!(user_balance == 19998422000000, EINCORRECT_BALANCE);

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

        let (_token_data_id, collection_addr_1, _collection_addr_2) = create_subscription(owner, admin);

        let token_addr = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n1 v1"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr);

        let token_holding = vector::empty();

        token_holding.push_back(token_addr);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees_v3::add_currency(admin, fa_addr);

        buy_plan(user, 604800, token_holding, vector::empty(), vector::empty(), fa_addr);

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

        assert!(user_balance == 19999218000000, EINCORRECT_BALANCE);

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

        let (_token_data_id, collection_addr_1, _collection_addr_2) = create_subscription(owner, admin);

        let token_addr_1 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n1 v1"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr);
        let token_addr_2 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n2 v1"), string::utf8(b"Sshift token n2"), string::utf8(b"Sshift"), user_addr);
        let token_addr_3 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n3 v1"), string::utf8(b"Sshift token n3"), string::utf8(b"Sshift"), user_addr);

        let token_holding = vector::empty();

        token_holding.push_back(token_addr_1);
        token_holding.push_back(token_addr_2);
        token_holding.push_back(token_addr_3);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees_v3::add_currency(admin, fa_addr);

        buy_plan(user, 604800, token_holding, vector::empty(), vector::empty(), fa_addr);

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

        assert!(user_balance == 19999232000000, EINCORRECT_BALANCE);

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

        let (_token_data_id, collection_addr_1, collection_addr_2) = create_subscription(owner, admin);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees_v3::add_currency(admin, fa_addr);


        let token_addr_1 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n1 v1"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr);
        let token_addr_2 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n2 v1"), string::utf8(b"Sshift token n2"), string::utf8(b"Sshift"), user_addr);
        let token_addr_3 = mint_nft(admin, collection_addr_2, string::utf8(b"Sshift token n1 v2"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr);

        let token_holding = vector::empty();

        token_holding.push_back(token_addr_1);
        token_holding.push_back(token_addr_2);
        token_holding.push_back(token_addr_3);

        buy_plan(user, 604800, token_holding, vector::empty(), vector::empty(), fa_addr);

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

        assert!(user_balance == 19999225000000, EINCORRECT_BALANCE);
        

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
    fun should_buy_subscription_with_discount_holding_move_bot(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan, FAController, UserSubscription {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        aptos_coin::mint(aptos_framework, admin_addr, 20000000);

        account::create_account_for_test(user_addr);
        coin::register<AptosCoin>(user);

        let (token_data_id, _collection_addr_1, _collection_addr_2) = create_subscription(owner, admin);

        mint_move_bot(user, admin, token_data_id);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees_v3::add_currency(admin, fa_addr);

        buy_plan(user, 604800, vector::empty(), vector::empty(), vector::empty(), fa_addr);

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

        assert!(user_balance == 19999605500000, EINCORRECT_BALANCE);

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

        let (_token_data_id, collection_addr_1, _collection_addr_2) = create_subscription(owner, admin);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user, &fa_controller.mint_ref, 20000000000000);

        fees_v3::add_currency(admin, fa_addr);

        let token_holding = vector::empty();

        for(i in 0..100) {
            let token_addr = mint_nft(admin, collection_addr_1, string_utils::format1(&b"Sshift token n{} v1", i), string_utils::format1(&b"Sshift token n{}", i), string::utf8(b"Sshift"), user_addr);
            token_holding.push_back(token_addr);
        };

        buy_plan(user, 604800, token_holding, vector::empty(), vector::empty(), fa_addr);

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

        assert!(user_balance == 19999605500000, EINCORRECT_BALANCE);
        
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

        let (start_time, end_time, _) = get_plan(user_addr);

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

        fees_v3::add_currency(admin, fa_addr);

        buy_plan(user, 604800, vector::empty(), vector::empty(), vector::empty(), fa_addr);

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

        fees_v3::add_currency(admin, fa_addr);

        buy_plan(user, 604800, vector::empty(), vector::empty(), vector::empty(), fa_addr);

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
            owner = @sshift_dao_addr,
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
            owner = @sshift_dao_addr,
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
            owner = @sshift_dao_addr,
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
            owner = @sshift_dao_addr,
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

        fees_v3::add_currency(admin, fa_addr);

        buy_plan(user, 100, vector::empty(), vector::empty(), vector::empty(), fa_addr);

        let user_balance = primary_fungible_store::balance(user_addr, fa_obj);

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
    #[expected_failure(abort_code = 1, location = Self)]
    fun set_plan_with_not_admin_account(aptos_framework: &signer, owner: &signer, admin: &signer, user: &signer) acquires SubscriptionPlan {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        timestamp::set_time_has_started_for_testing(aptos_framework);

        let admin_addr = signer::address_of(admin);
        
        account::create_account_for_test(admin_addr);
        coin::register<AptosCoin>(admin);

        let admin_addr = signer::address_of(admin);

        create_resource_account(owner, admin);

        fees_v3::set_pending_admin(owner, admin_addr);

        fees_v3::accept_admin(admin);

        let token_data_id = create_move_bot(admin);

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
        collections_v2.push_back(collection_addr_1);
        collections_v2.push_back(collection_addr_2);

        let discounts = vector::empty();
        discounts.push_back(3000);
        discounts.push_back(4000);
        

        init_module(owner);

        let prices: vector<u64> = vector[200000000,326000000,434000000,531000000,622000000,707000000,789000000,866000000,941000000,1014000000,1084000000,1153000000,1220000000,1285000000,1350000000,1412000000,1474000000,1535000000,1594000000,1653000000,1711000000,1768000000,1824000000,1880000000,1935000000,1989000000,2043000000,2096000000,2148000000,2200000000];

        set_plan(user,
            prices,
            collections_v2,
            discounts,
            admin_addr,
            string::utf8(b"Move Bot"),
            string::utf8(b"My Move Bot"),
            token_v1::get_tokendata_largest_property_version(admin_addr, token_data_id),
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
            owner = @sshift_dao_addr,
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

        let (_token_data_id, collection_addr_1, _collection_addr_2) = create_subscription(owner, admin);

        let fa_obj = create_fa();
        
        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        fees_v3::add_currency(admin, fa_addr);

        mint_fa(user2, &fa_controller.mint_ref, 20000000000000);

        let token_addr_1 = mint_nft(admin, collection_addr_1, string::utf8(b"Sshift token n1 v1"), string::utf8(b"Sshift token n1"), string::utf8(b"Sshift"), user_addr1);

        let token_holding = vector::empty();

        token_holding.push_back(token_addr_1);

        buy_plan(user2, 604800, token_holding, vector::empty(), vector::empty(), fa_addr);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
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
            owner = @sshift_dao_addr,
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

        fees_v3::add_currency(admin, fa_addr);

        buy_plan(user, 604800, vector::empty(), vector::empty(), vector::empty(), fa_addr);

        gift_subscription(admin, user_addr, 604800);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            aptos_framework = @0x1,
            owner = @sshift_dao_addr,
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

        fees_v3::add_currency(admin, fa_addr);

        buy_plan(user, 604800, vector::empty(), vector::empty(), vector::empty(), fa_addr);

        buy_plan(user, 604800, vector::empty(), vector::empty(), vector::empty(), fa_addr);

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
            owner = @sshift_dao_addr,
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
