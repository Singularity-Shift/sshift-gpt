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

export type AppManagmenContextProp = {
  isAdmin: boolean;
  setIsAdmin: Dispatch<SetStateAction<boolean>>;
  isPendingAdmin: boolean;
  setIsPendingAdmin: Dispatch<SetStateAction<boolean>>;
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
  const { abi } = useAbiClient();
  const { connected, account } = useWallet();

  useEffect(() => {
    if (!connected) return;
    (async () => {
      const adminResult = await abi?.useABI(FeesABI).view.get_admin({
        typeArguments: [],
        functionArguments: [],
      });

      let pendingAdminResult;

      try {
        pendingAdminResult = await abi?.useABI(FeesABI).view.get_pending_admin({
          typeArguments: [],
          functionArguments: [],
        });
      } catch (error) {
        console.error('Error fetching admin or pending admin:', error);
      }

      const admin = adminResult?.[0];

      const pendingAdmin = pendingAdminResult?.[0];

      setIsAdmin(admin === account?.address);
      setIsPendingAdmin(pendingAdmin === account?.address);
    })();
  }, [abi, connected, account?.address, isAdmin, isPendingAdmin]);

  const values = { isAdmin, setIsAdmin, isPendingAdmin, setIsPendingAdmin };

  return (
    <AppManagmentContext.Provider value={values}>
      {children}
    </AppManagmentContext.Provider>
  );
};

export const useAppManagment = () => {
  return useContext(AppManagmentContext);
};
