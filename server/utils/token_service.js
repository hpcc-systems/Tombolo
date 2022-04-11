const jwt = require('jsonwebtoken');
const userService = require('../routes/user/userservice');

module.exports = {
    verifyToken
};
function verifyToken(req, res, next)
{
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