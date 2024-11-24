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
  const [currency, setCurrency] = useState<`0x${string}` | null>(null);
  const { abi } = useAbiClient();
  const { connected, account } = useWallet();
  const { toast } = useToast();

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
