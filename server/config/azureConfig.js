const options = {
    identityMetadata: `https://${process.env.AUTHORITY}/${process.env.TENENT_ID}/${ process.env.MSAL_VERSION}/${process.env.DISCOVERY}`,
    issuer: `https://${process.env.AUTHORITY}/${process.env.TENENT_ID}/${process.env.MSAL_VERSION}`,
    clientID: process.env.CLIENT_ID,
    audience: process.env.AUDIENCE,
    validateIssuer: true,
    passReqToCallback: false,
    loggingLevel: process.env.LOGGING_LEVEL,
    // scope: EXPOSED_SCOPES,
    loggingNoPII: false,
    // Optional -> Default value is false.
    // Set to true if you accept access_token whose `aud` claim contains multiple values.
    allowMultiAudiencesInToken: true,
    scope: ['access_as_user'],

  };

  module.exports = {
      options
  }