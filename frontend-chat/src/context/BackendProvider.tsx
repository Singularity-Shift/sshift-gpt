'use client';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import backend from '../services/backend';
import { IAction, IAdminConfig, IAuth, IJwt, MultisignAction } from '@helpers';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useToast } from '../components/ui/use-toast';
import { AccountAuthenticator } from '@aptos-labs/ts-sdk';
import { DataProtection } from '../content/DataProtection';

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

    const jwt = localStorage.getItem('jwt');

    await backend.post('/multisign', payload, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
  };

  const getActions = async (): Promise<IAction[]> => {
    const jwt = localStorage.getItem('jwt');

    const response = await backend.get('/multisign', {
      headers: {
        Authorization: `Bearer ${jwt}`,
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

    const jwt = localStorage.getItem('jwt');

    await backend.put(`/multisign`, payload, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
  };

  const deleteAction = async (
    action: MultisignAction,
    targetAddress: string
  ) => {
    const jwt = localStorage.getItem('jwt');

    await backend.delete(`/multisign/${action}/${targetAddress}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
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
