import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import  pino  from 'pino';
import { cwd } from 'process';
import { DiscordManager } from './discord/manager.js';
import { CrimsonBlackout } from './discord/ids.js';
import stripAnsi from 'strip-ansi';

export const LogLevel = Object.freeze({
    INFO : 'INFO' ,
    WARN : 'WARN' ,
    ERROR: 'ERROR' ,
    DEBUG: 'DEBUG'
});

export const LogOptions = Object.freeze({
    All:         { console: true,    log: true,  discord: true  },
    LocalOnly:   { console: true,    log: true,  discord: false },
    ConsoleOnly: { console: true,    log: false, discord: false },    
    RecordsOnly: { console: false,   log: true,  discord: true  },
    LogOnly:     { console: false,   log: true,  discord: false },
    RemoteOnly:  { console: false,   log: false,  discord: true },
    None:        { console: false,   log: true,  discord: false },
});

const getLogFilePath = () => {
    const logFile = path.join(cwd(),`logs/artivius_automaton.log`);
    if( !fs.existsSync('logs')) fs.mkdirSync('logs', 'w+')
    if( !fs.existsSync(logFile) )
    {
        let f = fs.openSync(logFile, 'a+');
        fs.closeSync(f);
    }
    return logFile;
};

let fileLogger = pino(
    { 
        timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"` 
    }, 
    pino.destination({ dest: getLogFilePath() }) 
);

const encase = ( val ) => `[${val}]`; 
const pad2 = ( value ) => value.toString().padStart(2,0);
const timestamp = () => {
    let d = new Date();
    return `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate()+1)}-`+
          `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

const formatLogLevel = (level) => {
    const encased = encase(level)
    switch(level) {
        case LogLevel.INFO: return chalk.bgCyan(encased + ' ');
        case LogLevel.WARN: return chalk.bgYellow(encased + ' ');
        case LogLevel.ERROR: return chalk.bgRed(encased);
        default: return chalk.black.bgWhite(encased);
    }
}

const colorize = ( content, color, bg = false ) => {
    const bgColor = `bg${color.charAt(0).toUpperCase() + color.substring(1)}`;
    return chalk[( bg ? bgColor : color)](content);
}
const hexColorize = ( content, code, bg = false ) => (bg ? chalk.hex(code ?? '#CCCCCC') : chalk.bgHex(code ?? '#CCCCCC'))(content);

export const format = {
    info: (content, bg = false ) => colorize(content, 'cyan', bg ),
    warn: (content, bg = false ) => colorize(content, 'yellow', bg ),
    error: (content, bg = false ) => colorize(content, 'red', bg ),
    debug: (content, bg = true ) => colorize(content, 'white', bg ),
    success: (content, bg = false ) => colorize(content, 'green', bg ),

    CACHE: ( bg = true ) => colorize(encase('CACHE'), 'gray', bg ),
    GET: (bg = false ) => colorize(encase('GET'), 'green', bg ),
    PUT: (bg = false ) => colorize(encase('PUT'), 'blue', bg ),
    DELETE: (bg = false ) => colorize(encase('DELETE'), 'red', bg ),
    POST: (bg = false ) => hexColorize( encase('POST'), '#F28C28', bg ),

    username: ( username ) => chalk.green(`(${username})`),
    channel: ( channel ) => `${chalk.blue(channel.parent?.name)} / ${chalk.blue('#'+channel.name)}`,
    command: (name, username = undefined) => `[${`${format.dim('Command')}|${format.highlight(name)}`}] ${username ? chalk.green(`(${username})`) : "" }`,
    module: (name) => `[${chalk.dim(name)}]`,
    dim: (content ) => chalk.dim(content),
    highlight: (content, bg =false ) => colorize( content, 'yellowBright', bg ),
    color: (color, content, bg = false ) => colorize(content, color, bg ),
    hex: (code, content, bg = false ) => hexColorize(content, code, bg ),
}

/**
 * @typedef {Object} LogOptions 
 * @property {boolean=} console
 * @property {boolean=} log
 * @property {boolean=} discord
 */

/** Logs a message with the specified level and content.
 *
 * @param {LogLevel} level - The log level (e.g. 'info', 'warn', 'error')
 * @param {string} content - The message to be logged
 * @param {LogOptions} options - Additional logging options
 */
const log = ( level, content, options ) => {
    if( options.console ){
        console.log( chalk.dim(encase(timestamp())), formatLogLevel(level), content );
    }
    if( options.log ){
        fileLogger[level.toLowerCase()](stripAnsi(content));
    }
    if( options.discord ){
        logToDiscord( content );
    }
}

/** Logs a message with the specified level and content.
 *
 * @param {LogLevel} level - The log level (e.g. 'info', 'warn', 'error')
 * @param {Object} server - The server object containing the server name
 * @param {Object} channel - The channel object containing the channel name
 * @param {string} username - The username of the user
 * @param {string} message - The message to be logged
 * @param {LogOptions} options - Additional logging options
 * @return {void}
 */
const dlog = (level, server, channel, username, message, options ) => { 
    const content = JSON.stringify({ server:server.name, channel:channel.name, username, message });
    if( options.console ){
        console.log( chalk.dim(encase(timestamp())), formatLogLevel(level), `${format.channel(channel)} ${format.username(username)} ${message}` );
    }
    if( options.log ){
        fileLogger[level.toLowerCase()](stripAnsi(content));
    }
    if( options.discord ) {
        logToDiscord( message );
    }
}

export const logToDiscord = async ( content ) => {
    try{
        DiscordManager.Client.channels.cache.get(CrimsonBlackout.CHANNEL_AUTOMATON_LOGS.description).send({content: stripAnsi(content)});
    }catch( err ){
        error( `Error writing logs to discord`, LogOptions.ConsoleOnly);
        error( err, LogOptions.LocalOnly );
    }
}

export const info  = ( content, options=LogOptions.LocalOnly) => log( LogLevel.INFO,  content, options );
export const warn  = ( content, options=LogOptions.LocalOnly) => log( LogLevel.WARN,  content, options );
export const error = ( content, options=LogOptions.LocalOnly) => log( LogLevel.ERROR, content, options );
export const debug = ( content, options=LogOptions.LocalOnly) => log( LogLevel.DEBUG, content, options );

/**
 * @param {Object} server - The server object containing the server name
 * @param {Object} channel - The channel object containing the channel name
 * @param {string} username - The username of the user
 * @param {string} message - The message to be logged
 * @param {LogOptions} options - Additional logging options
 * @return {void}
 */
export const dinfo  = ( server, channel, username, message, options ) => {
    if( options.console === undefined ){ options.console = true; }    
    dlog( LogLevel.INFO , server, channel, username, message, options );
}


