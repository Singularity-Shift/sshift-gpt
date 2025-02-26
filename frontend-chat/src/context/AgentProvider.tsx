'use client';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AgentRuntime, WalletSigner } from 'move-agent-kit_spiel';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { aptosClient } from '../lib/utils';
import { PANORA_API_KEY } from '../../config/env';
import { Account, Network } from '@aptos-labs/ts-sdk';

type Agent = {
  agent: AgentRuntime;
};

const AgentContext = createContext<Agent>({} as Agent);

export const AgentProvider = ({ children }: { children: React.ReactNode }) => {
  const [agent, setAgent] = useState<AgentRuntime>({} as AgentRuntime);
  const { walletAddress } = useAuth();
  const wallet = useWallet();
  const aptos = aptosClient(Network.MAINNET);

  useEffect(() => {
    if (!walletAddress) return;

    const signer = new WalletSigner({} as Account, wallet);

    const agentInstance = new AgentRuntime(signer, aptos, {
      PANORA_API_KEY,
    });

    setAgent(agentInstance);
  }, [walletAddress]);

  const values = { agent };

  return (
    <AgentContext.Provider value={values}>{children}</AgentContext.Provider>
  );
};

export const useAgent = () => {
  return useContext(AgentContext);
};
