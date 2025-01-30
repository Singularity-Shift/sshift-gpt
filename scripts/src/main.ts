import { Command } from 'commander';
import { compile, publish, test, upgrade } from './subscription';
import { convertFileToBase64 } from './encrypt';

const program = new Command();

const options = program
  .name('sshif')
  .description('Command-line interface for managing Sshift DAO contracts')
  .version('1.0.0')
  .command('subscription')
  .description('Commands for managing subscription contracts')
  .option('-c, --compile', 'compile subscription contracts')
  .option('-p, --publish', 'publish subscription contracts')
  .option('-t, --test', 'run subscription contract tests')
  .option('-u, --upgrade', 'upgrade subscription contract')
  .command('encrypt')
  .option('-f, --file <path>', 'path to the file to be encrypted')
  .parse(process.argv)
  .opts();

if (options.compile) {
  compile();
} else if (options.publish) {
  publish();
} else if (options.test) {
  test();
} else if (options.upgrade) {
  upgrade;
} else if (options.file) {
  console.log(`Encrypting file: ${options.file}`);
  convertFileToBase64(options.file);
} else {
  console.error('Invalid command. Use --help for more information.');
}
