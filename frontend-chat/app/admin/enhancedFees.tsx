'use client';
import { useAbiClient } from '../../src/context/AbiProvider';
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
import { useAppManagment } from '../../src/context/AppManagment';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../src/components/ui/select';
import { Label } from '../../src/components/ui/label';
import { FeesABI } from '@aptos';
import { useChain } from '../../src/context/ChainProvider';

export const EnhancedFees = () => {
  const { abi, feesABI } = useAbiClient();
  const [newAddress, setNewAddress] = useState<`0x${string}`>();
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
  const { resourceAccount, setResourceAccount, currencies, setCurrencies } =
    useAppManagment();

  const { aptos } = useChain();

  // New state for enhanced currency management
  const [newCurrency, setNewCurrency] = useState<`0x${string}`>();
  const [selectedPaymentCurrency, setSelectedPaymentCurrency] =
    useState<`0x${string}`>('0x1::usdc::USDC' as `0x${string}`);

  // Reuse existing useEffects and functions from the original Fees component
  useEffect(() => {
    if (resourceAccount) {
      void (async () => {
        const balance = await abi?.useABI(feesABI).view.get_resource_balance({
          typeArguments: [],
          functionArguments: [],
        });

        setResourceAccountBalance(
          convertAmountFromOnChainToHumanReadable(Number(balance?.[0]), 8)
        );
      })();

      if (currencies.length) {
        setSelectedPaymentCurrency(currencies[0].address);
      }
    }
  }, [abi, resourceAccount, currencies]);

  useEffect(() => {
    void (async () => {
      const addresses = await abi?.useABI(feesABI).view.get_collectors({
        typeArguments: [],
        functionArguments: [],
      });

      const subscribers = await Promise.all(
        addresses?.[0].map(async (a) => {
          const isSubscriber = await abi
            ?.useABI(feesABI)
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
  }, [abi, resourceAccount]);

  const onAddInitialCollector = async () => {
    setCollectorsNotSubscribed([
      ...collectorsNotSubscribed,
      newAddress as `0x${string}`,
    ]);
    setInitialCollectors([...initialCollectors, newAddress as `0x${string}`]);
    setNewAddress('' as `0x${string}`);
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
      const tx = await client?.useABI(feesABI).create_resource_account({
        type_arguments: [],
        arguments: [RESOURCE_ACCOUNT_SEED as string, [...initialCollectors]],
      });

      toast({
        title: 'Created resource account',
        description: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${tx?.hash}`}
            target="_blank"
          >
            {tx?.hash}
          </a>
        ),
        variant: 'default',
      });

      const resourceAccountAddressResult = await abi
        ?.useABI(feesABI)
        .view.get_resource_account_address({
          typeArguments: [],
          functionArguments: [],
        });

      setResourceAccount(resourceAccountAddressResult?.[0] as `0x${string}`);
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
      const tx = await client?.useABI(feesABI).payment({
        type_arguments: [],
        arguments: [
          [...collectorsSubscribed],
          [...fees.map((s) => convertAmountFromHumanReadableToOnChain(s, 8))],
        ],
      });

      toast({
        title: 'Paid collectors',
        description: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${tx?.hash}`}
            target="_blank"
          >
            {tx?.hash}
          </a>
        ),
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

  const onAddCurrency = async (address: `0x${string}`) => {
    // Check if currency already exists
    if (currencies.some((c) => c.address === newCurrency)) {
      toast({
        title: 'Currency already exists',
        description: 'This currency is already in the list',
        variant: 'destructive',
      });
      return;
    }

    const currencyData = (
      await aptos.getFungibleAssetMetadata({
        options: {
          where: {
            asset_type: {
              _eq: address,
            },
          },
        },
      })
    )?.[0];

    if (!currencyData) {
      toast({
        title: 'Currency not found',
        description: 'No currency data found for this address',
        variant: 'destructive',
      });
      return;
    }

    await client?.useABI(FeesABI).add_currency({
      arguments: [address],
      type_arguments: [],
    });

    setCurrencies([
      ...currencies,
      {
        address: newCurrency as `0x${string}`,
        name: currencyData.name,
        symbol: currencyData.symbol,
        isStableCoin: true,
      },
    ]);

    setNewCurrency(undefined);

    toast({
      title: 'Currency added',
      description: `${currencyData.name} (${currencyData.symbol}) has been added to the list`,
      variant: 'default',
    });
  };

  const onRemoveCurrency = async (address: `0x${string}`) => {
    if (selectedPaymentCurrency !== address) {
      toast({
        title: 'Cannot remove currency',
        description:
          'You must select a payment currency before removing a currency',
        variant: 'destructive',
      });

      return;
    }

    if (currencies.length < 2) {
      toast({
        title: 'Cannot remove currency',
        description: 'You must have at least two currencies in the list',
        variant: 'destructive',
      });

      return;
    }

    // If the removed currency is the selected one, reset to the first available
    try {
      await client?.useABI(FeesABI).remove_currency({
        arguments: [address],
        type_arguments: [],
      });

      setCurrencies(currencies.filter((c) => c.address !== address));

      const remainingCurrencies = currencies.filter(
        (c) => c.address !== address
      );

      setSelectedPaymentCurrency(remainingCurrencies[0].address);
    } catch (error) {
      toast({
        title: 'Error removing currency',
        description: `Error: ${error}`,
        variant: 'destructive',
      });
    }
  };

  const onSavePaymentCurrency = async () => {
    try {
      // In a real implementation, this would call the backend API
      // await api.updatePaymentCurrency(selectedPaymentCurrency);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: 'Payment currency updated',
        description: `The payment currency has been updated successfully`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error updating payment currency',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  // Calculate if resource account creation should be disabled
  const disabledCreateResourceAccount = !initialCollectors.length;

  // Reuse the existing render logic but add the new currency management UI
  return (
    <div className="space-y-6">
      {/* Currency Management Section - REMOVED */}

      {/* Add label to add currency and after show a list of currency added which the possibility to delete it */}
      <div className="space-y-6 pt-4 pb-6">
        <h3 className="font-semibold text-lg">Currencies</h3>
        <div className="space-y-2">
          <h3 className="font-semibold">Add Currency</h3>
          <div className="space-x-4">
            <LabeledInput
              id="new-currency-address"
              value={newAddress}
              onChange={(e) => setNewCurrency(e.target.value as `0x${string}`)}
              label="Address"
              type="text"
              required={true}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => onAddCurrency(newCurrency as `0x${string}`)}
              disabled={!newCurrency}
            >
              Add Currency
            </Button>
          </div>
          {/* Currency List */}
          {currencies.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Current Currencies</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {currencies.map((currency, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <span className="font-medium">{currency.symbol}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({currency.name})
                      </span>
                      <div className="text-xs text-gray-400 truncate max-w-xs">
                        {currency.address}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onRemoveCurrency(currency.address)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Original Fees Component UI */}
      <div className="space-y-6 pt-4">
        <h3 className="font-semibold text-lg">Resource Account & Collectors</h3>

        {resourceAccount ? (
          <>
            {/* Collector Payment Currency Selection */}
            {currencies.length > 0 && (
              <div className="space-y-4 pt-4 border-b pb-6">
                <h3 className="font-semibold text-lg">
                  Collector Payment Currency
                </h3>
                <div className="space-y-2">
                  <Label>Select Currency for Paying Collectors</Label>
                  <Select
                    value={selectedPaymentCurrency}
                    onValueChange={(value) =>
                      setSelectedPaymentCurrency(value as `0x${string}`)
                    }
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {currencies.map((curr, index) => (
                        <SelectItem key={index} value={curr.address}>
                          {curr.symbol} - {curr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {/* Account Info */}
            <div className="space-y-4">
              <LabeledInput
                id="resource-account-address-input"
                label="Account Address"
                value={resourceAccount as `0x${string}`}
                type="text"
                readOnly
                required={true}
              />
              <LabeledInput
                id={'resource-account-balance-input'}
                label="Balance"
                value={resourceAccountBalance.toString()}
                type="text"
                readOnly
                required={true}
              />
            </div>

            {/* Collectors Section */}
            <div className="space-y-4">
              {Boolean(collectorsNotSubscribed.length) && (
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    Collectors not subscribed yet:
                  </h3>
                  {collectorsNotSubscribed.map((e, i) => (
                    <LabeledInput
                      id={`collector-${i}-address`}
                      key={`${i}-${e}`}
                      label={`Collector ${i + 1}`}
                      value={e}
                      type="text"
                      readOnly
                    />
                  ))}
                </div>
              )}

              {Boolean(collectorsSubscribed.length) && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Subscribed collectors:</h3>
                  {collectorsSubscribed.map((e, i) => (
                    <div key={`${i}-${e}`} className="space-y-2">
                      <LabeledInput
                        id={`collector-${i}-address`}
                        label={`Collector ${i + 1}`}
                        value={e}
                        type="text"
                        readOnly
                      />
                      <LabeledInput
                        id={`collector-fees-${i}`}
                        label="Fees"
                        tooltip="The fees to pay to the collector"
                        required={true}
                        value={fees[i]}
                        onChange={(e) => onAddFees(Number(e.target.value), i)}
                        type="number"
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button
                className="w-full"
                variant="green"
                onClick={onPayCollectors}
                disabled={!collectorsSubscribed.length}
              >
                Pay collectors
              </Button>
            </div>
          </>
        ) : (
          // Resource Account Creation Section
          <div className="space-y-6">
            <div className="space-y-4">
              <LabeledInput
                id="fees-address"
                label="Address initial collector"
                tooltip="The wallet address of the initial collector"
                required={true}
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value as `0x${string}`)}
                type="text"
              />
              <Button
                className="w-full"
                variant="outline"
                onClick={onAddInitialCollector}
                disabled={!newAddress}
              >
                Add Initial collector
              </Button>
            </div>

            {initialCollectors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Initial Collectors</h3>
                {initialCollectors.map((e, i) => (
                  <LabeledInput
                    id={`initial-collector-${i}-address`}
                    key={`${i}-${e}`}
                    label={`Collector ${i + 1}`}
                    value={e}
                    type="text"
                    readOnly
                  />
                ))}
              </div>
            )}

            <Button
              className="w-full"
              variant="green"
              disabled={disabledCreateResourceAccount}
              onClick={onCreateResourceAccount}
            >
              Create resource account and set currency
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
