import { useAbiClient } from '../../src/context/AbiProvider';
import { FeesABI } from '../../abis/FeesAbi';
import { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import {
  convertAmountFromHumanReadableToOnChain,
  convertAmountFromOnChainToHumanReadable,
} from '@aptos-labs/ts-sdk';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { toast } from '../../src/components/ui/use-toast';
import { LabeledInput } from '../../src/components/ui/labeled-input';
import { Button } from '../../src/components/ui/button';
import { RESOURCE_ACCOUNT_SEED } from '../../config/env';

export const Fees = () => {
  const { abi } = useAbiClient();
  const [newAddress, setNewAddress] = useState<`0x${string}`>();
  const [isResourceAccountSet, setIsResourceAccountSet] =
    useState<boolean>(false);
  const [resourceAccount, setResourceAccount] = useState('');
  const [collectorsSubscribed, setCollectorsSubscribed] = useState<
    `0x${string}`[]
  >([]);
  const [collectorsNotSubscribed, setCollectorsNotSubscribed] = useState<
    `0x${string}`[]
  >([]);
  const [initialCollectors, setInitialCollectors] = useState<`0x${string}`[]>(
    []
  );
  const [fees, setFees] = useState<number[]>([]);
  const [resourceAccountBalance, setResourceAccountBalance] =
    useState<number>(0);
  const { connected } = useWallet();
  const { client } = useWalletClient();

  useEffect(() => {
    if (isResourceAccountSet) {
      void (async () => {
        const response = await abi
          ?.useABI(FeesABI)
          .view.get_resource_account_address({
            typeArguments: [],
            functionArguments: [],
          });

        setResourceAccount(response?.[0] as string);

        const balance = await abi?.useABI(FeesABI).view.get_resource_balance({
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [],
        });

        setResourceAccountBalance(
          convertAmountFromOnChainToHumanReadable(Number(balance?.[0]), 8)
        );
      })();
    }
    void (async () => {
      const resourceAccountExists = await abi
        ?.useABI(FeesABI)
        .view.resource_account_exists({
          typeArguments: [],
          functionArguments: [],
        });

      setIsResourceAccountSet(Boolean(resourceAccountExists?.[0]));
    })();
  }, [isResourceAccountSet, abi]);

  useEffect(() => {
    void (async () => {
      const addresses = await abi?.useABI(FeesABI).view.get_collectors({
        typeArguments: [],
        functionArguments: [],
      });

      const subscribers = await Promise.all(
        addresses?.[0].map(async (a) => {
          const isSubscriber = await abi
            ?.useABI(FeesABI)
            .view.check_collector_object({
              typeArguments: [],
              functionArguments: [a],
            });

          return Boolean(isSubscriber?.[0]);
        }) || []
      );

      setCollectorsSubscribed([
        ...(addresses?.[0]?.filter(
          (_a, i) => subscribers[i]
        ) as `0x${string}`[]),
      ]);

      setCollectorsNotSubscribed([
        ...(addresses?.[0]?.filter(
          (_a, i) => !subscribers[i]
        ) as `0x${string}`[]),
      ]);
    })();
  }, [abi]);

  const onAddInitialCollector = async () => {
    setCollectorsNotSubscribed([
      ...collectorsNotSubscribed,
      newAddress as `0x${string}`,
    ]);
    setInitialCollectors([...initialCollectors, newAddress as `0x${string}`]);
    setNewAddress(undefined);
  };

  const onAddFees = (salary: number, employee: number) => {
    const feesCopy = [...fees];

    feesCopy[employee] = salary;

    setFees([...feesCopy]);
  };

  const onCreateResourceAccount = async () => {
    if (!connected) {
      return;
    }

    try {
      const tx = await client?.useABI(FeesABI).create_resource_account({
        type_arguments: [],
        arguments: [RESOURCE_ACCOUNT_SEED as string, [...initialCollectors]],
      });

      toast({
        title: 'Created resource account',
        description: `${tx?.hash}`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error creating resource account',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  const onPayCollectors = async () => {
    try {
      const tx = await client?.useABI(FeesABI).payment({
        type_arguments: ['0x1::aptos_coin::AptosCoin'],
        arguments: [
          [...collectorsSubscribed],
          [...fees.map((s) => convertAmountFromHumanReadableToOnChain(s, 8))],
        ],
      });

      toast({
        title: 'Paid collectors',
        description: `${tx?.hash}`,
        variant: 'default',
      });

      setFees([...collectorsSubscribed.map(() => 0)]);
    } catch (error) {
      toast({
        title: 'Error paying collectors',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mt-10">
      {isResourceAccountSet ? (
        <>
          <div className="w-4/6 m-2">
            <div>Account Address: {resourceAccount}</div>
            <div>Balance: {resourceAccountBalance}</div>
          </div>

          <div className="w-4/6 m-2">
            {Boolean(collectorsNotSubscribed.length) && (
              <h3>collectors no subscribed yet:</h3>
            )}
            {collectorsNotSubscribed.map((e, i) => (
              <div className="mt-5" key={`${i}-${e}`}>
                <div>
                  Collectors {i + 1}: {e}
                </div>
              </div>
            ))}
            {Boolean(collectorsSubscribed.length) && (
              <h3 className="mt-10">
                collectors subscribed to the resource account:
              </h3>
            )}
            {collectorsSubscribed.map((e, i) => (
              <div className="mt-5" key={`${i}-${e}`}>
                <div>
                  Employee {i + 1}: {e}
                </div>
                <LabeledInput
                  id="collector-fees"
                  label="Fees"
                  tooltip="The fees to pay to the collector"
                  required={true}
                  value={fees[i]}
                  onChange={(e) => onAddFees(Number(e.target.value), i)}
                  type="number"
                />
              </div>
            ))}
            <Button
              className="mt-10"
              variant="default"
              onClick={onPayCollectors}
              disabled={!collectorsSubscribed.length}
            >
              Pay collectors
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="w-1/6 m-2 self-end">
            <div className="w-4/6 m-2">
              <LabeledInput
                id="fees-address"
                label="Address initial collector"
                tooltip="The wallet address of the initial collector"
                required={true}
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value as `0x${string}`)}
                type="text"
              />
            </div>
            <div className="w-1/6 m-2 self-end mb-10">
              <Button
                variant="default"
                onClick={onAddInitialCollector}
                disabled={!newAddress}
              >
                Add Initial collector
              </Button>
            </div>
            <div>
              <h3>Initial Collectors</h3>

              {initialCollectors.map((e, i) => (
                <div className="mt-5" key={`${i}-${e}`}>
                  <div>
                    {i + 1}: {e}
                  </div>
                </div>
              ))}
            </div>

            <Button variant="default" onClick={onCreateResourceAccount}>
              Create resource account
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
