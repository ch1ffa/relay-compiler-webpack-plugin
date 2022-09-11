import spawn from 'cross-spawn';

import type { ChildProcess } from 'child_process';

const RELAY = 'relay-compiler';
const COMPILING = 'compiling';
const FAILED = 'compilation failed';

export interface IRelayCompiler {
  runOnce(): void;
  watch(callback?: () => void): void;
  stop(): void;
  hasError: boolean;
  error?: Error;
}

export class RelayCompiler implements IRelayCompiler {
  private subprocess?: ChildProcess;
  error?: Error;

  constructor(private args: string[]) {}

  get hasError() { 
    return this.error != undefined;
  }

  runOnce() {
    this.error = undefined;
    const subprocess = spawn.sync(RELAY, this.args);
    if (subprocess.stdout?.byteLength > 0) {
      console.log(subprocess.stdout.toString('utf-8'));
    }
    if (subprocess.stderr?.byteLength > 0) {
      const errorMessage = subprocess.stderr.toString('utf-8')
      if (errorMessage.toLowerCase().includes(FAILED)) {
        this.error = new Error(errorMessage)
      }
    }
    if (this.error === undefined) {
      this.error = subprocess.error;
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
          this.error = error;
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
          this.error = new Error(errorMessage);
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
