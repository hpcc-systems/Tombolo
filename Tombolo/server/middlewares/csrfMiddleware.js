const { doubleCsrf } = require("csrf-csrf");
const { v4: uuidv4 } = require("uuid");

const csrf = doubleCsrf({
  getSecret: () =>
    process.env.CSRF_SECRET ? process.env.CSRF_SECRET : uuidv4(),
  getTokenFromRequest: (req) => req.body.csrfToken,
  cookieName:
    process.env.NODE_ENV === "production"
      ? "__Host-prod.x-csrf-token"
      : "_csrf",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production", // Enable for HTTPS in production
    httpOnly: false, //client needs to be able to read and set the cookie
  },
});

module.exports = {
  doubleCsrfProtection: csrf.doubleCsrfProtection,
  generateToken: csrf.generateToken,
};
