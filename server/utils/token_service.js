const passport = require('passport');
const userService = require('../routes/user/userservice');


async function verifyAuthServiceToken(req, res, next)
{
  let token = req.headers['x-access-token'] || req.headers['authorization'];
    userService.verifyToken(token).then(function(verified){
      if(verified != undefined) {
        next()
      } else {
        res.status(401).json({message: "Un-Authorized."})
      }
    })
    .catch((err) =>
    {
      console.log('verify err: '+err);
      res.status(401).json({message: "Invalid auth token provided."})
    }) 
}

//azure token validation
const verifyAzureToken =  passport.authenticate('oauth-bearer', {session: false});

module.exports = {
  verifyUserToken : process.env.APP_AUTH_METHOD === 'azure_ad' ? verifyAzureToken : verifyAuthServiceToken,
};





