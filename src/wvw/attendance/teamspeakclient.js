export default class TeamSpeakClient {
    
    constructor( clid=0, cid=0, client_database_id=0, client_nickname='', client_type=0 ) {
        this.clid = clid;
        this.cid = cid;
        this.client_database_id = client_database_id;
        this.client_nickname = client_nickname;
        this.client_type = client_type;
    }

    /**
     * Parses client data from a list of key-value-pairs
     * 
     * @param {string} clientString client string of kvp 
     * @returns {TeamSpeakClient} The client data
     */
    static parse( clientString ) {
        let client = new TeamSpeakClient();
        let datum = clientString.split(' ');
        for( let d of datum )
        {
            let [ k, v ] = d.split('=');
            client[k]=v.replaceAll('\\s',' ').replaceAll('\\','');
        }
        return client;
    }

    /**
     * Parses a telnet message that conains a list of clients
     * 
     * @param {string} clientsString The telenet list
     * @returns {Array<TeamSpeakClient>} a list of teamspeak clients connected to the server
     */
    static parseList( clientsString ) {
        return clientsString.split('|').map( c => TeamSpeakClient.parse(c));
    }
}