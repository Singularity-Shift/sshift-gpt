import { getAptosClient } from '@aptos';
import { Aptos } from '@aptos-labs/ts-sdk';
import {
  APTOS_INDEXER,
  APTOS_NODE_URL,
  MOVEMENT_INDEXER,
  MOVEMENT_NODE_URL,
} from '../../config/env';
import { createContext, useContext, useEffect, useState } from 'react';
import { Chain } from '@helpers';

type ChainProviderContextProp = {
  aptos: Aptos;
  chain: Chain;
  createChainClient: (chain: Chain) => void;
};

const ChainProviderContext = createContext<ChainProviderContextProp>(
  {} as ChainProviderContextProp
);

export const ChainProvider = ({ children }: { children: React.ReactNode }) => {
  const [aptos, setAptos] = useState<Aptos>({} as Aptos);
  const [chain, setChain] = useState<Chain>(Chain.Aptos);

  useEffect(() => {
    if (!window?.localStorage) return;

    const chain = window.localStorage.getItem('chain') as Chain;

    const fullnode = (
      chain === Chain.Movement ? MOVEMENT_NODE_URL : APTOS_NODE_URL
    ) as string;
    const indexer = (
      chain === Chain.Aptos ? MOVEMENT_INDEXER : APTOS_INDEXER
    ) as string;

    setChain(chain);
    setAptos(getAptosClient(fullnode, indexer));
  }, []);

  const createChainClient = (chain: Chain) => {
    const fullnode = (
      chain === Chain.Movement ? MOVEMENT_NODE_URL : APTOS_NODE_URL
    ) as string;
    const indexer = (
      chain === Chain.Aptos ? MOVEMENT_INDEXER : APTOS_INDEXER
    ) as string;

    window.localStorage.setItem('chain', chain);
    setChain(chain);
    setAptos(getAptosClient(fullnode, indexer));
  };

  return (
    <ChainProviderContext.Provider value={{ aptos, chain, createChainClient }}>
      {children}
    </ChainProviderContext.Provider>
  );
};

export const useChain = () => {
  return useContext(ChainProviderContext);
};
