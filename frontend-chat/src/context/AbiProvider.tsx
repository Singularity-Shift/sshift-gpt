'use client';
import { DefaultABITable } from '@thalalabs/surf';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Client } from '@thalalabs/surf/build/types/core/Client';
import { abis as surfClient } from '@aptos';
import { useChain } from './ChainProvider';

export type AbiContextProp = {
  abi: Client<DefaultABITable> | undefined;
};

const AbiContext = createContext<AbiContextProp>({} as AbiContextProp);

export const AbiProvider = ({ children }: { children: ReactNode }) => {
  const [abi, setAbi] = useState<Client<DefaultABITable>>();
  const { aptos } = useChain();

  useEffect(() => {
    if (!aptos) return;
    setAbi(
      surfClient(
        aptos.config.fullnode as string,
        aptos.config.indexer as string
      )
    );
  }, [aptos]);

  const values = { abi };

  return <AbiContext.Provider value={values}>{children}</AbiContext.Provider>;
};

export const useAbiClient = () => {
  return useContext(AbiContext);
};
