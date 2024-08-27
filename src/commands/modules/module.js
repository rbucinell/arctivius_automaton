import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
dayjs.extend(duration);
import { settings } from '../../util.js';
import { info, warn, error, format, LogOptions } from '../../logger.js';

export class Module {

    static get Name() { return this.prototype.constructor.name; }

    static initialize(...args) {
        this.info(`Module Initialized`, LogOptions.ConsoleOnly);
        this.awaitExecution(args);
    }

    static getNextExecute() {
        return settings.defaultTimeout ?? 0;
    }

    static async execute( ...args) {
        info( `Executing ${format.module(this.Name)}` );
    }

    /** Awaits the execution of the module by scheduling a timeout.
     *
     * @return {void} No return value.
     */
    static awaitExecution( ...args) {
        const next = this.getNextExecute();
        const later = dayjs().add(next, 'milliseconds');
        this.info( `Next exectution in ${dayjs.duration(next, 'milliseconds').humanize()} [${later.format('dddd, MMMM D, YYYY - HH:mm')}]`, LogOptions.LocalOnly );
        setTimeout( this.execute.bind(this), next, args );
    }

    /** Logs an informational message with the module's name.
     *
     * @param {string} msg - The message to be logged.
     * @param {LogOptions} options - The logging options.
     */
    static info(msg, options = LogOptions.ConsoleOnly ) {
        info( `${format.module(this.Name)} ${msg}`, options );
    }

    /** Logs a warning message with the module's name.
     *
     * @param {string} msg - The message to be logged.
     * @param {LogOptions} options - The logging options.
     */
    static warn(msg, options = LogOptions.ConsoleOnly ) {
        warn( `${format.module(this.Name)} ${msg}`, options );
    }

    /** Logs an error message with the module's name.
     *
     * @param {string} msg - The message to be logged.
     * @param {LogOptions} options - The logging options.
     */
    static error(msg, options = LogOptions.ConsoleOnly ) {
        error( `${format.module(this.Name)} ${msg}`, options );
    }
}
