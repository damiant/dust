import { environment } from 'src/environments/environment';
import { DataMethods } from './models';

export interface Call {
  method: string;
  id: string;
  arguments: any[];
}

export interface CallPromise {
  id: string;
  promise: Promise<any>;
  resolve: any;
}

export interface Response {
  id: string;
  error?: any;
  data: any;
  ms: number
}

export interface WorkerClass {
  doWork(method: string, ...args: any[]): Promise<any>;
}

export function registerWorkerClass(workerClass: WorkerClass) {
  addEventListener('message', async ({ data }) => {
    const call: Call = data;
    const response: Response = { id: call.id, data: undefined, ms: performance.now() };
    if (!environment.production) {
    }
    try {
      response.data = await workerClass.doWork(call.method, call.arguments);
      response.ms = performance.now() - response.ms;
      if (!environment.production) {
        const msg = `${call.method} ${Math.trunc(response.ms)}ms (args ${call.arguments})`;
        if (response.ms > 100) {
          console.warn(msg);
        } else {
          //console.info(msg);
        }
      }
    } catch (error) {
      postMessage({ error: `Call to ${call.method} failed: ${error}` });
    }
    postMessage(response);
  });
}

const calls: CallPromise[] = [];

export function registerWorker(worker: Worker) {
  worker.onmessage = ({ data }) => {
    const response: Response = data;
    if (!response.id) {
      if (response.error) {
        console.error('Worker Error: ' + response.error);
      } else {
        console.error(`Response id cannot be undefined: ` + response);
      }
    }

    const idx = calls.findIndex((p) => p.id == response.id);
    calls[idx].resolve(response.data);
    calls.splice(idx, 1);
  };
}

export function call(worker: Worker, method: DataMethods, ...args: any[]): Promise<any> {
  const id = uniqueId();
  let resolver;
  const callPromise: CallPromise = {
    id,
    resolve: resolver,
    promise: new Promise((resolve) => {
      resolver = resolve;
    }),
  };
  callPromise.resolve = resolver;

  calls.push(callPromise);
  if (!worker) {
    console.error('no worker defined');
  }
  worker.postMessage({ method, id, arguments: args });
  return callPromise.promise;
}

function uniqueId(): string {
  return Math.random().toString().replace('0.', '');
}
