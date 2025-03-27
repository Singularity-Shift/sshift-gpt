import { useAbiClient } from '../../src/context/AbiProvider';
import { useChain } from '../../src/context/ChainProvider';
import { useAppManagment } from '../../src/context/AppManagment';
import React, { useEffect, useState } from 'react';
import { ICoins } from '@helpers';
import { LabeledInput } from '../../src/components/ui/labeled-input';
import { toast } from '../../src/components/ui/use-toast';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { FeesABI } from '@aptos';
import {
  convertAmountFromHumanReadableToOnChain,
  convertAmountFromOnChainToHumanReadable,
} from '@aptos-labs/ts-sdk';

const CoinsV1PaymentBox = () => {
  const [coinType, setCoinType] = useState('');

  // Multi payment fields: an array of { address, amount }
  const [payments, setPayments] = useState([{ address: '', amount: '' }]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [coins, setCoins] = useState<ICoins[]>([]);
  const [balance, setBalance] = useState<number>(0);

  const { collectors, resourceAccount } = useAppManagment();
  const { abi } = useAbiClient();
  const { aptos } = useChain();
  const { client } = useWalletClient();

  useEffect(() => {
    if (!collectors.length || !resourceAccount) {
      return;
    }

    void (async () => {
      const coins = await aptos.getAccountCoinsData({
        accountAddress: resourceAccount,
      });

      setCoins(coins.filter((coin) => coin.token_standard === 'v1'));

      setCoinType(coins?.[0].metadata?.symbol || '');
      setBalance(
        convertAmountFromOnChainToHumanReadable(
          coins?.[0].amount,
          coins?.[0].metadata?.decimals || 8
        ) || 0
      );
    })();
  }, [abi, collectors, resourceAccount]);

  const onChangeCoinType = (value: string) => {
    const coin = coins.find((coin) => coin.metadata?.symbol === value);

    setCoinType(value);
    setBalance(
      convertAmountFromOnChainToHumanReadable(
        coin?.amount,
        coin?.metadata?.decimals || 8
      ) || 0
    );
  };

  const onPay = async () => {
    setLoading(true);
    const coinToPay = coins.find((coin) => coin.metadata?.symbol === coinType);

    if (!coinToPay) {
      toast({
        title: 'Coin not found',
        description: 'Please select a valid coin type.',
        variant: 'destructive',
      });
    }

    const toPay = payments.filter((p) => p.address && p.amount);

    try {
      const tx = await client?.useABI(FeesABI).payment_v1({
        type_arguments: [coinToPay?.asset_type as string],
        arguments: [
          toPay.map((p) => p.address) as `0x${string}`[],
          toPay.map((p) =>
            convertAmountFromHumanReadableToOnChain(
              parseFloat(p.amount),
              coinToPay?.metadata?.decimals || 8
            )
          ),
        ],
      });

      toast({
        title: 'Payment successful',
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
      setPayments(payments.map((p) => ({ ...p, address: '', amount: '' })));
    } catch (error) {
      toast({
        title: 'Payment failed',
        description: `Error: ${error}`,
        variant: 'destructive',
      });

      setError(error as string);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentChange = (
    index: number,
    address: string,
    value: string
  ) => {
    const newPayments = [...payments];

    if (newPayments[index]) {
      newPayments[index].address = address;
      newPayments[index].amount = value;
    } else {
      newPayments[index] = { address, amount: value };
    }

    setPayments([...newPayments]);
  };

  return (
    <div className="p-4 border rounded-xl shadow-lg bg-white">
      {!resourceAccount || coins.length === 0 ? (
        <p className="text-red-500 text-center">No v1 coins available</p>
      ) : (
        <form>
          <div className="mb-4">
            <span>Balance: {balance}</span>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Coin Type
            </label>
            <select
              value={coinType}
              onChange={(e) => onChangeCoinType(e.target.value)}
              className="border p-2 w-full rounded mb-2 bg-white"
            >
              {coins.map((coin) => (
                <option key={coin.asset_type} value={coin.metadata?.symbol}>
                  {coin.metadata?.symbol}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">
              Collector Payments
            </h4>
            {collectors.map((c, index) => (
              <div
                key={index}
                className="mb-4 p-4 border rounded-lg bg-gray-50"
              >
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                  <LabeledInput
                    id={`collector-address-${index}`}
                    type="text"
                    readOnly
                    value={c}
                    label="Collector Address"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <LabeledInput
                    id={`amount-${index}`}
                    type="text"
                    value={payments[index]?.amount}
                    onChange={(e) =>
                      handlePaymentChange(index, c, e.target.value)
                    }
                    label="Amount"
                  />
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-red-500 mb-2">{error}</p>}
          <button
            type="submit"
            className={`py-2 px-4 rounded w-full transition-colors duration-200 ${
              loading ||
              payments.every((p) => parseFloat(p.amount) === 0 || !p.amount)
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={
              loading ||
              payments.every((p) => parseFloat(p.amount) === 0 || !p.amount)
            }
            onClick={onPay}
          >
            {loading ? 'Processing...' : `Distribute ${coinType} to Collectors`}
          </button>
        </form>
      )}
    </div>
  );
};

export default CoinsV1PaymentBox;
