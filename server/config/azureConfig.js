module.exports = {
    identityMetadata: `https://${process.env.AUTHORITY}/${process.env.TENENT_ID}/${ process.env.MSAL_VERSION}/${process.env.DISCOVERY}`,
    issuer: `https://${process.env.AUTHORITY}/${process.env.TENENT_ID}/${process.env.MSAL_VERSION}`,
    clientID: process.env.CLIENT_ID,
    audience: process.env.AUDIENCE,
    validateIssuer: true,
    passReqToCallback: false,
    scope: ['access_as_user'],
    allowMultiAudiencesInToken: true,    // Set to true if you accept access_token whose `aud` claim contains multiple values.
    // loggingLevel: process.env.LOGGING_LEVEL,
    // loggingNoPII: false,
  };