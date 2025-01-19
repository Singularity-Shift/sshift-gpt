'use client';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import backend from '../services/backend';
import {
  IAction,
  IAdminConfig,
  IAuth,
  IJWT,
  IJwt,
  MultisignAction,
} from '@helpers';
import { createContext, ReactNode, useContext } from 'react';
import { useToast } from '../components/ui/use-toast';
import { DataProtection } from '../content/DataProtection';
import { useLocalStorage } from '../hooks/useLocalStorage';

export type BackendContextProp = {
  sigIn: () => Promise<IJwt | undefined>;
  submitAdminConfig: (
    config: IAdminConfig
  ) => Promise<IAdminConfig | undefined>;
  fetchAdminConfig: () => Promise<IAdminConfig>;
  addAction: (
    action: MultisignAction,
    transaction: string,
    targetAddress?: string
  ) => Promise<void>;
  getActions: () => Promise<IAction[]>;
  updateAction: (
    action: MultisignAction,
    targetAddress: string,
    signature: string
  ) => Promise<void>;
  deleteAction: (
    action: MultisignAction,
    targetAddress: string
  ) => Promise<void>;
};

const BackendContext = createContext<BackendContextProp>(
  {} as BackendContextProp
);

export const BackendProvider = ({ children }: { children: ReactNode }) => {
  const { signMessage, account, connected } = useWallet();
  const [jwt, setJwt] = useLocalStorage<IJWT[]>('jwt', []);
  const { toast } = useToast();

  const sigIn = async (): Promise<IJwt | undefined> => {
    if (!connected) return;

    const message = DataProtection;

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
  ): Promise<IAdminConfig | undefined> => {
    try {
      const auth = jwt.find((j) => j.account === account?.address);

      const body = {
        ...config,
        models: config.models.filter((m) => Boolean(m.name)),
        tools: config.tools.filter((t) => Boolean(t.name)),
      };

      const response = await backend.put('/admin-config', body, {
        headers: {
          Authorization: `Bearer ${auth?.token || ''}`,
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

  const addAction = async (
    action: MultisignAction,
    transaction: string,
    targetAddress?: string
  ) => {
    const payload = {
      action,
      transaction,
      targetAddress,
    };

    const auth = jwt.find((j) => j.account === account?.address);

    await backend.post('/multisign', payload, {
      headers: {
        Authorization: `Bearer ${auth?.account}`,
      },
    });
  };

  const getActions = async (): Promise<IAction[]> => {
    const auth = jwt.find((j) => j.account === account?.address);

    const response = await backend.get('/multisign', {
      headers: {
        Authorization: `Bearer ${auth?.token || ''}`,
      },
    });

    return response.data;
  };

  const updateAction = async (
    action: MultisignAction,
    targetAddress: string,
    signature: string
  ): Promise<void> => {
    const payload = {
      action,
      targetAddress,
      signature,
    };
    const auth = jwt.find((j) => j.account === account?.address);

    await backend.put(`/multisign`, payload, {
      headers: {
        Authorization: `Bearer ${auth?.token}`,
      },
    });
  };

  const deleteAction = async (
    action: MultisignAction,
    targetAddress: string
  ) => {
    const auth = jwt.find((j) => j.account === account?.address);

    await backend.delete(`/multisign/${action}/${targetAddress}`, {
      headers: {
        Authorization: `Bearer ${auth?.token || ''}`,
      },
    });
  };

  const values: BackendContextProp = {
    sigIn,
    submitAdminConfig,
    fetchAdminConfig,
    addAction,
    getActions,
    updateAction,
    deleteAction,
  };

  return (
    <BackendContext.Provider value={values}>{children}</BackendContext.Provider>
  );
};

export const useBackend = () => {
  return useContext(BackendContext);
};
