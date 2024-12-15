'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PropsWithChildren } from 'react';
import { Network } from '@aptos-labs/ts-sdk';
import { PontemWallet } from '@pontem/wallet-adapter-plugin';
import { APTOS_NETWORK } from '../../config/env';

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const wallets = [new PontemWallet()];

  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
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
