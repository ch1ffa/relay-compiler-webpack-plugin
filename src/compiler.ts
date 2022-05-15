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
  error: Error;
}

export class RelayCompiler implements IRelayCompiler {
  private subprocess?: ChildProcess;
  private errorMessage: string = '';

  constructor(private args: string[]) {}

  get hasError() { 
    return this.errorMessage.length > 0;
  }

  get error() {
    return new Error(this.errorMessage);
  }

  runOnce() {
    this.errorMessage = '';
    const subprocess = spawn.sync(RELAY, this.args);
    if (subprocess.stdout?.byteLength > 0) {
      console.log(`${subprocess.stdout}`);
    }
    if (subprocess.stderr?.byteLength > 0) {
      this.errorMessage += subprocess.stderr.toString('utf-8');
    }
  }

  // In the watch mode, we have to parse output
  // to detect compiler's state
  watch(callback?: () => void) {
    if (!this.subprocess) {
      // Start relay-compiler in watch mode
      this.subprocess = spawn(RELAY, [...this.args, '--watch']);
      this.subprocess?.stderr?.setEncoding("utf-8");
      // Clear errors during compilation
      this.subprocess?.stdout?.on('data', chunk => {
        if (String(chunk).toLowerCase().includes(COMPILING)) {
          this.errorMessage = '';
        }
      });
      // Collect errors from stderr (added in v13.0.2)
      this.subprocess?.stderr?.on('data', chunk => {
        this.errorMessage += chunk;
        // Do something if compilation failed
        if (this.errorMessage.toLowerCase().includes(FAILED)) {
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
