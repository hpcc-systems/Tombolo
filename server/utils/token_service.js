const jwt = require('jsonwebtoken');
const userService = require('../routes/user/userservice');

module.exports = {
    verifyToken
};
function verifyToken(req, res, next)
{
  userService.verifyToken(req, res, next).then(function(verified){
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