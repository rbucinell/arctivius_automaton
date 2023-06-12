
const urlRegex = /([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/\?\=\&\#\.]?[\w-]+)*\/?/gm;


export const processDiscordMessage = async ( message ) => {
    let matches = message.content.match(urlRegex);
    if( matches.length === 0 )
    {
         return [];
    }
    let startDate = new Date();
    let allPlayers = [];
    for( let url of matches )
    {
        if( url.indexOf('wvw.report') === -1 ) continue;
        let [date,players,data] = await getMetaData(url);
        if( date < startDate ){
            startDate = date;
        }
        Object.values(players).forEach(player => {
            if( !allPlayers.find( allp => allp.display_name === player.display_name ) )
            {
                allPlayers.push( player );
            }
        });
    }
    return reportAttendence( message, startDate, allPlayers );
};

const getMetaData = async ( reportURL ) => {
    const reportMetadataURL = `https://dps.report/getUploadMetadata?permalink=${reportURL}`;
    let jsonData = await fetch( reportMetadataURL ).then( response => response.json() );
    let players = jsonData.players;
    return [jsonData.encounterTime, players, jsonData];
}

const reportAttendence = ( message, date, players ) => {
    let longestAcct = Math.max(...players.map(a => a.display_name.length));
    players.sort( (a, b) => a.display_name.toLowerCase().localeCompare(b.display_name.toLowerCase()));

    let sendMessage =`According to this message ($<{message.url}>), attendence for <t:${date}> is:\n\`\`\`\n`;
    let messagesToSend = [];
    players.forEach( (player,i) =>{
        const index = i+1;
        const acct = player.display_name;
        sendMessage +=`${index<10?`0${index}`:index}. ${acct}${' '.repeat(longestAcct-acct.length)} | ${player.character_name}\n`;
        if( sendMessage.length > 1900 )
        {
            sendMessage += '```';
            messagesToSend.push( sendMessage );
            sendMessage = '```\n';
        }
    });
    sendMessage += '```';
    messagesToSend.push( sendMessage );
    return messagesToSend;
}
