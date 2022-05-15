import spawn from 'cross-spawn';
import { RelayCompilerPluginOptions } from './plugin';

const WATCHMAN = 'watchman';

export const checkWatchman = () => {
  // the sync function below will fail if watchman is not installed,
  // an error will be thrown
  const { error } = spawn.sync(WATCHMAN, ['-v']);
  if (error) {
    console.log('Watchman is not installed. Ignoring watch option...');
    return false;
  }
  return true;
}

export const getRelayArgs = (options: RelayCompilerPluginOptions): string[] => {
  // Ignore --watch and config options. Will be added later if need be
  const { config, watch, ...args } = options;
  let result: string[] = []
  Object.entries(args).forEach(([key, value]) => {
    result.push(`--${key}`);
    if ('boolean' !== typeof value) {
      result.push(`${value}`);
    }
  })
  return config ? [...result, config] : result;
}
