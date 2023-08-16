/// <reference lib="webworker" />

import { DataManager } from "./data-manager";
import { registerWorkerClass } from './worker-interface';


// Registers the class that does the work in the web worker
registerWorkerClass(new DataManager());