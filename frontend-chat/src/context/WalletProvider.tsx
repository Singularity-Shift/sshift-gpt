'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PontemWallet } from '@pontem/wallet-adapter-plugin';
import { PropsWithChildren } from 'react';
import { Network } from '@aptos-labs/ts-sdk';
import { useToast } from '../components/ui/use-toast';
import { APOTS_NETWORK } from 'frontend-chat/config/env';

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const { toast } = useToast();

  const wallets = [new PontemWallet()];

  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      dappConfig={{
        network:
          APOTS_NETWORK === 'mainnet' ? Network.MAINNET : Network.TESTNET,
      }}
      onError={(error) => {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error || 'Unknown wallet error',
        });
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};
