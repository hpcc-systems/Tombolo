const { doubleCsrf } = require("csrf-csrf");

const csrf = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET, // THIS IS A NAIVE DOUBLE CSRF IMPLEMENTATION, NEED TO IMPLEMENT A ROTATING KEY OF SOME KIND OR USER IDENTIFYING KEY
  getTokenFromRequest: (req) => req.headers["x-csrf-token"], // A function that returns the token from the request
  cookieName:
    process.env.NODE_ENV === "production"
      ? "__Host-prod.x-csrf-token"
      : "x-csrf-token",
  cookieOptions: {
    sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax",
    secure: process.env.NODE_ENV === "production", // Enable for HTTPS in production
    httpOnly: false, //client needs to be able to read and set the cookie
  },
});

module.exports = {
  doubleCsrfProtection: csrf.doubleCsrfProtection,
  generateToken: csrf.generateToken,
};
