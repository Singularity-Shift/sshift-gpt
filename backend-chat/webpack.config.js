const { join } = require('path');

const { composePlugins, withNx } = require('@nx/webpack');

// Nx composable plugins for webpack.
module.exports = composePlugins(
  withNx({
    sourceMap: true,
  }),
  (config, { options, context }) => {
    options.outputPath = join(__dirname, '../dist/backend-chat');
    options.watch = true;
    options.target = 'node';
    options.main = './src/main.ts';
    options.tsConfig = './tsconfig.app.json';
    options.optimization = false;
    options.outputHashing = 'none';
    options.watch = true;
    options.generatePackageJson = true;
    return config;
  }
);
