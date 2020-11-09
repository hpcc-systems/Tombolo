const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
let mongoose = require('mongoose');
var request = require('request');
const dbUtil = require('../../utils/db');
let models = require('../../models');
let User = models.user;
const Sequelize = require('sequelize');
let UserApplication = models.user_application;
const authServiceUtil = require('../../utils/auth-service-utils');

async function authenticate(req, res, { username, password }) {
    var authServiceUrl = process.env.AUTH_SERVICE_URL + '/login';
    return new Promise(function(resolve, reject) {
        request.post({
          url: authServiceUrl,
          headers: {
            "content-type": "application/json",
          },
          json: {
            "username":username,
            "password":password
          }
        }, function(err, response, body) {          
          console.log(body);
          if (!response || response.statusCode != 200) {            
            reject(new Error(err));
          } else {
            resolve(body);
          }
      });
    });
}

async function verifyToken(req, res, next) {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if(token) {
        var authServiceUrl = process.env.AUTH_SERVICE_URL + '/verify';
        return new Promise(function(resolve, reject) {
            request.post({
              url: authServiceUrl,
              headers: {
                "content-type": "application/json",
                'Authorization': token
              }
            }, function(err, response, body) {
                resolve(body);
                if (err) {
                  reject(err);
                }
          });
        });
    }
}


async function validateToken(req, res, next) {
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  if (token) {
      if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
        console.log('token: '+token);
        return new Promise((resolve, reject) => {
            verifyToken(req, res, next).then((verifyTokenRes) => {
              if(verifyTokenRes) {
                  let verifyTokenResParsed = JSON.parse(verifyTokenRes);
                  if(verifyTokenResParsed && verifyTokenResParsed.verified) {
                      console.log("token verified");
                      resolve({
                          'userWithoutHash': {
                              'token': token
                          }
                      })
                  }
              } 
            })
            .catch(err => reject('Invalid Token')); 
        });
            
        /*var verified = await jwt.verify(token, dbUtil.secret);
        if(verified) {
          const user = await User.findOne({ where: {"username":req.body.username}, attributes: ['id', 'username', 'hash', 'firstName', 'lastName', 'role']});
          return generateToken(user);
        }*/
      }
  }
}

async function generateToken(user) {
    const { hash, ...userWithoutHash } = user.toJSON();
    const token = jwt.sign({ sub: user.id }, dbUtil.secret, {
         expiresIn: 604800 //1 week
      }
    );
    userWithoutHash.token = token;
    console.log('newsly generated token: '+token);
    return {
        userWithoutHash
    };
}


async function getAll() {
    return await User.findAll({attributes: { exclude: ["hash"] }, required: false });
}

const searchUser = (req, res, next) => {
  let searchTerm = req.query.searchTerm;
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }
  var authServiceUrl = process.env.AUTH_SERVICE_URL.replace('auth', 'users') + '/all';
  let cookie = 'auth='+token;
  return new Promise(function(resolve, reject) {
    request.get({
      url: authServiceUrl,
      headers: {
        "content-type": "application/json",
        'Cookie': cookie
      }
    }, function(err, response, body) {
      if(err) {
        console.log(err);
      }
      if (response.statusCode != 200) {
        reject(new Error(err));
      } else {
        let results = JSON.parse(body), searchResults = [];
        results.forEach((user) => {
          if(user.username.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0 || 
            user.firstName.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0 || 
            user.lastName.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0 ||
            user.email.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) 
          {

            searchResults.push({"text": user.username, "value": user.username});
          }
        });
        resolve(searchResults);
      }
    });
  });
}

async function getById(id) {
    return await User.findOne({where: {"id":id}, attributes: { exclude: ["hash"] }});
}

async function create(userParam) {
    // validate
    if (await User.findOne({ where: {"username": userParam.username}})) {
        throw 'Username "' + userParam.username + '" is already taken';
    }

    //const user = new User(userParam);

    // hash password
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
        delete userParam.password;
    }

    // save user
    await User.create(userParam).then(function() {

    });
}

async function update(id, userParam) {
    const user = await User.findOne({where: {"id":id}});

    // validate
    if (!user) throw 'User not found';
    if (user.username !== userParam.username && await User.findOne({ where: {"username": userParam.username}})) {
        throw 'Username "' + userParam.username + '" is already taken';
    }

    // hash password if it was entered
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
        delete userParam.password;
    }

    // copy userParam properties to user
    Object.assign(user, userParam);
    console.log(JSON.stringify(user));
    User.update(
    {
        "username": user.username,
        "firstName": user.firstName,
        "lastName": user.lastName,
        "hash": user.hash,
        "role": user.role
    },
    {where: {"id":id}}).then(function (rowsUpdated) {console.log("user updated: "+rowsUpdated.firstName)})
}

async function _delete(id) {
    await User.destroy({where: {"id":id}}, function(err) {});
}
async function GetuserListToShareApp(req, res, next) {
  return new Promise(function(resolve, reject) {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }
    var authServiceUrl = process.env.AUTH_SERVICE_URL.replace('auth', 'users') + '/all';
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
  });  
}

async function GetSharedAppUserList(req, res, next) {
  return new Promise((resolve, reject) => {
    UserApplication.findAll({where:{application_id: req.params.app_id}}).then(async (users) => {
      console.log(JSON.stringify(users));
      let usernames=[], userids=[];
      users.forEach((user) => {
        usernames.push(user.user_id);
      })

      let userdetails = await authServiceUtil.getUserDetails(req, usernames.join(','));
      resolve(userdetails)
    }).catch((err) => {
      reject(err);
    })
  });
}

async function changePassword(req, res, { username, password }) {
  var authServiceUrl = process.env.AUTH_SERVICE_URL.replace('auth', 'users') + '/changepwd';
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }
  let cookie = 'auth='+token;
  return new Promise(function(resolve, reject) {
    request.post({
      url: authServiceUrl,
      headers: {
        "content-type": "application/json",
        'Cookie': cookie
      },
      json: {
        "username":req.body.username,
        "oldpassword": req.body.oldpassword,
        "newpassword": req.body.newpassword,
        "confirmpassword": req.body.confirmnewpassword
      }
    }, function(err, response, body) {
      console.log(body)
      if (response.statusCode == 422) {
        reject(new Error(body.errors.concat(',')));
      }

      if (response.statusCode != 200) {
        reject(new Error(err));
      } else {
        resolve(body);
      }
    });
  });
}

async function registerUser(req, res) {
  var authServiceUrl = process.env.AUTH_SERVICE_URL + '/registerUser';
  return new Promise(function(resolve, reject) {
    request.post({
      url: authServiceUrl,
      headers: {
        "content-type": "application/json"
      },
      json: {
        "firstName":req.body.firstName,
        "lastName":req.body.lastName,
        "email": req.body.email,
        "username": req.body.username,
        "password": req.body.password,
        "confirmpassword": req.body.confirmnewpassword,
        "role": req.body.role,
        "applicationId": process.env.AUTHSERVICE_TOMBOLO_APP_ID
      }
    }, function(err, response, body) {
      if (response.statusCode == 422) {
        reject(new Error(body.errors.concat(',')));
      }
      if (response.statusCode != 200 && response.statusCode != 201 && response.statusCode && 202) {
        reject(body);
      } else {
        resolve({'statusCode': response.statusCode, 'message': body});
      }
    });
  });
}

async function forgotPassword(req, res) {
  var authServiceUrl = process.env.AUTH_SERVICE_URL + '/forgotPassword';
  return new Promise(function(resolve, reject) {
    request.post({
      url: authServiceUrl,
      headers: {
        "content-type": "application/json"
      },
      json: {
        "username": req.body.username,
        "applicationId": process.env.AUTHSERVICE_TOMBOLO_APP_ID,
        "resetUrl": process.env.TOMBOLO_PASSWORD_RESET_URL
      }
    }, function(err, response, body) {
      if (response.statusCode == 422) {
        reject(new Error(body.errors.concat(',')));
      }
      if (response.statusCode != 200) {
        reject(body);
      } else {
        resolve({'statusCode': response.statusCode, 'message': body});
      }
    });
  });
}

async function resetPassword(req, res) {
  var authServiceUrl = process.env.AUTH_SERVICE_URL + '/resetPassword';
  return new Promise(function(resolve, reject) {
    request.post({
      url: authServiceUrl,
      headers: {
        "content-type": "application/json"
      },
      json: {
        "id": req.body.id,
        "password": req.body.password
      }
    }, function(err, response, body) {
      if (response.statusCode == 422) {
        reject(new Error(body.errors.concat(',')));
      }
      if (response.statusCode != 200) {
        reject(body);
      } else {        
        resolve({'statusCode': response.statusCode, 'message': body});
      }
    });
  });
}

module.exports = {
  authenticate,
  getAll,
  getById,
  create,
  update,
  verifyToken,
  delete: _delete,
  validateToken,
  GetuserListToShareApp,
  GetSharedAppUserList,
  changePassword,
  searchUser,
  registerUser,
  forgotPassword,
  resetPassword
};