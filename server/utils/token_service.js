const passport = require('passport');
const userService = require('../routes/user/userservice');

const verifyToken = (req, res, next) => {
  if(process.env.APP_AUTH_METHOD === 'azure_ad'){
    passport.authenticate('oauth-bearer', {session: false})(req, res, next);
  }else{
    let token = req.headers['x-access-token'] || req.headers['authorization'];
  userService.verifyToken(token).then(function(verified){
    if(verified != undefined) {
      req.user = JSON.parse(verified).verified;
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
}

module.exports = {
    verifyToken 
};