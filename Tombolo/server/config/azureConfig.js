export default {
  identityMetadata: `https://login.microsoftonline.com/${process.env.TENENT_ID}/v2.0/.well-known/openid-configuration`,
  issuer: `https://login.microsoftonline.com/${process.env.TENENT_ID}/v2.0`,
  clientID: process.env.CLIENT_ID,
  audience: process.env.CLIENT_ID,
  validateIssuer: true,
  passReqToCallback: false,
  scope: ['access_as_user'],
  allowMultiAudiencesInToken: true, // Set to true if you accept access_token whose `aud` claim contains multiple values.
  // loggingLevel: INFO,
  // loggingNoPII: false,
};
