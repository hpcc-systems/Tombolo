var request = require('request');
var requestPromise = require('request-promise');

exports.getUserDetails = (req, usernames) => {
  return new Promise((resolve, reject) => {

    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }
    var authServiceUrl = process.env.AUTH_SERVICE_URL.replace('auth', 'users') + '/details?usernames='+usernames;
    let cookie = 'auth='+token;
    request.get({
      url: authServiceUrl,
      headers: {
        "content-type": "application/json",
        'Cookie': cookie
      }
    }, function(err, response, body) {
        resolve(JSON.parse(body));
        if (err) {
          reject(err);
        }
    });

  })
} 