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

export type AbiContextProp = {
  abi: Client<DefaultABITable> | undefined;
};

const AbiContext = createContext<AbiContextProp>({} as AbiContextProp);

export const AbiProvider = ({ children }: { children: ReactNode }) => {
  const [abi, setAbi] = useState<Client<DefaultABITable>>();

  useEffect(() => {
    setAbi(surfClient);
  }, []);

  const values = { abi };

  return <AbiContext.Provider value={values}>{children}</AbiContext.Provider>;
};

export const useAbiClient = () => {
  return useContext(AbiContext);
};
