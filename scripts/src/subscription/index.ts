import 'dotenv/config';
import fs from 'fs';
import { parseDocument } from 'yaml';
import * as cli from '@aptos-labs/ts-sdk/dist/common/cli/index.js';

const getConfig = () => {
  if (!process.env.NEXT_PUBLIC_MODULE_ADDRESS) {
    throw new Error('NEXT_PUBLIC_MODULE_ADDRESS env variable is required');
  }

  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY env variable is required');
  }

  const profile = `subscription_${process.env.NEXT_PUBLIC_APTOS_NETWORK}`;

  const configParsed = parseDocument(
    fs.readFileSync('./.aptos/config.yaml', 'utf8')
  );

  const config = configParsed.toJSON();

  config['profiles'][profile]['private_key'] = process.env.PRIVATE_KEY;

  const accountAddress = config['profiles'][profile]['account'];

  return { accountAddress, profile, config };
};

export const compile = async () => {
  const move = new cli.Move();

  const { accountAddress } = getConfig();

  await move.compile({
    packageDirectoryPath: 'contracts/sshift_dao',
    namedAddresses: {
      sshift_dao_addr: accountAddress,
    },
    extraArguments: ['--move-2'],
  });
};

export const publish = async () => {
  const move = new cli.Move();

  const { accountAddress, profile, config } = getConfig();

  await move.publish({
    packageDirectoryPath: 'contracts/sshift_dao',
    namedAddresses: {
      sshift_dao_addr: accountAddress,
    },
    extraArguments: [
      '--move-2',
      '--sender-account',
      accountAddress,
      '--private-key',
      config['profiles'][profile]['private_key'],
      '--url',
      config['profiles'][profile]['rest_url'],
    ],
  });
};

export const test = async () => {
  const move = new cli.Move();

  await move.test({
    packageDirectoryPath: 'contracts/sshift_dao',
    namedAddresses: {
      sshift_dao_addr: '0x100' as any,
    },
  });
};

export const upgrade = async () => {
  const move = new cli.Move();

  const { accountAddress, profile } = getConfig();

  move.upgradeObjectPackage({
    packageDirectoryPath: 'salary_payment',
    objectAddress: process.env.NEXT_PUBLIC_MODULE_ADDRESS,
    namedAddresses: {
      // Upgrade module from an object
      sshift_dao_addr: accountAddress,
    },
    profile,
  });
};
