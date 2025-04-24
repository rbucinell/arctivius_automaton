import cron from 'node-cron';

/*
"schedule": [
        { "day": 0, "short": "Su", "time": { "h": 20, "m" : 30 }, "duration": 2, "packRun": true },
        { "day": 1, "short": "M",  "time": { "h": 20, "m" : 30 }, "duration": 2, "packRun": true },
        { "day": 3, "short": "W",  "time": { "h": 20, "m" : 30 }, "duration": 2, "packRun": true },
        { "day": 5, "short": "F",  "time": { "h": 22, "m" : 0  }, "duration": 2, "packRun": false },
        { "day": 6, "short": "Sa", "time": { "h": 7, "m" : 0 },   "duration": 2, "packRun": false }
    ],
*/


function schecheduleToCron( schedule ) {
    const dayOfWeek = schedule.day;
    const hour = schedule.time.h;
    const minute = schedule.time.m;
    const cronExpression = `${minute} ${hour} * * ${dayOfWeek}`;
    return cronExpression;
}

let task = cron.schedule('1,2,4,5 * * * * *', (e ) => {
    console.log(e);
    debugger;
    console.log( 'now',task.now() );
    console.log('running every minute 1, 2, 4 and 5', Date.now().toString());
    task.stop();
}, {
    timezone: 'America/New_York'
});

console.log( task );
