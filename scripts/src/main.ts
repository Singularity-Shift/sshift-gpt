import { Command } from 'commander';
import { compile, publish, test, upgrade } from './subscription';
import { convertFileToBase64 } from './encrypt';

const program = new Command();

program
  .name('sshif')
  .description('Command-line interface for managing Sshift DAO contracts')
  .version('1.0.0')
  .command('subscription')
  .description('Commands for managing subscription contracts')
  .option('-c, --compile', 'compile subscription contracts')
  .option('-p, --publish', 'publish subscription contracts')
  .option('-t, --test', 'run subscription contract tests')
  .option('-u, --upgrade', 'upgrade subscription contract')
  .action((options) => {
    if (options.compile) {
      compile();
    } else if (options.publish) {
      publish();
    } else if (options.test) {
      test();
    } else if (options.upgrade) {
      upgrade;
    } else {
      console.error('Invalid command. Use --help for more information.');
    }
  })
  .parse(process.argv);

// program
//   .command('encrypt')
//   .description('Encrypt a file')
//   .option('-f, --file <path>', 'path to the file to be encrypted')
//   .action((options, path) => {
//     console.log(path);
//   })
//   .parse(process.argv);
