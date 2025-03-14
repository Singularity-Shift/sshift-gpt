module sshift_gpt_addr::fees {
    use std::vector;
    use std::signer;
    use std::option::{Self, Option};
    use std::error;

    use aptos_framework::event;
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::fungible_asset::Metadata;
    use aptos_framework::primary_fungible_store;
    use aptos_framework::object::{Self, Object};

    const EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION: u64 = 1;
    const ECOLLECTOR_NOT_FOUND: u64 = 2;
    const ENOTHING_TO_CLAIM: u64 = 4;
    const EFEES_SET_AMOUNT_HIGHER_THAN_BALANCE: u64 = 5;
    const ENOT_RESOURCE_ACCOUNT_ADDED: u64 = 6;
    const EONLY_ADMIN_CAN_SET_PENDING_ADMIN: u64 = 7;
    const EONLY_REVIEWER_CAN_SET_PENDING_REVIEWER: u64 = 8;
    const ENOT_PENDING_ADMIN: u64 = 9;
    const ENOT_PENDING_REVIEWER: u64 = 10;
    const ENOT_CURRENCIES_SET: u64 = 11;
    const EWRONG_CURRENCY: u64 = 12;
    const ENOT_CURRENCY_FOUND: u64 = 13;

    struct Config has key {
        admin_addr: address,
        pending_admin_addr: Option<address>,
        reviewer_addr: address,
        pending_reviewer_addr: Option<address>,
        currencies: vector<address>,
    }

    struct FeesAdmin has key {
        signer_cap: Option<SignerCapability>,
        fees_not_claimed: vector<u64>,
        currencies: vector<address>,
        collectors: vector<address>,
    }

    struct FeesToClaim has key {
        currencies: vector<address>,
        amounts: vector<u64>
    }

    #[event]
    struct Claimed has store, drop {
        collector: address,
        amount: u64,
        currency: address,
    }

    fun init_module(sender: &signer) {
        move_to(
            sender,
            Config {
                admin_addr: signer::address_of(sender),
                pending_admin_addr: option::none(),
                reviewer_addr: signer::address_of(sender),
                pending_reviewer_addr: option::none(),
                currencies: vector::empty(),
            }
        );

        move_to(
            sender,
            FeesAdmin {
                collectors: vector::empty(),
                fees_not_claimed: vector::empty(),
                currencies: vector::empty(),
                signer_cap: option::none(),
            }
        );
    }

    public entry fun create_resource_account(
        account: &signer, seed: vector<u8>, collectors: vector<address>
    ) acquires FeesAdmin, Config {
        let account_addr = signer::address_of(account);
        let config = borrow_global<Config>(@sshift_gpt_addr);

        assert!(
            is_admin(config, account_addr),
            error::permission_denied(EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION)
        );

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_gpt_addr);

        let (_resource_signer, signer_cap) =
            account::create_resource_account(account, seed);

        fees_admin.signer_cap = option::some(signer_cap);

        vector::for_each<address>(
            collectors,
            |account| {
                vector::push_back(&mut fees_admin.collectors, account);
            }
        );
    }

    public entry fun remove_resource_account(
        account: &signer, reviewer: &signer
    ) acquires FeesAdmin, Config {
        let account_addr = signer::address_of(account);
        let reviewer_addr = signer::address_of(reviewer);
        let config = borrow_global<Config>(@sshift_gpt_addr);
        assert!(
            is_admin(config, account_addr) && is_reviewer(config, reviewer_addr),
            error::permission_denied(EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION)
        );

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_gpt_addr);

        fees_admin.signer_cap = option::none();
    }

    public entry fun create_collector_object(account: &signer) acquires FeesAdmin {
        let account_addr = signer::address_of(account);

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_gpt_addr);

        let (is_found, _index) = vector::find(
            &fees_admin.collectors, |collector| collector == &account_addr
        );

        assert!(is_found, error::not_found(ECOLLECTOR_NOT_FOUND));

        move_to(account, FeesToClaim { amounts: vector::empty(), currencies: vector::empty() });
    }

    public entry fun add_collector(
        account: &signer, reviewer: &signer, collector: address
    ) acquires FeesAdmin, Config {
        let account_addr = signer::address_of(account);
        let reviewer_addr = signer::address_of(reviewer);
        let config = borrow_global<Config>(@sshift_gpt_addr);
        assert!(
            is_admin(config, account_addr) && is_reviewer(config, reviewer_addr),
            error::permission_denied(EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION)
        );
        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_gpt_addr);

        vector::push_back(&mut fees_admin.collectors, collector);
    }

    public entry fun remove_collector(
        account: &signer, reviewer: &signer, collector: address
    ) acquires FeesAdmin, Config {
        let account_addr = signer::address_of(account);
        let reviewer_addr = signer::address_of(reviewer);
        let config = borrow_global<Config>(@sshift_gpt_addr);
        assert!(
            is_admin(config, account_addr) && is_reviewer(config, reviewer_addr),
            error::permission_denied(EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION)
        );

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_gpt_addr);

        let (is_found, index) = vector::find<address>(
            &fees_admin.collectors, |c| { c == &collector }
        );

        assert!(is_found, error::not_found(ECOLLECTOR_NOT_FOUND));

        vector::remove<address>(&mut fees_admin.collectors, index);
    }

    public entry fun claim_fees(account: &signer, currency: address) acquires FeesAdmin, FeesToClaim, Config {
        let account_addr = signer::address_of(account);

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_gpt_addr);

        let (is_found, _index) = vector::find<address>(
            &fees_admin.collectors, |c| { c == &account_addr }
        );

        assert!(is_found, error::not_found(ECOLLECTOR_NOT_FOUND));

        let config = borrow_global<Config>(@sshift_gpt_addr);

        let (has_currency, _) = vector::find(&config.currencies, |c| c == &currency);
        assert!(has_currency, EWRONG_CURRENCY);

        let fees_to_claim = borrow_global_mut<FeesToClaim>(account_addr);

        let (fees_to_claim_currency_exists, fees_to_claim_currency_index) = vector::find(&fees_to_claim.currencies, |c| c == &currency);

        let fees_to_claim_amount = vector::borrow(&fees_to_claim.amounts, fees_to_claim_currency_index);

        assert!(fees_to_claim_currency_exists && *fees_to_claim_amount > 0, error::invalid_state(ENOTHING_TO_CLAIM));

        let signer_cap = get_signer_cap(&fees_admin.signer_cap);

        let resource_signer = account::create_signer_with_capability(signer_cap);

        let metadata = object::address_to_object<Metadata>(currency);

        primary_fungible_store::transfer(
            &resource_signer, metadata, account_addr, *fees_to_claim_amount
        );

        let (fees_admin_currency_exists, fees_admin_currency_index) = vector::find(&fees_admin.currencies, |c| c == &currency);

        assert!(fees_admin_currency_exists, ENOT_CURRENCY_FOUND);


        let index = 0;

        fees_admin.fees_not_claimed = vector::map(fees_admin.fees_not_claimed, |f| {
            let amount_not_claimed = if (index == fees_admin_currency_index) { 
                f - *fees_to_claim_amount
            } else {
                f
            };

            index = index + 1;

            amount_not_claimed
        });

        let fees_admin_not_claimed = vector::borrow(&fees_admin.fees_not_claimed, fees_admin_currency_index);

        event::emit(
            Claimed { collector: account_addr, amount: *fees_admin_not_claimed, currency }
        );

        let index = 0;

        fees_to_claim.amounts = vector::map(fees_to_claim.amounts, |f| {
            let amount_to_claim = if (index == fees_to_claim_currency_index) { 
                0
            } else {
                f
            };

            index = index + 1;

            amount_to_claim
        });
    }

    public entry fun payment(
        account: &signer, collectors: vector<address>, currency: address, amounts: vector<u64>,
    ) acquires FeesAdmin, Config, FeesToClaim {
        let account_addr = signer::address_of(account);
        let config = borrow_global<Config>(@sshift_gpt_addr);
        assert!(
            is_admin(config, account_addr) || is_reviewer(config, account_addr),
            error::permission_denied(EONLY_AUTHORIZED_ACCOUNTS_CAN_EXECUTE_THIS_OPERATION)
        );

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_gpt_addr);

        let (is_found, _index) = vector::find<address>(
            &fees_admin.collectors,
            |c| {
                vector::any(&collectors, |e| e == c)
            }
        );

        assert!(is_found, error::not_found(ECOLLECTOR_NOT_FOUND));

        let signer_cap = get_signer_cap(&fees_admin.signer_cap);
        let resource_signer = account::create_signer_with_capability(signer_cap);

        let (has_currency, _) = vector::find(&config.currencies, |c| c == &currency);

        assert!(has_currency, EWRONG_CURRENCY);

        let metadata = object::address_to_object<Metadata>(currency);

        let (fees_admin_currency_exists, fees_admin_currency_index) = vector::find(&fees_admin.currencies, |c| c == &currency);


        let fees_admin_not_claimed = if (fees_admin_currency_exists) {
            *vector::borrow(&fees_admin.fees_not_claimed, fees_admin_currency_index)
        } else {
            0
        };
        
        assert!(
            primary_fungible_store::balance(signer::address_of(&resource_signer), metadata)
                > vector::fold(amounts, 0, |curr, acc| acc + curr)
                    + fees_admin_not_claimed,
            EFEES_SET_AMOUNT_HIGHER_THAN_BALANCE
        );
        
        vector::for_each(
            collectors,
            |e| {
                let (_has_amount, index) = vector::index_of(&collectors, &e);

                let amount = vector::borrow<u64>(&amounts, index);

                let fees_to_claim = borrow_global_mut<FeesToClaim>(e);

                let (fees_to_claim_currency_exits, fees_to_claim_currency_index) = vector::find(&fees_to_claim.currencies, |c| c == &currency);

                let index = 0;

                if(fees_to_claim_currency_exits) {
                    fees_to_claim.amounts = vector::map(fees_to_claim.amounts, |f| {
                        let amount_to_claim = if (index == fees_to_claim_currency_index) { 
                            f + *amount
                        } else {
                            f
                        };

                        index = index + 1;

                        amount_to_claim
                    });
                } else {
                    vector::push_back(&mut fees_to_claim.currencies, currency);
                    vector::push_back(&mut fees_to_claim.amounts, *amount);
                };

                index = 0;

                if (fees_admin_currency_exists) {
                    fees_admin.fees_not_claimed = vector::map(fees_admin.fees_not_claimed, |f| {
                        let amount_not_claimed = if (index == fees_admin_currency_index) { 
                            f + *amount
                        } else {
                            f
                        };

                        index = index + 1;

                        amount_not_claimed
                    });
                } else {
                    fees_admin_not_claimed = primary_fungible_store::balance(signer::address_of(&resource_signer), metadata);

                    vector::push_back(&mut fees_admin.currencies, currency);
                    vector::push_back(&mut fees_admin.fees_not_claimed, fees_admin_not_claimed);

                };
            }
        );
    }

    public entry fun set_pending_admin(sender: &signer, new_admin: address) acquires Config {
        let sender_addr = signer::address_of(sender);
        let config = borrow_global_mut<Config>(@sshift_gpt_addr);
        assert!(is_admin(config, sender_addr), EONLY_ADMIN_CAN_SET_PENDING_ADMIN);
        config.pending_admin_addr = option::some(new_admin);
    }

    public entry fun accept_admin(sender: &signer) acquires Config {
        let sender_addr = signer::address_of(sender);
        let config = borrow_global_mut<Config>(@sshift_gpt_addr);
        assert!(
            config.pending_admin_addr == option::some(sender_addr), ENOT_PENDING_ADMIN
        );
        config.admin_addr = sender_addr;
        config.pending_admin_addr = option::none();
    }

    public entry fun set_pending_reviewer(
        sender: &signer, new_admin: address
    ) acquires Config {
        let sender_addr = signer::address_of(sender);
        let config = borrow_global_mut<Config>(@sshift_gpt_addr);
        assert!(
            is_reviewer(config, sender_addr), EONLY_REVIEWER_CAN_SET_PENDING_REVIEWER
        );
        config.pending_reviewer_addr = option::some(new_admin);
    }

    public entry fun accept_reviewer(sender: &signer) acquires Config {
        let sender_addr = signer::address_of(sender);
        let config = borrow_global_mut<Config>(@sshift_gpt_addr);
        assert!(
            config.pending_reviewer_addr == option::some(sender_addr),
            ENOT_PENDING_REVIEWER
        );
        config.reviewer_addr = sender_addr;
        config.pending_reviewer_addr = option::none();
    }

    public entry fun add_currency(sender: &signer, currency: address) acquires Config {
        let sender_addr = signer::address_of(sender);
        let config = borrow_global_mut<Config>(@sshift_gpt_addr);
        assert!(is_admin(config, sender_addr), EONLY_ADMIN_CAN_SET_PENDING_ADMIN);
        
        vector::push_back(&mut config.currencies, currency);
    }

    #[view]
    /// Get contract admin
    public fun get_admin(): address acquires Config {
        let config = borrow_global<Config>(@sshift_gpt_addr);
        config.admin_addr
    }

    #[view]
    /// Get contract reviewer
    public fun get_reviewer(): address acquires Config {
        let config = borrow_global<Config>(@sshift_gpt_addr);
        config.reviewer_addr
    }

    #[view]
    /// Get contract pending admin
    public fun get_pending_admin(): address acquires Config {
        let config = borrow_global<Config>(@sshift_gpt_addr);
        *option::borrow(&config.pending_admin_addr)
    }

    #[view]
    /// Get contract reviewer
    public fun get_pending_reviewer(): address acquires Config {
        let config = borrow_global<Config>(@sshift_gpt_addr);
        *option::borrow(&config.pending_reviewer_addr)
    }

    #[view]
    public fun get_collectors(): vector<address> acquires FeesAdmin {
        let fees_admin = borrow_global<FeesAdmin>(@sshift_gpt_addr);

        fees_admin.collectors
    }

    #[view]
    public fun get_currencies_addr(): vector<address> acquires Config {
        let config = borrow_global<Config>(@sshift_gpt_addr);
        config.currencies
    }


    #[view]
    public fun get_resource_balances(): (vector<address>, vector<u64>) acquires FeesAdmin, Config {
        let config = borrow_global<Config>(@sshift_gpt_addr);

        assert!(vector::length(&config.currencies) > 0, ENOT_CURRENCIES_SET);

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_gpt_addr);

        let resource_sign_cap = get_signer_cap(&fees_admin.signer_cap);

        let resource_signer = account::create_signer_with_capability(resource_sign_cap);

        let resource_signer_addr = signer::address_of(&resource_signer);

        let metadatas = vector::map<address, Object<Metadata>>(config.currencies, |currency|{
            object::address_to_object<Metadata>(currency)
        });

        let balances = vector::map<Object<Metadata>, u64>(metadatas, |metadata| {
            primary_fungible_store::balance(resource_signer_addr, metadata)
        });

        (config.currencies, balances)
    }

    #[view]
    public fun check_collector_object(account_addr: address): bool {
        exists<FeesToClaim>(account_addr)
    }

    #[view]
    public fun get_balance_to_claim(account_addr: address, currency: address): u64 acquires FeesToClaim {
        let fees_to_claim = borrow_global<FeesToClaim>(account_addr);

        let (fees_to_claim_currency_exists, fees_to_claim_currency_index) = vector::find(&fees_to_claim.currencies, |c| c == &currency);

        let amount = if(!fees_to_claim_currency_exists) {
            0
        } else {
            *vector::borrow(&fees_to_claim.amounts, fees_to_claim_currency_index)

        };

        amount
    }

    #[view]
    public fun resource_account_exists(): bool acquires FeesAdmin {
        let fees_admin = borrow_global<FeesAdmin>(@sshift_gpt_addr);
        option::is_some(&fees_admin.signer_cap)
    }

    #[view]
    public fun get_resource_account_address(): address acquires FeesAdmin {
        let fees_admin = borrow_global<FeesAdmin>(@sshift_gpt_addr);
        let resource_sign_cap = get_signer_cap(&fees_admin.signer_cap);

        let resource_signer = account::create_signer_with_capability(resource_sign_cap);

        let resource_signer_addr = signer::address_of(&resource_signer);

        resource_signer_addr
    }

    fun is_admin(config: &Config, sender: address): bool {
        if (sender == config.admin_addr) { true }
        else { false }
    }

    fun is_reviewer(config: &Config, sender: address): bool {
        if (sender == config.reviewer_addr) { true }
        else { false }
    }

    fun get_signer_cap(signer_cap_opt: &Option<SignerCapability>): &SignerCapability {
        assert!(
            option::is_some<SignerCapability>(signer_cap_opt),
            error::not_implemented(ENOT_RESOURCE_ACCOUNT_ADDED)
        );
        option::borrow<SignerCapability>(signer_cap_opt)
    }

    #[test_only]
    use aptos_framework::aptos_coin::{Self, AptosCoin};

    #[test_only]
    use aptos_framework::timestamp;

    #[test_only]
    use aptos_framework::coin;

    #[test_only]
    use std::string;

    #[test_only]
    use aptos_std::math64;

    #[test_only]
    use aptos_framework::fungible_asset::{Self, MintRef, TransferRef};

    #[test_only]
    const EBALANCE_NOT_EQUAL: u64 = 18;

    #[test_only]
    const Ecollector_SHOULD_NOT_EXISTS: u64 = 19;

    #[test_only]
    const ESIGN_CAP_SHOULD_NOT_EXISTS: u64 = 20;

    #[test_only]
    struct FAController has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
    }

    #[test_only]
    public fun initialize_for_test(sender: &signer) {
        move_to(
            sender,
            Config {
                admin_addr: signer::address_of(sender),
                pending_admin_addr: option::none(),
                reviewer_addr: signer::address_of(sender),
                pending_reviewer_addr: option::none(),
                currencies: vector::empty(),
            }
        );

        move_to(
            sender,
            FeesAdmin {
                collectors: vector::empty(),
                fees_not_claimed: vector::empty(),
                signer_cap: option::none(),
                currencies: vector::empty(),
            }
        );
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
    fun bounded_percentage(amount: u64, numerator: u64, denominator: u64): u64 {
        if (denominator == 0) { 0 }
        else {
            math64::min(
                amount,
                math64::mul_div(amount, numerator, denominator)
            )
        }
    }

    #[
        test(
            aptos_framework = @0x1,
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    fun test_payment(
        aptos_framework: &signer,
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires Config, FeesAdmin, FeesToClaim, FAController {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        // current timestamp is 0 after initialization
        timestamp::set_time_has_started_for_testing(aptos_framework);
        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        coin::register<AptosCoin>(user1);
        coin::register<AptosCoin>(user2);

        aptos_coin::mint(aptos_framework, user1_addr, 20000000);

        init_module(sender);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        set_pending_reviewer(sender, user4_addr);
        accept_reviewer(user4);

        create_resource_account(user1, b"test", vector[user3_addr, user4_addr]);

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_gpt_addr);

        let resource_sign_cap = get_signer_cap(&fees_admin.signer_cap);

        let resource_signer = account::create_signer_with_capability(resource_sign_cap);

        let fa_obj = create_fa();
        
        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(&resource_signer, &fa_controller.mint_ref, 20000000);

        add_currency(user1, fa_addr);

        let (_,resource_balances) = get_resource_balances();

        let resource_balance = vector::borrow(&resource_balances, 0);

        assert!(*resource_balance == 20000000, EBALANCE_NOT_EQUAL);

        add_collector(user1, user4, user2_addr);
        create_collector_object(user2);
        add_collector(user1, user4, user3_addr);
        create_collector_object(user3);
        add_collector(user1, user4, user4_addr);
        create_collector_object(user4);

        payment(
            user1,
            vector[user2_addr, user3_addr, user4_addr],
            fa_addr,
            vector[2000000, 1000000, 1500000]
        );

        let user2_addr_balance = get_balance_to_claim(user2_addr, fa_addr);
        let user3_addr_balance = get_balance_to_claim(user3_addr, fa_addr);
        let user4_addr_balance = get_balance_to_claim(user4_addr, fa_addr);

        assert!(user2_addr_balance == 2000000, EBALANCE_NOT_EQUAL);
        assert!(user3_addr_balance == 1000000, EBALANCE_NOT_EQUAL);
        assert!(user4_addr_balance == 1500000, EBALANCE_NOT_EQUAL);

        claim_fees(user3, fa_addr);

        let (_,resource_balance_after_user3_claimed) = get_resource_balances();
        let user3_addr_balance_after_claimed = get_balance_to_claim(user3_addr, fa_addr);
        let user4_addr_balance_after_user3_claimed = get_balance_to_claim(user4_addr, fa_addr);
        let user2_addr_balance_after_user3_claimed = get_balance_to_claim(user2_addr, fa_addr);

        let resource_balance_user3 = vector::borrow(&resource_balance_after_user3_claimed, 0);

        assert!(user3_addr_balance_after_claimed == 0, EBALANCE_NOT_EQUAL);
        assert!(
            *resource_balance_user3
                == *resource_balance - user3_addr_balance,
            EBALANCE_NOT_EQUAL
        );
        assert!(user4_addr_balance_after_user3_claimed == 1500000, EBALANCE_NOT_EQUAL);
        assert!(user2_addr_balance_after_user3_claimed == 2000000, EBALANCE_NOT_EQUAL);

        claim_fees(user4, fa_addr);

        let user4_addr_balance_after_claimed = get_balance_to_claim(user4_addr, fa_addr);
        let (_,resource_balance_after_user4_claimed) = get_resource_balances();

        let resource_balance_user4 = vector::borrow(&resource_balance_after_user4_claimed, 0);

        assert!(user4_addr_balance_after_claimed == 0, EBALANCE_NOT_EQUAL);
        assert!(
            *resource_balance_user4
                == *resource_balance - (user3_addr_balance + user4_addr_balance),
            EBALANCE_NOT_EQUAL
        );

        assert!(primary_fungible_store::balance(user2_addr, fa_obj) == 0, EBALANCE_NOT_EQUAL);
        assert!(primary_fungible_store::balance(user3_addr, fa_obj) == 1000000, EBALANCE_NOT_EQUAL);
        assert!(primary_fungible_store::balance(user4_addr, fa_obj) == 1500000, EBALANCE_NOT_EQUAL);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    fun test_add_collector(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        set_pending_reviewer(sender, user4_addr);
        accept_reviewer(user4);

        add_collector(user1, user4, user4_addr);

        let collectors = get_collectors();

        let (is_found, _index) = vector::find<address>(
            &collectors, |c| { c == &user4_addr }
        );

        assert!(is_found, ECOLLECTOR_NOT_FOUND);
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    fun test_remove_collector(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr, user4_addr]
        );
        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        set_pending_reviewer(sender, user4_addr);
        accept_reviewer(user4);

        remove_collector(user1, user4, user4_addr);

        let collectors = get_collectors();

        let (is_found, _index) = vector::find<address>(
            &collectors, |c| { c == &user4_addr }
        );

        assert!(!is_found, Ecollector_SHOULD_NOT_EXISTS);
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    fun test_remove_resource_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr, user4_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        set_pending_reviewer(sender, user4_addr);
        accept_reviewer(user4);

        remove_resource_account(user1, user4);

        let fees_admin = borrow_global<FeesAdmin>(@sshift_gpt_addr);

        assert!(&fees_admin.signer_cap == &option::none(), ESIGN_CAP_SHOULD_NOT_EXISTS);
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 327681, location = Self)]
    fun test_add_collector_with_not_admin_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {

        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        set_pending_reviewer(sender, user4_addr);
        accept_reviewer(user4);

        add_collector(user2, user4, user4_addr);
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 327681, location = Self)]
    fun test_add_collector_with_not_reviewer_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {

        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        add_collector(user2, user4, user4_addr);
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 327681, location = Self)]
    fun test_remove_collector_with_not_admin_accout(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr, user4_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        set_pending_reviewer(sender, user4_addr);
        accept_reviewer(user4);

        remove_collector(user2, user4, user4_addr);
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 327681, location = Self)]
    fun test_remove_collector_with_not_reviewer_accout(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr, user4_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        remove_collector(user1, user4, user4_addr);
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 327681, location = Self)]
    fun test_payment_with_not_autorized_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config, FeesToClaim {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        let fees_admin = borrow_global_mut<FeesAdmin>(@sshift_gpt_addr);

        let resource_sign_cap = get_signer_cap(&fees_admin.signer_cap);

        let fa_obj = create_fa();
        
        let fa_addr = object::object_address(&fa_obj);

        payment(
            user4,
            vector[user2_addr, user3_addr],
            fa_addr,
            vector[2000000, 1000000]
        );
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 393218, location = Self)]
    fun test_claim_fees_with_not_autorized_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config, FeesToClaim, FAController {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr]
        );

        create_collector_object(user2);
        create_collector_object(user3);

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        let fa_obj = create_fa();

        let fa_addr = object::object_address(&fa_obj);

        let fa_controller = borrow_global<FAController>(fa_addr);

        mint_fa(user4, &fa_controller.mint_ref, 2000);

        add_currency(user1, fa_addr);

        claim_fees(user4, fa_addr);
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 7, location = Self)]
    fun test_set_pending_admin_with_not_autorized_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        set_pending_admin(user4, user1_addr);
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 9, location = Self)]
    fun test_accept_admin_with_not_autorized_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        set_pending_admin(sender, user1_addr);

        accept_admin(user4);
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 8, location = Self)]
    fun test_set_pending_reviewer_with_not_autorized_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        set_pending_reviewer(user4, user1_addr);
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 10, location = Self)]
    fun test_accept_reviewer_with_not_autorized_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        set_pending_reviewer(sender, user1_addr);

        accept_reviewer(user4);
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 327681, location = Self)]
    fun test_remove_resource_account_with_not_admin_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr, user4_addr]
        );

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        set_pending_reviewer(sender, user4_addr);
        accept_reviewer(user4);

        remove_resource_account(user2, user4);
    }

    #[
        test(
            sender = @sshift_gpt_addr,
            user1 = @0x200,
            user2 = @0x201,
            user3 = @0x202,
            user4 = @0x203
        )
    ]
    #[expected_failure(abort_code = 327681, location = Self)]
    fun test_remove_resource_account_with_not_reviewer_account(
        sender: &signer,
        user1: &signer,
        user2: &signer,
        user3: &signer,
        user4: &signer
    ) acquires FeesAdmin, Config {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        let user3_addr = signer::address_of(user3);
        let user4_addr = signer::address_of(user4);

        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        account::create_account_for_test(user3_addr);
        account::create_account_for_test(user4_addr);

        init_module(sender);

        create_resource_account(
            sender,
            b"test",
            vector[user2_addr, user3_addr, user4_addr]
        );

        set_pending_admin(sender, user1_addr);
        accept_admin(user1);

        remove_resource_account(user2, user4);
    }
}
