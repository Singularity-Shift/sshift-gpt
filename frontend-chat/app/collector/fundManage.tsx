'use client';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useAbiClient } from '../../src/context/AbiProvider';
import { useEffect, useState } from 'react';
import { useToast } from '../../src/components/ui/use-toast';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { useAppManagment } from '../../src/context/AppManagment';
import { convertAmountFromOnChainToHumanReadable } from '@aptos-labs/ts-sdk';
import { Button } from '../../src/components/ui/button';
import { useChain } from '../../src/context/ChainProvider';
import { IBalance } from '@helpers';
import { Wallet, ExternalLink, Copy, AlertCircle } from 'lucide-react';
import { silkscreen } from '../../app/fonts';

export const FundManage = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [balances, setBalances] = useState<IBalance[]>([]);
  const [feesToClaim, setFeesToClaim] = useState<IBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaimingFees, setIsClaimingFees] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { account } = useWallet();
  const { abi, feesABI } = useAbiClient();
  const { toast } = useToast();
  const { client } = useWalletClient();
  const { aptos } = useChain();
  const { resourceAccount, currencies } = useAppManagment();

  useEffect(() => {
    void (async () => {
      try {
        setIsLoading(true);
        const responseIsSubscribed = await abi
          ?.useABI(feesABI)
          .view.check_collector_object({
            typeArguments: [],
            functionArguments: [account?.address.toString() as `0x${string}`],
          });

        setIsSubscribed(Boolean(responseIsSubscribed?.[0]));
      } catch (error) {
        toast({
          title: 'Error checking subscription status',
          description: `${error}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [abi, account]);

  useEffect(() => {
    if (isSubscribed) {
      void (async () => {
        try {
          setIsLoading(true);
          const balancesResult = await abi
            ?.useABI(feesABI)
            .view.get_resource_balances({
              typeArguments: [],
              functionArguments: [],
            });

          const balancesData = balancesResult;

          if (balancesData) {
            const balanceMapped =
              (
                await aptos.getFungibleAssetMetadata({
                  options: {
                    where: {
                      asset_type: {
                        _in: balancesData[0] as `0x${string}`[],
                      },
                    },
                  },
                })
              )?.map((coin, index) => {
                return {
                  name: coin.name,
                  address: coin.asset_type as `0x${string}`,
                  symbol: coin.symbol,
                  isStableCoin: true,
                  logo: coin.icon_uri,
                  decimals: coin.decimals,
                  balance: convertAmountFromOnChainToHumanReadable(
                    parseInt(balancesData[1][index] as string),
                    coin.decimals
                  ),
                };
              }) || [];

            setBalances([...balanceMapped]);

            const feesBalances: IBalance[] = await Promise.all(
              balanceMapped.map(async (b) => {
                const feesBalanceResult = await abi
                  ?.useABI(feesABI)
                  .view.get_balance_to_claim({
                    typeArguments: [],
                    functionArguments: [
                      account?.address.toString() as `0x${string}`,
                      balanceMapped.find((coin) => coin.address === b.address)
                        ?.address as `0x${string}`,
                    ],
                  });

                const feesBalance = feesBalanceResult?.[0];

                return {
                  ...b,
                  balance: convertAmountFromOnChainToHumanReadable(
                    parseInt(feesBalance as string),
                    b.decimals
                  ),
                };
              })
            );

            setFeesToClaim(feesBalances);
          }
        } catch (error) {
          toast({
            title: 'Error fetching balance',
            description: `${error}`,
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [abi, isSubscribed, currencies, account]);

  const onSubscribe = async () => {
    try {
      setIsSubscribing(true);
      const tx = await client?.useABI(feesABI).create_collector_object({
        type_arguments: [],
        arguments: [],
      });

      toast({
        title: 'Subscribed Successfully',
        description: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${tx?.hash}`}
            target="_blank"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            View transaction <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        ),
        variant: 'default',
      });

      setIsSubscribed(true);
    } catch (error) {
      toast({
        title: 'Error subscribing',
        description: `${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const onClaim = async (address: `0x${string}`) => {
    try {
      setIsClaimingFees(address);
      const tx = await client?.useABI(feesABI).claim_fees({
        type_arguments: [],
        arguments: [address],
      });

      toast({
        title: 'Fees Claimed Successfully',
        description: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${tx?.hash}`}
            target="_blank"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            View transaction <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        ),
        variant: 'default',
      });

      setFeesToClaim(
        feesToClaim.map((b) =>
          b.address === address ? { ...b, balance: 0 } : b
        )
      );
    } catch (error) {
      toast({
        title: 'Error claiming fees',
        description: `${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsClaimingFees(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Address has been copied to clipboard',
      variant: 'default',
    });
  };

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg border border-gray-300">
        <h2
          className={`${silkscreen.className} text-2xl text-center text-gray-900 mb-6`}
        >
          FUND MANAGEMENT
        </h2>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : isSubscribed ? (
          <div className="space-y-8">
            {/* Resource Account Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Resource Account
              </h3>
              <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
                <div className="flex items-center">
                  <Wallet className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    {resourceAccount}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(resourceAccount || '')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Balances Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Resource Account Balances
              </h3>
              {balances.length > 0 ? (
                <div className="space-y-3">
                  {balances.map((b) => (
                    <div
                      key={b.address}
                      className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 mr-3 flex-shrink-0">
                          <img
                            src={b.logo || '/images/sshift-guy.png'}
                            alt={`${b.symbol} logo`}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{b.name}</p>
                          <p className="text-sm text-gray-500">
                            {truncateAddress(b.address)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800">
                          {b.balance} {b.symbol}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                  <p className="text-gray-500">No balances available</p>
                </div>
              )}
            </div>

            {/* Fees to Claim Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Fees Available to Claim
              </h3>
              {feesToClaim.length > 0 ? (
                <div className="space-y-3">
                  {feesToClaim.map((b) => (
                    <div
                      key={b.address}
                      className="bg-white p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 mr-3 flex-shrink-0">
                            <img
                              src={b.logo || '/images/sshift-guy.png'}
                              alt={`${b.symbol} logo`}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {b.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {truncateAddress(b.address)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">
                            {b.balance} {b.symbol}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="default"
                          onClick={() => onClaim(b.address)}
                          disabled={
                            b.balance === 0 || isClaimingFees === b.address
                          }
                          className={`bg-green-600 hover:bg-green-700 text-white ${
                            b.balance === 0
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          {isClaimingFees === b.address ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              Claiming...
                            </>
                          ) : (
                            'Claim Fees'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">No fees available to claim</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="bg-blue-50 p-4 rounded-full">
                <Wallet className="h-12 w-12 text-blue-500" />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-xl font-semibold text-gray-800">
                  Subscribe to Claim Fees
                </h3>
                <p className="text-gray-600">
                  You need to subscribe in order to claim winning fees. This is
                  a one-time action that enables you to collect fees from the
                  platform.
                </p>
              </div>
              <Button
                onClick={onSubscribe}
                disabled={isSubscribing}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-md"
              >
                {isSubscribing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Subscribing...
                  </>
                ) : (
                  'Subscribe Now'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
