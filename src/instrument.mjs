import * as Sentry from "@sentry/node";

Sentry.init({
    dsn: "https://aa28f7779a5bf06bbc3573216b1d82ff@o4509760387809280.ingest.us.sentry.io/4509760389316608",
    sendDefaultPii: true,
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    enableLogs: true
})