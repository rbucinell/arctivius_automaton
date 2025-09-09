import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });
const uri = process.env.MONGODB_CONN_STR;

const DATABASE = 'arctivius_automaton';

export const db = new MongoClient( uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
        appName: 'Arctivius\'s Automaton'
    }
}).db(DATABASE);

export const guilds = db.collection('guilds');
export const members = db.collection('members');
export const registrations = db.collection('registrations');
export const attendance = db.collection('attendance');
export const discordGuildSettings = db.collection('discordguildsettings');

