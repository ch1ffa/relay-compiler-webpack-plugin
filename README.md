# relay-compiler-webpack-plugin

Webpack pluging for running relay-compiler in webpack dev mode.

**IMPORTANT: This plugin works with relay-compiler v13.0.2 and higher**

If you are using relay in your project, you can run relay-compiler before the start command or run it in the watch mode.

In the first case, you have to run relay-compiler manually every time you've changed your queries. In the second case, you have to use a second shell to run relay-compiler in watch mode or use tools like `concurrently`. Both solutions are possible, but cause unneccessary rebuilds.

This webpack plugins attempts to solve this problem and synchronizes webpack and relay compilation processes.

## Usage

```js
// craco.config.js

const { RelayCompilerPlugin } = require('@ch1ffa/relay-compiler-webpack-plugin');

module.exports = {
  webpack: {
    plugins: [new RelayCompilerPlugin()],
  },
};
```

## Options

You can pass options to the RelayCompilerPlugin which corespond to relay-compiler CLI options:

```ts
export interface RelayCompilerPluginOptions {
  configFile?: string;
  watch?: boolean;
  validate?: boolean;
  output?: OutputKind;
  repersist?: boolean;
  artifactDirectory?: string;
  schema?: string;
  src?: string;
}
```

Default option is `watch: true`. If `watchman` isn't installed, then option `watch: false` is being applied.

Changing `validate` option is not recommended, because the plugin reads output in the watch mode.

## How it works

Depending on options, relay-compiler can be run in the watch mode or after every file change detected by webpack.

In the watch mode, relay-compiler starts in the `afterEnvironment` hook as a child process. With `watch` option disabled, it runs once in the `afterEnvironment` hook and the every `invalid` hook call.

This plugin uses the `emit` hook and forwards stderr output from relay-compiler to throw a WebpackError, stops wepback compilation process and shows errors.
