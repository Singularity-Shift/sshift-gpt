import 'dotenv/config';
import fs from 'fs';
import { parseDocument } from 'yaml';
import cli from '@aptos-labs/ts-sdk/dist/common/cli/index';

const config = parseDocument(fs.readFileSync('./.aptos/config.yaml', 'utf8'));
const accountAddress =
  config['profiles'][`salary_payment_${process.env.VITE_APP_NETWORK}`][
    'account'
  ];

async function compile() {
  const move = new cli.Move();

  await move.compile({
    packageDirectoryPath: 'contracts/subscription',
    namedAddresses: {
      sshift_dao_addr: accountAddress,
    },
  });
}
compile();
