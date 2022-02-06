import { validate } from 'schema-utils';

import { Compiler, WebpackError, WebpackPluginInstance } from 'webpack';

import { schema } from './schema';
import { IRelayCompiler, RelayCompiler } from './compiler';
import { checkWatchman, getRelayArgs } from './utils';

const PLUGIN_NAME = "relay-compiler-webpack-plugin";

export enum OutputKind {
  DEBUG = 'debug',
  VERBOSE = 'verbose',
  QUIET = 'quiet',
  QUIET_WITH_ERRORS = 'quietWithErrors',
}

export interface RelayCompilerPluginOptions {
  watch?: boolean;
  validate?: boolean;
  output?: OutputKind;
  repersist?: boolean;
  artifactDirectory?: string;
  schema?: string;
  src?: string;
}

export class RelayCompilerPlugin implements WebpackPluginInstance {
  static defaultOptions: RelayCompilerPluginOptions = { watch: true };

  private options: RelayCompilerPluginOptions;
  private relayCompiler: IRelayCompiler;

  constructor(options: RelayCompilerPluginOptions) {
    const merged = { ...RelayCompilerPlugin.defaultOptions, ...options };
    validate(schema, merged, { name: PLUGIN_NAME });
    this.options = merged;
    this.relayCompiler = new RelayCompiler(getRelayArgs(this.options));
  }

  apply(compiler: Compiler) {
    // In case of production build, compilation is supposed to be run manually
    // with --validate option before the build command
    if (process.env.NODE_ENV !== 'production') {
      this.installErrorHandler(compiler);

      if (this.options.watch && checkWatchman()) {
        this.installWatchHandlers(compiler);
      } else {
        this.installHandlers(compiler);
      }
    }
  }

  // Collect errors and push to compilation object`
  private installErrorHandler(compiler: Compiler) {
    compiler.hooks.emit.tapAsync(PLUGIN_NAME, (compilation, next) => {
      if (this.relayCompiler.hasError) {
        // Workaround for Webpack 4 typings
        compilation.errors.push(this.relayCompiler.error as WebpackError);
      }
      next();
    });
  }

  private installWatchHandlers(compiler: Compiler) {
    // Run relay-compiler early
    compiler.hooks.afterEnvironment.tap(PLUGIN_NAME, () => {
      this.relayCompiler.watch(() => {
        // Force compilation to show errors (webpack 5 only)
        // TODO: Find a way to force rebuild for webpack 4
        compiler.root?.watching?.invalidate();
      });
    });
    // Should we kill the subprocess in case of watch close?
    compiler.hooks.watchClose.tap(PLUGIN_NAME, () => {
      this.relayCompiler.stop();
    });
  }

  private installHandlers(compiler: Compiler) {
    // Compile once at the beginning
    compiler.hooks.afterEnvironment.tap(PLUGIN_NAME, () => {
      this.relayCompiler.runOnce();
    });
    // Without watchman, compilation should be finished 
    // before wepback has started reading files
    compiler.hooks.invalid.tap(PLUGIN_NAME, () => {
      this.relayCompiler.runOnce();
    });
  }
}
