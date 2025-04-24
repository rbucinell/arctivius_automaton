# Arctivius's Automaton

This is a discord bot for GW2 guild Wolves at War (PACK). This tool has a series of utility features to serve the officers of the guild.

![Avatar of Arctivius's Automaton](assets/arctivius_automaton.png)

## Features
* **Combat Participation**. Integrating with the games .evtc log files and associated 3rd party site https://dps.report/. This script will parse the logs to determine which members participated in the scheduled raits.
* **Communications Precence**. Peroidc checkin's during scheduled raid to confirm members are on ~~Teamspeak during the raids. This bot will telnet into TeamSpeak and report the rollcall in discord.~~ Guild now shifted to using Discord for voice, and this bot now grabs member lists in voice channel.
* **Guild Wars 2 API Integration**. Utilizing various endpoints to enhance various bot features, including guild vault tracker, icons, and other important data provided by the ame.
* **Google Sheets Database**. Member data is stored in google sheets as a nontechinal interface to data managemnt. Sheets are setup to store member data to tie their guildwars2 ID, discord ID, and teamspeak alias together.
* **MongoDB**. Now begining to store more data in mongo as a primary source and updating Google Sheets as a secondary.

### Commands
Introducing slash commands! These are commands that can be initiated by the bot:
* `/absence` - Notify PACK that you will have planned absences. It helps officers plan raids in advance
* `/apikey` view/set/clear - this will allow you to view and update your API key for @Arctivius's Automaton
* `/attendance <date>` - Generates attendance records for a given date [Permissions Pending]
* `/check-attendance` - Gives a summary of attendance for the month. Officers can look up another member.
* `/guildsync` - manual sync the guilds between gw2 in game and roles on discord. This assigns roles, updates docs, etc...
* `/lookup <member>` - lookup data on a guild member
* `/ping` - Pong
* `/random <inVoiceOnly>` - Select a random guild member! Optional to filter users only currently in voice.
* `/register` - register your discord username with your gw2id. We base everything on your gw2id, but associating your discord username can help us do more cool things. 
* `/rollcall` - view roll call for a given date [Permissions Pending]

### Automations
* Every evening the attendance script will run, pull the combat logs from wvw and update the attendance channel. This happens at 1am for the previous day, in order to give time for other members to post logs.
* During the scheduled raid times dictated by `src/wvw/shedule.json'` the bot will telnet into Teamspeak and collect user list from selected channels.
* Scheduled data collection from GuildWars2 API will collect guild vault logs
* Guild Sync occurs every 30mins to provide discord roles to all members in supported guilds
* users can register with bot associating gw2id to discord username

## Setup
### Requirements
* Node.js
* ~~Teamspeak 3~~
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
DISCORD_APP_ID=
DISCORD_PUBLIC_KEY=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
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
