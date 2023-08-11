import { DataMethods } from "./models";

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
    data: any;
}

export interface WorkerClass {
    doWork(method: string, ...args: any[]): Promise<any>;
}

export function registerWorkerClass(workerClass: WorkerClass) {
    addEventListener('message', async ({ data }) => {
        const call: Call = data;
        const response: Response = { id: call.id, data: undefined };
        console.time(call.method);
        response.data = await workerClass.doWork(call.method, call.arguments);
        console.timeEnd(call.method);
        postMessage(response);
    });
}

const calls: CallPromise[] = [];

export function registerWorker(worker: Worker) {
    worker.onmessage = ({ data }) => {
        const response: Response = data;
        if (!response.id) {
            console.error(`Response id cannot be undefined`);
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
        promise: new Promise((resolve, reject) => {
            resolver = resolve;
        })
    };
    callPromise.resolve = resolver;


    calls.push(callPromise);
    worker.postMessage({ method, id, arguments: args });
    return callPromise.promise;
}

function uniqueId(): string {
    return Math.random().toString();
}

