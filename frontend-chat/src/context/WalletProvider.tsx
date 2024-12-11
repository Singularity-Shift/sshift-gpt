'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PropsWithChildren } from 'react';
import { Network } from '@aptos-labs/ts-sdk';
import { useToast } from '../components/ui/use-toast';
import { APTOS_NETWORK } from '../../config/env';

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const { toast } = useToast();

  return (
    <AptosWalletAdapterProvider
      dappConfig={{
        network:
          APTOS_NETWORK === 'mainnet' ? Network.MAINNET : Network.TESTNET,
      }}
      onError={(error) => {
        console.error('Error in wallet adapter:', error);
      }}
      autoConnect={true}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};
