export function getSentrySpanFromCommand( commandName, interaction ){
    return {
        name: `${commandName}-command`,
        attributes: {
            command: commandName,
            userId: interaction.user.id,
            username: interaction.user.username,
            options: interaction.options ? JSON.stringify(interaction.options.data) : null
        }
    }
}

/**
 * Starts a Sentry span with the given operation and name. If the
 * provided function throws an exception, it will be caught and
 * sent to Sentry. Otherwise, the result of the function will be
 * returned.
 * 
 * @param {String} op The operation to report to Sentry
 * @param {String} name The name of the transaction to report to Sentry
 * @param {Function} fn The function to execute inside the span
 * @param {...*} args The arguments to pass to the function
 */
export function sentrySpan( op, name, fn, ...args ){
  Sentry.startSpan({ op, name}, () => {
    try {
      fn(...args);
    } catch (e) {
      Sentry.captureException(e);
    }
  });
}
