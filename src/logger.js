import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import  pino  from 'pino';
import { cwd } from 'process';

const LOG_FILE = path.join(cwd(),'logs/artivius_automaton.log');
if( !fs.existsSync('logs')) fs.mkdirSync('logs', 'w+')
if( !fs.existsSync(LOG_FILE) )
{
    let f = fs.openSync(LOG_FILE, 'a+');
    fs.closeSync(f);
}


const logger = pino( pino.destination({
    dest: LOG_FILE
}))

const encase = ( val ) => `[${val}]`; 
export const LOG_LEVEL = Object.freeze({
    INFO : 'INFO' ,
    WARN : 'WARN' ,
    ERROR: 'ERROR' ,
    DEBUG: 'DEBUG'
});

const formatLogLevel = (level) => {
    const encased = encase(level)
    switch(level) {
        case LOG_LEVEL.INFO: return chalk.bgCyan(encased);
        case LOG_LEVEL.WARN: return chalk.bgYellow(encased);
        case LOG_LEVEL.ERROR: return chalk.bgRed(encased);
        default: return chalk.bgWhite(encased);
    }
}

const pad2 = ( value ) => value.toString().padStart(2,0);

const timestamp = () => {
    let d = new Date();
    return `${d.getFullYear()}${pad2(d.getMonth())}${pad2(d.getDate())}-`+
          `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/**
 * 
 * @param {LOG_LEVEL} level 
 * @param {string} content 
 */
export const log = ( level, content ) => {
    console.log( chalk.dim(encase(timestamp())), formatLogLevel(level), content );
};

export const dlog = ( level, server, channel, username, message ) => {
    let content = `${chalk.blue(encase(server))} ${chalk.blue('#'+channel)} ${chalk.green(`(${username})`)} ${message}`; 
    log( level, content );
};

export const dinfo  = ( server, channel, username, message, saveToLog=true ) => { 
    if( saveToLog ) 
        logger.info ({ server: server, channel: channel, username: username, message: message }); 
    dlog( LOG_LEVEL.INFO , server, channel, username, message ); 
}

export const dwarn  = ( server, channel, username, message, saveToLog=true ) => { 
    if( saveToLog ) 
        logger.warn ({ server: server, channel: channel, username: username, message: message }); 
    dlog( LOG_LEVEL.WARN , server, channel, username, message ); 
}

export const derror = ( server, channel, username, message, saveToLog=true ) => { 
    if( saveToLog ) 
        logger.error({ server: server, channel: channel, username: username, message: message }); 
    dlog(  LOG_LEVEL.ERROR, server, channel, username, message); 
} 

export const ddebug = ( server, channel, username, message, saveToLog=true ) => { 
    if( saveToLog ) 
        logger.debug({ server: server, channel: channel, username: username, message: message }); 
    dlog(  LOG_LEVEL.DEBUG, server, channel, username, message); 
} 

export const info  = ( content, saveToLog=true ) =>{ if( saveToLog ){ logger.info (content); } log( LOG_LEVEL.INFO , content ); }
export const warn  = ( content, saveToLog=true ) =>{ if( saveToLog ){ logger.warn (content); } log( LOG_LEVEL.WARN , content ); }
export const error = ( content, saveToLog=true ) =>{ if( saveToLog ){ logger.error(content); } log( LOG_LEVEL.ERROR, content ); } 
export const debug = ( content, saveToLog=true ) =>{ if( saveToLog ){ logger.debug(content); } log( LOG_LEVEL.DEBUG, content ); } 

