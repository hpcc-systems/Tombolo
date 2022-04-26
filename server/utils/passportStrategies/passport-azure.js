// Azure setup
const BearerStrategy = require('passport-azure-ad').BearerStrategy;
const azureConfig= require("../../config/azureConfig")


const bearerStrategy = new BearerStrategy(azureConfig, (token, done) => {      
      done(null, {}, token); // token fields will be available in req.authInfo for all protected routes
});

module.exports = bearerStrategy

