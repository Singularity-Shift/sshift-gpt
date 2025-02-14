'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PropsWithChildren } from 'react';
import { AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { PontemWallet } from '@pontem/wallet-adapter-plugin';
import { APTOS_INDEXER, APTOS_NETWORK, APTOS_NODE_URL } from '../../config/env';

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const wallets = [new PontemWallet()];

  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      dappConfig={
        new AptosConfig({
          network:
            APTOS_NETWORK === 'mainnet' ? Network.MAINNET : Network.TESTNET,
          fullnode: APTOS_NODE_URL,
          indexer: APTOS_INDEXER,
        })
      }
      onError={(error) => {
        console.error('Error in wallet adapter:', error);
      }}
      autoConnect={true}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};
