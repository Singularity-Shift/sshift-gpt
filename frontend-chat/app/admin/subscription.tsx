'use Client';

import { useAbiClient } from '../../src/context/AbiProvider';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { SubscriptionABI } from '../../abis/SubscriptionAbi';
import { useEffect, useState } from 'react';
import { ISubscription } from '@helpers';
import { LabeledInput } from '../../src/components/ui/labeled-input';
import { CollectionDiscoount } from './collectionsDiscount';
import { toast } from '../../src/components/ui/use-toast';
import { aptosClient } from '../../src/lib/utils';
import { truncateAddress } from '@aptos-labs/wallet-adapter-react';
import {
  convertAmountFromHumanReadableToOnChain,
  convertAmountFromOnChainToHumanReadable,
} from '@aptos-labs/ts-sdk';
import { COIN_DECIMALS } from '../../config/env';
import { ConfirmButton } from '../../src/components/ui/confirm-button';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';

export const Subscription = () => {
  const { abi } = useAbiClient();
  const { client } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);
  const aptos = aptosClient();

  const [subscription, setSubscription] = useState<ISubscription>({
    coin: '' as `0x${string}`,
    collections_discount: [],
    move_bot_id: '' as `0x${string}`,
    price_per_day: 0,
  });

  const disableSubmitCoinfigButton =
    !subscription.coin ||
    !subscription.move_bot_id ||
    !subscription.price_per_day ||
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
          subscription.coin,
          convertAmountFromHumanReadableToOnChain(
            subscription.price_per_day,
            COIN_DECIMALS
          ),
          subscription.collections_discount.map((c) => c.collection_addr),
          subscription.collections_discount.map((c) =>
            convertAmountFromOnChainToHumanReadable(
              c.discount_per_day,
              COIN_DECIMALS
            )
          ),
          subscription.move_bot_id,
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
    const tokens = await aptos.account.getAccountOwnedTokens({
      accountAddress:
        '0x9ce14bd263abede19dab6b0781d99459f4a8979cf7490086c69d0aaba44a07ee',
    });

    console.log(tokens);
  };

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        getNfts();
        const subscriptionResult = await abi
          ?.useABI(SubscriptionABI)
          .view.get_subscription_config({
            functionArguments: [],
            typeArguments: [],
          });

        const subscriptionCopy = subscriptionResult?.[0] as ISubscription;

        if (!subscriptionCopy.collections_discount?.length) {
          subscriptionCopy.collections_discount = [
            {
              collection_addr: '' as `0x${string}`,
              discount_per_day: 0,
            },
          ];
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
      <div className="mb-10 mt-10">
        <LabeledInput
          label="Coin"
          onChange={(e) =>
            setSubscription({
              ...subscription,
              coin: e.target.value as `0x${string}`,
            })
          }
          value={subscription.coin}
          type="text"
          id="subscription-coin"
          required
          tooltip="Set the coin address of the subscription payment"
        />
      </div>

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
          label="Move Bot ID"
          onChange={(e) =>
            setSubscription({
              ...subscription,
              move_bot_id: e.target.value as `0x${string}`,
            })
          }
          value={subscription.move_bot_id}
          type="text"
          id="subscription-move-bot-id"
          required
          tooltip="Set the move bot ID for the subscription discount"
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
              Coin: {subscription.coin}
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
              Are you agree?
            </p>
          }
        />
      </div>
    </div>
  );
};
