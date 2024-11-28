'use client';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAbiClient } from './AbiProvider';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { FeesABI } from '../../abis/FeesAbi';
import { useToast } from '../../src/components/ui/use-toast';
import { IMoveBotFields, ISubscription } from '@helpers';
import { SubscriptionABI } from '../../abis/SubscriptionAbi';
import { aptosClient } from '../lib/utils';
import { QRIBBLE_NFT_ADDRESS, SSHIFT_RECORD_ADDRESS } from '../../config/env';
import { useWalletClient } from '@thalalabs/surf/hooks';

export type AppManagmenContextProp = {
  isAdmin: boolean;
  setIsAdmin: Dispatch<SetStateAction<boolean>>;
  isPendingAdmin: boolean;
  setIsPendingAdmin: Dispatch<SetStateAction<boolean>>;
  isCollector: boolean;
  setIsCollector: Dispatch<SetStateAction<boolean>>;
  resourceAccount: `0x${string}` | null;
  setResourceAccount: Dispatch<SetStateAction<`0x${string}` | null>>;
  currency: `0x${string}` | null;
  setCurrency: Dispatch<SetStateAction<`0x${string}` | null>>;
  moveBotsOwned: number;
  qribbleNFTsOwned: number;
  sshiftRecordsOwned: number;
  nftAddressesRequiredOwned: string[];
  onSubscribe: (days: number) => Promise<void>;
  isSubscriptionActive: boolean;
  setIsSubscriptionActive: Dispatch<SetStateAction<boolean>>;
  expirationDate: string | null;
};

const AppManagmentContext = createContext<AppManagmenContextProp>(
  {} as AppManagmenContextProp
);

export const AppManagementProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPendingAdmin, setIsPendingAdmin] = useState(false);
  const [isCollector, setIsCollector] = useState(false);
  const [resourceAccount, setResourceAccount] = useState<`0x${string}` | null>(
    null
  );
  const [moveBotsOwned, setMoveBotsOwned] = useState(0);
  const [qribbleNFTsOwned, setQribbleNFTsOwned] = useState(0);
  const [sshiftRecordsOwned, setSShiftRecordsOwned] = useState(0);
  const [nftAddressesRequiredOwned, setNftAddressesRequiredOwned] = useState<
    string[]
  >([]);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [currency, setCurrency] = useState<`0x${string}` | null>(null);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const { abi } = useAbiClient();
  const { connected, account } = useWallet();
  const { toast } = useToast();
  const aptos = aptosClient();
  const { client } = useWalletClient();

  useEffect(() => {
    if (!connected) return;
    (async () => {
      let adminResult;
      let pendingAdminResult;
      try {
        adminResult = await abi?.useABI(FeesABI).view.get_admin({
          typeArguments: [],
          functionArguments: [],
        });
      } catch (error) {
        toast({
          title: 'Error fetching admin',
          description: `Admin probably not set yet: ${error}`,
          variant: 'destructive',
        });
      }
      try {
        pendingAdminResult = await abi?.useABI(FeesABI).view.get_pending_admin({
          typeArguments: [],
          functionArguments: [],
        });
      } catch (error) {
        console.error('Error fetching pending admin:', error);
      }

      const admin = adminResult?.[0];

      const pendingAdmin = pendingAdminResult?.[0];

      setIsAdmin(admin === account?.address);
      setIsPendingAdmin(pendingAdmin === account?.address);
    })();
  }, [abi, connected, account?.address, isAdmin, isPendingAdmin]);

  useEffect(() => {
    if (!connected) return;
    (async () => {
      let collectorResult;
      try {
        collectorResult = await abi?.useABI(FeesABI).view.get_collectors({
          typeArguments: [],
          functionArguments: [],
        });
      } catch (error) {
        toast({
          title: 'Error fetching collector',
          description: `Not Collectors probably set yet: ${error}`,
          variant: 'destructive',
        });
      }

      const collectors = collectorResult?.[0];

      setIsCollector(collectors?.some((c) => c === account?.address) || false);
    })();
  }, [abi, connected, account?.address, isCollector]);

  useEffect(() => {
    void (async () => {
      try {
        const resourceAccountResult = await abi
          ?.useABI(FeesABI)
          .view.get_resource_account_address({
            typeArguments: [],
            functionArguments: [],
          });

        const resourceAccountAddress = resourceAccountResult?.[0];

        setResourceAccount(resourceAccountAddress || null);
      } catch (error) {
        toast({
          title: 'Error fetching resource account',
          description: `Not resource account probably set yet: ${error}`,
          variant: 'destructive',
        });
      }

      try {
        const currencyResult = await abi
          ?.useABI(FeesABI)
          .view.get_currency_addr({
            typeArguments: [],
            functionArguments: [],
          });

        const currency = currencyResult?.[0];

        setCurrency(currency || null);
      } catch (error) {
        toast({
          title: 'Error fetching token address',
          description: `Not token address probably set yet: ${error}`,
          variant: 'destructive',
        });
      }
    })();
  }, [abi]);

  useEffect(() => {
    if (!connected || !account?.address) return;

    void (async () => {
      try {
        const nftsHolding = await aptos.getAccountOwnedTokens({
          accountAddress: account?.address as string,
        });

        const moveBotFieldsResult = await abi
          ?.useABI(SubscriptionABI)
          .view.get_move_bot_fields({
            typeArguments: [],
            functionArguments: [],
          });

        const moveBotFields = moveBotFieldsResult?.[0] as IMoveBotFields;

        const movebotsHolding = nftsHolding.filter(
          (nft) =>
            nft.current_token_data?.token_name === moveBotFields.token_name &&
            nft.current_token_data.current_collection?.creator_address ===
              moveBotFields.token_creator &&
            nft.property_version_v1?.toString() ===
              moveBotFields.token_property_version &&
            nft.current_token_data?.current_collection?.collection_name ===
              moveBotFields.token_collection
        );

        setMoveBotsOwned(movebotsHolding.length || 0);

        const configResult = await abi
          ?.useABI(SubscriptionABI)
          .view.get_subscription_config({
            typeArguments: [],
            functionArguments: [],
          });

        const config = configResult?.[0] as ISubscription;

        const qribbleNFTCollection = config.collections_discount.find(
          (c) => c.collection_addr === QRIBBLE_NFT_ADDRESS
        );

        const qribbleNFTsHolding = nftsHolding.filter(
          (nft) =>
            nft.current_token_data?.collection_id ===
            qribbleNFTCollection?.collection_addr
        );

        setQribbleNFTsOwned(qribbleNFTsHolding.length || 0);

        const sshiftRecordsNFTCollection = config.collections_discount.find(
          (c) => c.collection_addr === SSHIFT_RECORD_ADDRESS
        );

        const sshiftRecordsHolding = nftsHolding.filter(
          (nft) =>
            nft.current_token_data?.collection_id ===
            sshiftRecordsNFTCollection?.collection_addr
        );

        setSShiftRecordsOwned(sshiftRecordsHolding.length || 0);
        setNftAddressesRequiredOwned([
          ...qribbleNFTsHolding.map((nft) => nft.token_data_id),
          ...sshiftRecordsHolding.map((nft) => nft.token_data_id),
        ]);

        const hasSubscriptionActiveResult = await abi
          ?.useABI(SubscriptionABI)
          .view.has_subscription_active({
            typeArguments: [],
            functionArguments: [account.address as `0x${string}`],
          });

        const hasSubscriptionActive =
          hasSubscriptionActiveResult?.[0] as boolean;

        setIsSubscriptionActive(hasSubscriptionActive);

        if (hasSubscriptionActive) {
          const subscribtionResult = await abi
            ?.useABI(SubscriptionABI)
            .view.get_plan({
              typeArguments: [],
              functionArguments: [account.address as `0x${string}`],
            });

          const subscription = subscribtionResult?.[1];

          if (subscription?.[1]) {
            const expireDate = parseInt(subscription) * 1000;
            setExpirationDate(
              new Date(expireDate).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            );
          }
        }
      } catch (error) {
        toast({
          title: 'Error check nft required',
          description: `Error checking nft required holding by the account: ${error}`,
          variant: 'destructive',
        });
      }
    })();
  }, [connected, account?.address, abi]);

  const onSubscribe = async (days: number) => {
    try {
      const duration = days * 24 * 60 * 60;

      const tx = await client?.useABI(SubscriptionABI).buy_plan({
        type_arguments: [],
        arguments: [duration, nftAddressesRequiredOwned as `0x${string}`[]],
      });

      toast({
        title: 'Subscribe',
        description: (
          <a href={`https://explorer.aptoslabs.com/txn/${tx?.hash}`}>
            {tx?.hash}
          </a>
        ),
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error subscribing',
        message: error,
        variant: 'destructive',
      });
    }
  };

  const values = {
    isAdmin,
    setIsAdmin,
    isPendingAdmin,
    setIsPendingAdmin,
    isCollector,
    setIsCollector,
    resourceAccount,
    setResourceAccount,
    currency,
    setCurrency,
    moveBotsOwned,
    qribbleNFTsOwned,
    sshiftRecordsOwned,
    nftAddressesRequiredOwned,
    onSubscribe,
    isSubscriptionActive,
    setIsSubscriptionActive,
    expirationDate,
  };

  return (
    <AppManagmentContext.Provider value={values}>
      {children}
    </AppManagmentContext.Provider>
  );
};

export const useAppManagment = () => {
  return useContext(AppManagmentContext);
};
