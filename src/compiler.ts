import spawn from 'cross-spawn';

import type { ChildProcess } from 'child_process';

const RELAY = 'relay-compiler';

export interface IRelayCompiler {
  runOnce: () => void;
  watch: () => void;
  stop: () => void;
  clearErrors: () => void;
  hasErrors: boolean;
  error: Error;
}

export class RelayCompiler implements IRelayCompiler {
  private _subprocess?: ChildProcess;
  private _compilationErrorData: string = '';
  private _args: string[];

  constructor(args: string[]) {
    this._args = args;
  }

  get hasErrors() { 
    return this._compilationErrorData.length > 0;
  }

  get error() {
    return new Error(this._compilationErrorData);
  }

  runOnce() {
    const subprocess = spawn.sync(RELAY, this._args);
    if (subprocess.stdout?.byteLength > 0) {
      console.log(`${subprocess.stdout}`);
    }
    if (subprocess.stderr?.byteLength > 0) {
      this._compilationErrorData += subprocess.stderr.toString('utf-8');
    }
  }

  // TODO: Handle compiler crash 
  watch() {
    if (!this._subprocess) {
      // Start relay-compiler in watch mode
      this._subprocess = spawn(RELAY, [...this._args, '--watch']);
      this._subprocess?.stderr?.setEncoding('utf-8');
      // Show info
      this._subprocess?.stdout?.on('data', chunk => {
        console.log(`${chunk}`);
      });
      // Collect errors from stderr (added in v13.0.2)
      this._subprocess?.stderr?.on('data', chunk => {
        this._compilationErrorData += chunk;
      });
    }
  }

  stop() {
    this._subprocess?.kill();
    this._subprocess = undefined;
  }

  clearErrors() {
    this._compilationErrorData = '';
  }
}
