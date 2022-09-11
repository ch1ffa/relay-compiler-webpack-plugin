import spawn from 'cross-spawn';

import type { ChildProcess } from 'child_process';
import {WebpackError} from "webpack";

const RELAY = 'relay-compiler';
const COMPILING = 'compiling';
const FAILED = 'compilation failed';

export interface IRelayCompiler {
  runOnce(): void;
  watch(callback?: () => void): void;
  stop(): void;
  error?: WebpackError;
}

export class RelayCompiler implements IRelayCompiler {
  private subprocess?: ChildProcess;
  error?: WebpackError;

  constructor(private args: string[]) {}

  runOnce() {
    this.error = undefined;
    const subprocess = spawn.sync(RELAY, this.args);
    if (subprocess.stdout?.byteLength > 0) {
      console.log(subprocess.stdout.toString('utf-8'));
    }
    if (subprocess.stderr?.byteLength > 0) {
      const errorMessage = subprocess.stderr.toString('utf-8')
      if (errorMessage.toLowerCase().includes(FAILED)) {
        this.error = new WebpackError(errorMessage)
      }
    }
    if (this.error === undefined && subprocess.error !== undefined) {
      this.error = new WebpackError(subprocess.error.message);
    }
  }

  // In the watch mode, we have to parse output
  // to detect compiler's state
  watch(callback?: () => void) {
    if (!this.subprocess) {
      // Start relay-compiler in watch mode
      this.subprocess = spawn(RELAY, [...this.args, '--watch']);
      // Clear errors during compilation
      this.subprocess.stdout?.on('data', chunk => {
        if (String(chunk).toLowerCase().includes(COMPILING)) {
          this.error = undefined;
        }
      });
      let failed = false;
      this.subprocess.on('error', error => {
        if (!failed) {
          this.error = new WebpackError(error.message);
          failed = true;
          callback?.();
        }
      });
      let errorMessage = '';
      this.subprocess.stderr?.setEncoding("utf-8");
      this.subprocess.stderr?.on('data', chunk => {
        errorMessage += chunk;
      });
      this.subprocess.stderr?.on('end', () => {
        // Do something if compilation failed
        if (errorMessage.toLowerCase().includes(FAILED) && !failed) {
          this.error = new WebpackError(errorMessage);
          failed = true;
          callback?.();
        }
      });
    }
  }

  stop() {
    this.subprocess?.kill();
    this.subprocess = undefined;
  }
}
