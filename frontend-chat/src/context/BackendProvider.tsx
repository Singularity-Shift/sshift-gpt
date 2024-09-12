'use client';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import api from '@fn-chat/services/api';
import { IAuth, IJwt } from '@helpers';
import { createContext, ReactNode, useContext } from 'react';

export type BackendContextProp = {
  sigIn: () => Promise<IJwt | undefined>;
};

const BackendContext = createContext<BackendContextProp>(
  {} as BackendContextProp
);

export const BackendProvider = ({ children }: { children: ReactNode }) => {
  const { signMessage, account, connected } = useWallet();

  const sigIn = async (): Promise<IJwt | undefined> => {
    if (!connected) return;

    const message =
      'Signning this message your are agree with the terms and condition of SShift GPT';

    const messageResp = await signMessage({
      message,
      nonce: Math.random().toString(),
    });

    const payload: IAuth = {
      message: messageResp.fullMessage,
      signature: `${messageResp.signature}`,
      address: account?.address as string,
      publicKey: account?.publicKey as string,
    };

    const response = await api.post('/auth/login', { ...payload });

    return response.data;
  };

  const values: BackendContextProp = {
    sigIn,
  };

  return (
    <BackendContext.Provider value={values}>{children}</BackendContext.Provider>
  );
};

export const useBackend = () => {
  return useContext(BackendContext);
};
