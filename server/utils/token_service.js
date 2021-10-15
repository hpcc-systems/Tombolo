require('dotenv').config();
// const jwt = require('jsonwebtoken');
const userService = require('../routes/user/userservice');
const passport = require('passport');
const BearerStrategy = require('passport-azure-ad').BearerStrategy;



module.exports = {
    verifyToken,
    // verifyAzureToken
};


// function verifyToken(req, res, next)
// {
//   let token = req.headers['x-access-token'] || req.headers['authorization'];
//   userService.verifyToken(token).then(function(verified){
//     if(verified != undefined) {
//       next()
//     } else {
//       res.status(401).json({message: "Un-Authorized."})
//     }
//   })
//   .catch((err) =>
//   {
//     console.log('verify err: '+err);
//     res.status(401).json({message: "Invalid auth token provided."})
//   })
// }


// this is the API scope you've exposed during app registration
const EXPOSED_SCOPES = [ 'access_as_user' ]

const options = {
  identityMetadata: `https://${process.env.AUTHORITY}/${process.env.TENENT_ID}/${ process.env.MSAL_VERSION}/${process.env.DISCOVERY}`,
  issuer: `https://${process.env.AUTHORITY}/${process.env.TENENT_ID}/${process.env.MSAL_VERSION}`,
  clientID: process.env.CLIENT_ID,
  audience: process.env.AUDIENCE,
  validateIssuer: process.env.VALIDATE_ISSUER,
  passReqToCallback: process.env.PASS_REQ_TO_CALLBACK,
  loggingLevel: process.env.LOGGING_LEVEL,
  scope: EXPOSED_SCOPES
};


const bearerStrategy = new BearerStrategy(options, (token, done) => {
  // Send user info using the second argument
  console.log("<<<<<<<<<<<<<<<<<<<<< Bearer strategy")
  done(null, {}, token);
}
);

passport.use(bearerStrategy);

// function verifyToken(req, res, next){
//   let token = req.headers['x-access-token'] || req.headers['authorization'];
//   console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< verify token", req.headers)
//   passport.authenticate('oauth-bearer', {session: false}),
//   (req, res) => {
//       console.log('Validated claimsssssssssssss: ', req.authInfo);
//       console.log("Received call from Client<<<<<<<<<<<<<<< ")
//       // Service relies on the name claim.  
//       res.status(200).json({
//           'name': req.authInfo['name'],
//           'issued-by': req.authInfo['iss'],
//           'issued-for': req.authInfo['aud'],
//           'scope': req.authInfo['scp']
//       });
     
//   }
 

//   // next();
// }

function verifyToken(req,res,next){
  console.log("<<<<<<<<<<<<  111111111111111111111111111111111111111111111111111111111111")
  // return  passport.authenticate('oauth-bearer', {session: false})
 
    next();
}