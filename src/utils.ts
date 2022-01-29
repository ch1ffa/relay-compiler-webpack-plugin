import spawn from "cross-spawn";
import { RelayCompilerPluginOptions } from "./plugin";

const WATCHMAN = 'watchman';

export const checkWatchman = () => {
  try {
    // the sync function below will fail if watchman is not installed,
    // an error will be thrown
    if (spawn.sync(WATCHMAN, ['-v'])) {
      return true;
    }
  } catch (e) {
    console.log('Watchman is not installed. Ignoring watch option...');
  }
  return false;
}

export const getRelayArgs = (options: RelayCompilerPluginOptions): string[] => {
  // Ignore --watch option. Will be added later if need be
  const { watch, ...args } = options;
  let result: string[] = []
  Object.entries(args).forEach(([key, value]) => {
    result.push(`--${key}`);
    if ('boolean' !== typeof value) {
      result.push(`${value}`);
    }
  })
  return result;
}
