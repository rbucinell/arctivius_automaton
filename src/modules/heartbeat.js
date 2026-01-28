import { Module } from '../modules/module.js';
import * as Sentry from "@sentry/node";
import { error } from '../logger.js';

export class HeartBeat extends Module {

    static getNextExecute() { return 60 *1000; }

    static async execute(){
        try{
            await Sentry.captureCheckIn({
                monitorSlug: "heartbeat",
                status: "ok"
            });
        }catch(err){
            error(`Heartbeat Error: ${err.message}`);
        }        
        this.awaitExecution();
    }
}
