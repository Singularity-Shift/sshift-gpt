'use client';
import {
  useState,
  useEffect,
  createContext,
  ReactNode,
  useContext,
} from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { IAuth, IJwt, IJWTUser } from '@helpers';
import * as jwtoken from 'jsonwebtoken';
import { usePathname, useRouter } from 'next/navigation';
import { DataProtection } from '../content/DataProtection';
import backend from '../services/backend';

export type AuthContextProp = {
  jwt: string;
  walletAddress: string;
  handleDisconnect: () => void;
};

const AuthContext = createContext<AuthContextProp>({} as AuthContextProp);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [jwt, setJwt] = useState<string>('');
  const { signMessage, account, connected, disconnect, wallet } = useWallet();
  const [walletAddress, setWalletAddress] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const sigIn = async (): Promise<IJwt | undefined> => {
    if (!connected) return;

    try {
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
    } catch (error) {
      handleDisconnect();
      throw new Error(`Error signing in: ${error}`);
    }
  };

  const handleConnectWallet = async (
    storedValues: IJWTUser[] | undefined,
    address: string
  ) => {
    const jwtAuth = storedValues?.find((s) => s.account === address);

    let authObj: IJwt | undefined;

    if (!jwtAuth) {
      authObj = await sigIn();

      if (!authObj?.authToken) {
        console.warn('Error signing in');

        handleDisconnect();
        return;
      }

      setJwt(authObj.authToken);

      const jwtUser: IJWTUser = {
        account: account?.address || '',
        token: authObj.authToken,
      };

      window.localStorage.setItem(
        'jwt',
        JSON.stringify([...(storedValues as IJWTUser[]), jwtUser])
      );
    } else {
      setJwt(jwtAuth?.token);
    }

    const payload = jwtoken.decode(
      jwtAuth?.token || (authObj?.authToken as string)
    ) as {
      address: string;
    };

    if (payload && payload.address === address && wallet) {
      setWalletAddress(address);
      if (pathname === '/') {
        router.push('/dashboard');
      }
    } else {
      handleDisconnect();
    }
  };

  const handleDisconnect = async () => {
    console.log('User disconnected');
    setJwt('');
    const storedValue = getJwt();

    if (!storedValue?.length) {
      return;
    }

    localStorage.setItem(
      'jwt',
      JSON.stringify(
        storedValue?.filter((s) => s.account !== walletAddress) as IJWTUser[]
      )
    );
    if (connected) await disconnect();
    router.push('/');
  };

  const getJwt = () => {
    const item = window.localStorage.getItem('jwt');

    if (item) {
      return JSON.parse(item) as IJWTUser[];
    }

    return;
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !account?.address || !connected) {
      return;
    }

    const storedValue = getJwt();

    handleConnectWallet(storedValue, account?.address as string);
  }, [connected, account]);

  const value: AuthContextProp = { jwt, walletAddress, handleDisconnect };

  return (
    <AuthContext.Provider value={value as AuthContextProp}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
