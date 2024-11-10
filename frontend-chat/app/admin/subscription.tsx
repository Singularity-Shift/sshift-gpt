'use Client';

import { useAbiClient } from '../../src/context/AbiProvider';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { SubscriptionABI } from '../../abis/SubscriptionAbi';
import { useEffect, useState } from 'react';
import { IMoveBotFields, ISubscription } from '@helpers';
import { LabeledInput } from '../../src/components/ui/labeled-input';
import { CollectionDiscoount } from './collectionsDiscount';
import { toast } from '../../src/components/ui/use-toast';
import { aptosClient } from '../../src/lib/utils';
import { truncateAddress, useWallet } from '@aptos-labs/wallet-adapter-react';
import {
  AccountAddress,
  convertAmountFromHumanReadableToOnChain,
  convertAmountFromOnChainToHumanReadable,
} from '@aptos-labs/ts-sdk';
import { COIN_DECIMALS } from '../../config/env';
import { ConfirmButton } from '../../src/components/ui/confirm-button';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';

export const Subscription = () => {
  const { abi } = useAbiClient();
  const { client } = useWalletClient();
  const { account } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const aptos = aptosClient();

  const [subscription, setSubscription] = useState<ISubscription>({
    collections_discount: [],
    price_per_day: 0,
    token_creator: '' as `0x${string}`,
    token_collection: '' as `0x${string}`,
    token_name: '',
    token_property_version: 0,
  });

  const disableSubmitCoinfigButton =
    !subscription.token_creator ||
    !subscription.token_collection ||
    !subscription.token_name ||
    subscription.token_property_version === undefined ||
    subscription.token_property_version < 0 ||
    subscription.price_per_day <= 0 ||
    !subscription.collections_discount?.[0]?.collection_addr ||
    subscription.collections_discount?.some((c) => c.discount_per_day <= 0);

  const onAddCollectionDiscount = () => {
    setSubscription({
      ...subscription,
      collections_discount: [
        ...subscription.collections_discount,
        {
          collection_addr: '' as `0x${string}`,
          discount_per_day: 1,
        },
      ],
    });
  };

  const onRemoveCollectionDiscount = (index: number) => {
    setSubscription({
      ...subscription,
      collections_discount: [
        ...subscription.collections_discount.filter((_c, i) => index !== i),
      ],
    });
  };

  const onChangeAddressCollection = (index: number, address: string) => {
    setSubscription({
      ...subscription,
      collections_discount: [
        ...subscription.collections_discount.map((c, i) => {
          const value = { ...c };
          if (i == index) {
            value.collection_addr = address as `0x${string}`;
          }

          return value;
        }),
      ],
    });
  };

  const onChangePricePerDayCollection = (
    index: number,
    discount_per_day: number
  ) => {
    setSubscription({
      ...subscription,
      collections_discount: [
        ...subscription.collections_discount.map((c, i) => {
          const value = { ...c };
          if (i == index) {
            value.discount_per_day = discount_per_day;
          }

          return value;
        }),
      ],
    });
  };

  const onChangeSubscriptionConfig = async () => {
    try {
      setIsLoading(true);

      const response = await client?.useABI(SubscriptionABI).set_plan({
        type_arguments: [],
        arguments: [
          convertAmountFromHumanReadableToOnChain(
            subscription.price_per_day,
            COIN_DECIMALS
          ),
          subscription.collections_discount.map((c) => c.collection_addr),
          subscription.collections_discount.map((c) =>
            convertAmountFromHumanReadableToOnChain(
              c.discount_per_day,
              COIN_DECIMALS
            )
          ),
          subscription.token_creator as `0x${string}`,
          subscription.token_collection,
          subscription.token_name,
          subscription.token_property_version,
        ],
      });

      const committedTransactionResponse =
        await aptosClient().waitForTransaction({
          transactionHash: response?.hash as string,
        });

      if (committedTransactionResponse.success) {
        toast({
          variant: 'default',
          title: 'Subscription config saved',
          description: 'Subscription config was save successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error saving subscription config settings',
        description: `Error: ${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNfts = async () => {
    const nfts = await aptos.account.getAccountOwnedTokens({
      accountAddress: AccountAddress.fromString(account?.address as string),
    });

    console.log(nfts);
  };

  const getCoins = async () => {
    const coins = await aptos.account.getAccountCoinsData({
      accountAddress: AccountAddress.fromString(account?.address as string),
    });

    console.log(coins);
  };

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        let moveBotFields;
        await getNfts();
        await getCoins();
        const subscriptionResult = await abi
          ?.useABI(SubscriptionABI)
          .view.get_subscription_config({
            functionArguments: [],
            typeArguments: [],
          });

        const subscriptionCopy = subscriptionResult?.[0] as ISubscription;

        try {
          const moveBotFieldsResult = await abi
            ?.useABI(SubscriptionABI)
            .view.get_move_bot_fields({
              functionArguments: [],
              typeArguments: [],
            });

          moveBotFields = moveBotFieldsResult?.[0] as IMoveBotFields;
        } catch (error) {
          console.error('Move bot fields are not set yet', error);
        }

        if (!subscriptionCopy.collections_discount?.length) {
          subscriptionCopy.collections_discount = [
            {
              collection_addr: '' as `0x${string}`,
              discount_per_day: 0,
            },
          ];
        }

        subscriptionCopy.collections_discount = [
          ...subscriptionCopy.collections_discount.map((c) => ({
            collection_addr: c.collection_addr,
            discount_per_day: convertAmountFromOnChainToHumanReadable(
              c.discount_per_day,
              COIN_DECIMALS
            ),
          })),
        ];

        subscriptionCopy.price_per_day =
          convertAmountFromOnChainToHumanReadable(
            subscriptionCopy.price_per_day,
            COIN_DECIMALS
          );

        if (moveBotFields) {
          subscriptionCopy.token_creator = moveBotFields.token_creator;
          subscriptionCopy.token_collection = moveBotFields.token_collection;
          subscriptionCopy.token_name = moveBotFields.token_name;
          subscriptionCopy.token_property_version =
            moveBotFields.token_property_version;
        }

        setSubscription(subscriptionCopy);
      } catch (error) {
        toast({
          title: 'Error fetching subscription configuration',
          description: `${error}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [abi]);

  return (
    <div>
      <LoadingSpinner on={isLoading} />
      <div className="mb-10">
        <LabeledInput
          label="Price per Day"
          onChange={(e) =>
            setSubscription({
              ...subscription,
              price_per_day: parseFloat(e.target.value),
            })
          }
          value={subscription.price_per_day}
          type="number"
          id="subscription-price-per-day"
          required
          tooltip="Set the subscription price per day"
        />
      </div>

      <div className="mb-10">
        {subscription.collections_discount.map((discount, index) => (
          <CollectionDiscoount
            key={`collection-discount-${index}`}
            onChangeAddress={onChangeAddressCollection}
            onChangeDiscountPerDay={onChangePricePerDayCollection}
            onAdd={onAddCollectionDiscount}
            onRemove={() => onRemoveCollectionDiscount(index)}
            address={discount.collection_addr}
            amount={discount.discount_per_day as number}
            isUpdating={isLoading}
            index={index}
          />
        ))}
      </div>

      <div className="mb-10">
        <LabeledInput
          label="Token creator"
          onChange={(e) =>
            setSubscription({
              ...subscription,
              token_creator: e.target.value as `0x${string}`,
            })
          }
          value={subscription.token_creator}
          type="text"
          id="subscription-token-creator"
          required
          tooltip="Set the Move Bot ID creator"
        />
      </div>

      <div className="mb-10">
        <LabeledInput
          label="Token collection name"
          onChange={(e) =>
            setSubscription({
              ...subscription,
              token_collection: e.target.value,
            })
          }
          value={subscription.token_collection}
          type="text"
          id="subscription-token-collection"
          required
          tooltip="Set the Move Bot ID collection name"
        />
      </div>

      <div className="mb-10">
        <LabeledInput
          label="Token name"
          onChange={(e) =>
            setSubscription({
              ...subscription,
              token_name: e.target.value,
            })
          }
          value={subscription.token_name}
          type="text"
          id="subscription-token-name"
          required
          tooltip="Set the Move Bot ID token name"
        />
      </div>

      <div className="mb-10">
        <LabeledInput
          label="Token property version"
          onChange={(e) =>
            setSubscription({
              ...subscription,
              token_property_version: parseInt(e.target.value),
            })
          }
          value={subscription.token_property_version}
          type="number"
          id="subscription-token-property-version"
          required
          tooltip="Set the Move Bot ID property version"
        />
      </div>

      <div className="mb-20">
        <ConfirmButton
          variant="green"
          title="Save Config"
          onSubmit={onChangeSubscriptionConfig}
          disabled={disableSubmitCoinfigButton}
          confirmMessage={
            <p>
              This are the new settings:
              <br />
              Collections for Discount:
              <br />
              {subscription.collections_discount.map((c) => (
                <p key={`collections-discount-to-submit`}>
                  Address: {truncateAddress(c.collection_addr)}
                  <br />
                  Amount: {c.discount_per_day}
                </p>
              ))}
              <br />
              Token creator: {truncateAddress(subscription.token_creator)}
              <br />
              Token collection: {subscription.token_collection}
              <br />
              Token name: {subscription.token_name}
              <br />
              Token property version: {subscription.token_property_version}
              <br />
              Are you agree?
            </p>
          }
        />
      </div>
    </div>
  );
};
