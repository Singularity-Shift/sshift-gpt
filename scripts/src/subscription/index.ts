import 'dotenv/config';
import fs from 'fs';
import { parseDocument } from 'yaml';
import * as cli from '@aptos-labs/ts-sdk/dist/common/cli/index.js';

const getConfig = () => {
  if (!process.env.MODULE_ADDRESS) {
    throw new Error('MODULE_ADDRESS env variable is required');
  }

  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY env variable is required');
  }

  const profile = `subscription_${process.env.APP_NETWORK}`;

  const configParsed = parseDocument(
    fs.readFileSync('./.aptos/config.yaml', 'utf8')
  );

  const config = configParsed.toJSON();

  config['profiles'][profile]['private_key'] = process.env.PRIVATE_KEY;

  const accountAddress = config['profiles'][profile]['account'];

  return { accountAddress, profile };
};

export const compile = async () => {
  const move = new cli.Move();

  const { accountAddress } = getConfig();

  await move.compile({
    packageDirectoryPath: 'contracts/subscription',
    namedAddresses: {
      sshift_dao_addr: accountAddress,
    },
    extraArguments: ['--move-2'],
  });
};

export const publish = async () => {
  const move = new cli.Move();

  const { accountAddress, profile } = getConfig();

  await move.publish({
    packageDirectoryPath: 'contracts/subscription',
    namedAddresses: {
      sshift_dao_addr: accountAddress,
    },
    profile,
    extraArguments: ['--move-2'],
  });
};

export const test = async () => {
  const move = new cli.Move();

  await move.test({
    packageDirectoryPath: 'contracts/subscription',
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
    objectAddress: process.env.VITE_MODULE_ADDRESS,
    namedAddresses: {
      // Upgrade module from an object
      sshift_dao_addr: accountAddress,
    },
    profile,
  });
};
