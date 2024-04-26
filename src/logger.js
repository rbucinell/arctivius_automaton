import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import  pino  from 'pino';
import { cwd } from 'process';

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
 * Write out log event to console
 * 
 * @param {LOG_LEVEL} level 
 * @param {string} content 
 */
export const log = ( level, content ) => {
    console.log( chalk.dim(encase(timestamp())), formatLogLevel(level), content );
};

export const info  = ( content, saveToLog=true ) =>{ if( saveToLog ){ fileLogger.info (content); } log( LOG_LEVEL.INFO , content ); }
export const warn  = ( content, saveToLog=true ) =>{ if( saveToLog ){ fileLogger.warn (content); } log( LOG_LEVEL.WARN , content ); }
export const error = ( content, saveToLog=true ) =>{ if( saveToLog ){ fileLogger.error(content); } log( LOG_LEVEL.ERROR, content ); } 
export const debug = ( content, saveToLog=true ) =>{ if( saveToLog ){ fileLogger.debug(content); } log( LOG_LEVEL.DEBUG, content ); } 


function colorize ( content, color, bg = false ){
    const bgColor = `bg${color.charAt(0).toUpperCase() + color.substring(1)}`;
    return chalk[( bg ? bgColor : color)](content);
}

function hexColorize( content, code, bg = false ){
    return (bg ? chalk.hex(code) : chalk.bgHex(code))(content)
}

export const format = {
    info: (content, bg = false ) => colorize(content, 'cyan', bg ),
    warn: (content, bg = false ) => colorize(content, 'yellow', bg ),
    error: (content, bg = false ) => colorize(content, 'red', bg ),
    debug: (content, bg = false ) => colorize(content, 'white', bg ),

    GET: (bg = false ) => colorize(encase('GET'), 'green', bg ),
    PUT: (bg = false ) => colorize(encase('PUT'), 'blue', bg ),
    DELETE: (bg = false ) => colorize(encase('DELETE'), 'cyan', bg ),
    POST: (bg = false ) => hexColorize( encase('POST'), '#F28C28', bg ),

    highlight: (content, bg =false ) => colorize( content, 'yellowBright', bg ),
    color: (color, content, bg = false ) => colorize(content, color, bg ),
    hex: (code, content, bg = false ) => hexColorize( content, code, bg ),
}


export const discordLog = (level, server, channel, username, message, saveToLog = true ) => {
    const content = JSON.stringify({ server, channel, username, message });
    if( saveToLog ){
        fileLogger[level.toLowerCase()](content);
    }
    log( level, `${chalk.blue(encase(server))} ${chalk.blue('#'+channel)} ${chalk.green(`(${username})`)} ${message}`)
}

export const dinfo  = ( server, channel, username, message, saveToLog=true ) => { 
    discordLog( LOG_LEVEL.INFO , server, channel, username, message, saveToLog ); 
}

export const dwarn  = ( server, channel, username, message, saveToLog=true ) => { 
    discordLog( LOG_LEVEL.WARN , server, channel, username, message, saveToLog ); 
}

export const derror = ( server, channel, username, message, saveToLog=true ) => {
    discordLog( LOG_LEVEL.ERROR, server, channel, username, message, saveToLog); 
} 

export const ddebug = ( server, channel, username, message, saveToLog=true ) => { 
    discordLog( LOG_LEVEL.DEBUG, server, channel, username, message, saveToLog); 
} 


