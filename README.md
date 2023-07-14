# Arctivius's Automaton

This is a discord bot for GW2 guild Wolves at War (PACK). Thiis tool has a series of utility features to serve the officers of the guild.

![Avatar of Arctivius's Automaton](assets/arctivius_automaton.png)

## Setup
### Requirements
* Node.js
* Teamspeak 3
* Discord

### Installation
```bash
git clone https://github.com/rbucinell/arctivius_automaton.git
cd arctivius_automaton
npm install
```

Create a `.env` file in the root foder (or copy and rename`sample.env`). Fill out the required data points:

```config
GW2_API_TOKEN=
GW2_API_TOKEN_SWIFTSTRIKER=
GW2_API_TOKEN_PYCACHU=
DISCORD_APP_ID=
DISCORD_PUBLIC_KEY=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
DPS_REPORT_USER_TOKEN=
ELITE_INSIGHTS_PARSER_EXE=
REAL_PROGRAMMER=
TEAMPSEAK_TELNET_API=
GOOGLE_SECRT_KEY=
```

The google secret key is JSON object collapsed onto one line in the following format:
```json
{
    "type": "<account_type>",
    "project_id": "<project_id>",
    "private_key_id": "<private_key>",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...xyz...\n-----END PRIVATE KEY-----\n",
    "client_email": "<client_name>@<project_id>.iam.<account_type>.com",
    "client_id": "<client_id>",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/<client_name>%40<project_id>.iam.<account_type>.com",
    "universe_domain": "googleapis.com"
}
```

## Usage
To start the server:
```
node .
```

### Automations
* Every evening the attendence script will run, pull the combat logs from wvw and update the attendence channel. This happens at 1am for the previous day, in order to give time for other members to post logs.
* Every evening from 8p-12am the attendence script will poll Teamspeak3 client every 15mins to get roll call. This will open Teamspeak3 client, create a telnet connection, get users and disconnect

### Commands
Introducing slash commands! These are commands that can be initiated by the bot:

* `/attendence <date>` - This will get the wvw log attendence and update the channel based on the date given
* `/lookup <member>` - Search the guild database for a user, will return data if found
* `/lottolearn` - Picks a random guild member and specifies what they play and what they are willing to learn. 
