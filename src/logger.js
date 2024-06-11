import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import  pino  from 'pino';
import { cwd } from 'process';
import { DiscordManager } from './discord/manager.js';
import { CrimsonBlackout } from './discord/ids.js';
import stripAnsi from 'strip-ansi';

export const LOG_LEVEL = Object.freeze({
    INFO : 'INFO' ,
    WARN : 'WARN' ,
    ERROR: 'ERROR' ,
    DEBUG: 'DEBUG'
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
    return `${d.getFullYear()}${pad2(d.getMonth())}${pad2(d.getDate()+1)}-`+
          `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

const formatLogLevel = (level) => {
    const encased = encase(level)
    switch(level) {
        case LOG_LEVEL.INFO: return chalk.bgCyan(encased);
        case LOG_LEVEL.WARN: return chalk.bgYellow(encased);
        case LOG_LEVEL.ERROR: return chalk.bgRed(encased);
        default: return chalk.black.bgWhite(encased);
    }
}

const colorize = ( content, color, bg = false ) => {
    const bgColor = `bg${color.charAt(0).toUpperCase() + color.substring(1)}`;
    return chalk[( bg ? bgColor : color)](content);
}
const hexColorize = ( content, code, bg = false ) => (bg ? chalk.hex(code) : chalk.bgHex(code))(content);

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
    hex: (code, content, bg = false ) => hexColorize( content, code, bg ),
}

/**
 * Write out log event to console
 * 
 * @param {LOG_LEVEL} level 
 * @param {string} content 
 */
const log = ( level, content, saveToLog, writeToDiscord ) => {
    console.log( chalk.dim(encase(timestamp())), formatLogLevel(level), content );
    if( saveToLog ){ fileLogger.info(content); }
    if( writeToDiscord){ logToDiscord(content); }
};

const dlog = (level, server, channel, username, message, saveToLog = true, writeToDiscord = false ) => {
    const content = JSON.stringify({ server:server.name, channel:channel.name, username, message });
    if( saveToLog ){
        fileLogger[level.toLowerCase()](content);
    }
    log( level, `${format.channel(channel)} ${format.username(username)} ${message}`);
    if( writeToDiscord ) {
        logToDiscord( message );
    }
}

export const logToDiscord = async ( content ) => {
    try{
        DiscordManager.Client.channels.cache.get(CrimsonBlackout.CHANNEL_AUTOMATON_LOGS.description).send({content: stripAnsi(content)});
    }catch( err ){
        error( `Error writing logs to discord`, true)
        error( err, true )
    }
}

export const info  = ( content, saveToLog=true, writeToDiscord=false ) => log( LOG_LEVEL.INFO, content, saveToLog, writeToDiscord );
export const warn  = ( content, saveToLog=true, writeToDiscord=false ) => log( LOG_LEVEL.WARN, content, saveToLog, writeToDiscord );
export const error = ( content, saveToLog=true, writeToDiscord=false ) => log( LOG_LEVEL.ERROR, content, saveToLog, writeToDiscord );
export const debug = ( content, saveToLog=true, writeToDiscord=false ) => log( LOG_LEVEL.DEBUG, content, saveToLog, writeToDiscord ); 

export const dinfo  = ( server, channel, username, message, saveToLog=true, writeToDiscord=false ) => dlog( LOG_LEVEL.INFO , server, channel, username, message, saveToLog, writeToDiscord ); 
export const dwarn  = ( server, channel, username, message, saveToLog=true, writeToDiscord=false ) => dlog( LOG_LEVEL.WARN , server, channel, username, message, saveToLog, writeToDiscord );
export const derror = ( server, channel, username, message, saveToLog=true, writeToDiscord=false ) => dlog( LOG_LEVEL.ERROR, server, channel, username, message, saveToLog, writeToDiscord );
export const ddebug = ( server, channel, username, message, saveToLog=true, writeToDiscord=false ) => dlog( LOG_LEVEL.DEBUG, server, channel, username, message, saveToLog, writeToDiscord ); 



