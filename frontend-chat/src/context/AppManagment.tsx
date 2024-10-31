'use client';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAbiClient } from './AbiProvider';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { FeesABI } from '../../abis/FeesAbi';

export type AppManagmenContextProp = {
  isAdmin: boolean;
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
  const { abi } = useAbiClient();
  const { connected, account } = useWallet();

  useEffect(() => {
    (async () => {
      const adminResult = await abi?.useABI(FeesABI).view.get_admin({
        typeArguments: [],
        functionArguments: [],
      });

      const admin = adminResult?.[0];

      setIsAdmin(admin === account?.address);
    })();
  }, [abi, connected, account?.address]);

  const values = { isAdmin };

  return (
    <AppManagmentContext.Provider value={values}>
      {children}
    </AppManagmentContext.Provider>
  );
};

export const useAppManagment = () => {
  return useContext(AppManagmentContext);
};
