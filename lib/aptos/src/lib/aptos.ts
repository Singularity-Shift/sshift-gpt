import {
  Aptos,
  AptosConfig,
  Ed25519PublicKey,
  Ed25519Signature,
  Network,
} from '@aptos-labs/ts-sdk';
import { createSurfClient } from '@thalalabs/surf';

const APTOS_NETWORK = process.env.NEXT_PUBLIC_APTOS_NETWORK as string;

export const validateSignature = ({
  publicKey,
  signature,
  message,
}: {
  publicKey: string;
  signature: string;
  message: string;
}) => {
  return new Ed25519PublicKey(publicKey).verifySignature({
    message,
    signature: new Ed25519Signature(signature),
  });
};

export const aptos = new Aptos(
  new AptosConfig({
    network: APTOS_NETWORK === 'mainnet' ? Network.MAINNET : Network.TESTNET,
  })
);

export const abis = createSurfClient(aptos);
