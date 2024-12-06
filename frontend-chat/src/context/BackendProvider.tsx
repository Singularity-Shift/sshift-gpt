'use client';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import backend from '../services/backend';
import { IAdminConfig, IAuth, IJwt } from '@helpers';
import { createContext, ReactNode, useContext } from 'react';
import { useToast } from '../components/ui/use-toast';

export type BackendContextProp = {
  sigIn: () => Promise<IJwt | undefined>;
  submitAdminConfig: (config: IAdminConfig) => Promise<IAdminConfig>;
  fetchAdminConfig: () => Promise<IAdminConfig>;
};

const BackendContext = createContext<BackendContextProp>(
  {} as BackendContextProp
);

export const BackendProvider = ({ children }: { children: ReactNode }) => {
  const { signMessage, account, connected } = useWallet();
  const { toast } = useToast();

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

    const response = await backend.post('/auth/login', { ...payload });

    return response.data;
  };

  const submitAdminConfig = async (
    config: IAdminConfig
  ): Promise<IAdminConfig> => {
    try {
      const body = {
        ...config,
        models: config.models.filter((m) => Boolean(m.name)),
        tools: config.tools.filter((t) => Boolean(t.name)),
      };

      const jwt = localStorage.getItem('jwt');

      const response = await backend.put('/admin-config', body, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      toast({
        title: 'Admin configuration submitted successfully',
        description: 'Your changes have been saved.',
        variant: 'default',
      });

      return response.data;
    } catch (error) {
      toast({
        title: 'Error submitting admin configuration',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  const fetchAdminConfig = async (): Promise<IAdminConfig> => {
    const response = await backend.get('/admin-config');

    return response.data;
  };

  const values: BackendContextProp = {
    sigIn,
    submitAdminConfig,
    fetchAdminConfig,
  };

  return (
    <BackendContext.Provider value={values}>{children}</BackendContext.Provider>
  );
};

export const useBackend = () => {
  return useContext(BackendContext);
};
