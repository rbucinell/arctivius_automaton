export default class TeamSpeakChannel {
    
    constructor( cid=0, pid=0, channel_order=0, chanel_name='', channel_flag_are_subscribed=0, total_clients=0 ) {
        this.cid = cid;
        this.pid = pid;
        this.channel_order = channel_order;
        this.chanel_name = chanel_name;
        this.channel_flag_are_subscribed = channel_flag_are_subscribed;
        this.total_clients = total_clients;
    }

    /**
     * Parses channel data from a list of key-value-pairs
     * 
     * @param {string} channelString string containing channel data
     * @returns {TeamSpeakChannel} The client data
     */
    static parse( channelString )
    {
        let channel = new TeamSpeakChannel();
        let datum = channelString.split(' ');
        for( let d of datum )
        {
            let [ k, v ] = d.split('=');
            channel[k]=v.replace('\\s', ' ');
        }
        return channel;
    }

    /**
     * Parses a telnet message that conains a list of channels
     * 
     * @param {string} clientsString The telenet list
     * @returns {Array<TeamSpeakChannel>} a list of teamspeak channels connected to the server
     */
    static parseList( clientsString ) {
        return clientsString.split('|').map( c => TeamSpeakChannel.parse(c));
    }
}