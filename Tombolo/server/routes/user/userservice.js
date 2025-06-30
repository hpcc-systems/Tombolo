const bcrypt = require('bcryptjs');
let models = require('../../models');
let User = models.user;
const axios = require('axios');
const logger = require('../../config/logger');

async function authenticate(req, res, { username, password }) {
  var authServiceUrl = process.env.AUTH_SERVICE_URL + '/login';
  try {
    const response = await axios.post(
      authServiceUrl,
      {
        username,
        password,
        clientId: process.env.AUTHSERVICE_TOMBOLO_CLIENT_ID,
      },
      {
        headers: {
          'content-type': 'application/json',
        },
      }
    );

    if (response.status !== 200) {
      throw new Error('Authentication failed');
    }

    return response.data;
  } catch (err) {
    if (!err.response) {
      logger.error(
        'Cannot reach AuthService. Please check if AuthService is running and is accessible from Tombolo...'
      );
    } else {
      logger.error('Login failed!');
    }
    throw err;
  }
}

async function verifyToken(token) {
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const authServiceUrl = `${process.env.AUTH_SERVICE_URL}/verify`;
    const response = await axios.post(authServiceUrl, null, {
      headers: {
        'content-type': 'application/json',
        Authorization: token,
      },
    });

    if (response.status !== 200) {
      throw response.data;
    }

    return response.data;
  } catch (err) {
    throw err;
  }
}

async function validateToken(req, res) {
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  if (token) {
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
      logger.verbose('token: ' + token);

      return new Promise((resolve, reject) => {
        verifyToken(token)
          .then(verifyTokenRes => {
            if (verifyTokenRes) {
              let verifyTokenResParsed = JSON.parse(verifyTokenRes);
              if (verifyTokenResParsed && verifyTokenResParsed.verified) {
                resolve({
                  userWithoutHash: {
                    token: token,
                  },
                });
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

async function getAll() {
  return await User.findAll({
    attributes: { exclude: ['hash'] },
    required: false,
  });
}

const searchUser = async (req, res, next) => {
  let searchTerm = req.query.searchTerm;
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }
  var authServiceUrl =
    process.env.AUTH_SERVICE_URL.replace('auth', 'users') + '/all';
  let cookie = 'auth=' + token;
  try {
    const response = await axios.get(authServiceUrl, {
      headers: {
        'content-type': 'application/json',
        Cookie: cookie,
      },
    });

    if (response.status !== 200) {
      throw new Error('Request failed');
    }

    const results = response.data;
    const searchResults = results
      .filter(
        user =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(user => ({
        text: `${user.firstName} ${user.lastName}`,
        value: user.username,
        email: user.email,
        id: user.id,
      }));

    return searchResults;
  } catch (err) {
    logger.error(err);
    throw err;
  }
};

async function getById(id) {
  return await User.findOne({
    where: { id: id },
    attributes: { exclude: ['hash'] },
  });
}

async function create(userParam) {
  // validate
  if (await User.findOne({ where: { username: userParam.username } })) {
    throw 'Username "' + userParam.username + '" is already taken';
  }

  //const user = new User(userParam);

  // hash password
  if (userParam.password) {
    userParam.hash = bcrypt.hashSync(userParam.password, 10);
    delete userParam.password;
  }

  // save user
  await User.create(userParam).then(function () {});
}

async function update(id, userParam) {
  const user = await User.findOne({ where: { id: id } });

  // validate
  if (!user) throw 'User not found';
  if (
    user.username !== userParam.username &&
    (await User.findOne({ where: { username: userParam.username } }))
  ) {
    throw 'Username "' + userParam.username + '" is already taken';
  }

  // hash password if it was entered
  if (userParam.password) {
    userParam.hash = bcrypt.hashSync(userParam.password, 10);
    delete userParam.password;
  }

  // copy userParam properties to user
  Object.assign(user, userParam);
  User.update(
    {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      hash: user.hash,
      role: user.role,
    },
    { where: { id: id } }
  ).then(function (rowsUpdated) {
    logger.info('user updated: ' + rowsUpdated.firstName);
  });
}

async function _delete(id) {
  await User.destroy({ where: { id: id } }, () => {});
}

async function GetuserListToShareApp(req, res) {
  try {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    const authServiceUrl = `${process.env.AUTH_SERVICE_URL.replace('auth', 'users')}/all`;
    const cookie = `auth=${token}`;

    const response = await axios.get(authServiceUrl, {
      headers: {
        'content-type': 'application/json',
        Cookie: cookie,
      },
    });

    return response.data;
  } catch (err) {
    throw err;
  }
}

// async function GetSharedAppUserList(req, res, next) {
//   return new Promise((resolve, reject) => {
//     UserApplication.findAll({where:{application_id: req.params.app_id}, raw: true}).then(async (users) => {
//       const sharedToUsers = users.filter(user => user.user_id !== req.params.username).map(user => user.user_id); // Remove creator of app from shared to users list
//       let userDetails = await authServiceUtil.getUserDetails(req, sharedToUsers);
//       resolve(userDetails)
//     }).catch((err) => {
//       reject(err);
//     })
//   });
// }

async function changePassword(req, res, { username, password }) {
  var authServiceUrl =
    process.env.AUTH_SERVICE_URL.replace('auth', 'users') + '/changepwd';
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }
  let cookie = 'auth=' + token;

  try {
    const response = await axios.post(
      authServiceUrl,
      {
        username: req.body.username,
        oldpassword: req.body.oldpassword,
        newpassword: req.body.newpassword,
        confirmpassword: req.body.confirmnewpassword,
      },
      {
        headers: {
          'content-type': 'application/json',
          Cookie: cookie,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      logger.error(error);
      logger.error(data);

      if (status === 422) {
        throw new Error(data.errors.concat(','));
      }

      if (status !== 200) {
        throw new Error({ message: data });
      }
    } else {
      // Network error
      throw error;
    }
  }
}

async function registerUser(req, res) {
  var authServiceUrl = process.env.AUTH_SERVICE_URL + '/registerUser';
  try {
    const response = await axios.post(
      authServiceUrl,
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        confirmpassword: req.body.confirmPassword,
        role: req.body.role,
        clientId: process.env.AUTHSERVICE_TOMBOLO_CLIENT_ID,
      },
      {
        headers: {
          'content-type': 'application/json',
        },
      }
    );

    return { statusCode: response.status, message: response.data.message };
  } catch (error) {
    if (error.response) {
      throw {
        statusCode: error.response.status,
        message: error.response.data.message,
      };
    } else {
      // Network error
      throw error;
    }
  }
}

async function forgotPassword(req, res) {
  var authServiceUrl = process.env.AUTH_SERVICE_URL + '/forgotPassword';
  try {
    const response = await axios.post(
      authServiceUrl,
      {
        email: req.body.email,
        clientId: process.env.AUTHSERVICE_TOMBOLO_CLIENT_ID,
        resetUrl: `${process.env.WEB_URL}/reset-password`,
      },
      {
        headers: {
          'content-type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      res.status(200).json({ success: true });
      return { statusCode: response.status, message: response.data };
    } else {
      return res
        .status(500)
        .json({ success: false, errors: [response.data.message] });
    }
  } catch (error) {
    logger.error(error);
    if (error.response) {
      return res
        .status(500)
        .json({ success: false, errors: [error.response.data.message] });
    } else {
      // Network error
      throw error;
    }
  }
}

async function resetPassword(req, res) {
  var authServiceUrl = process.env.AUTH_SERVICE_URL + '/resetPassword';
  try {
    const response = await axios.post(
      authServiceUrl,
      {
        id: req.body.id,
        password: req.body.password,
      },
      {
        headers: {
          'content-type': 'application/json',
        },
      }
    );

    return { statusCode: response.status, message: response.data };
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 422) {
        throw new Error(data.errors.concat(','));
      }

      if (status !== 200) {
        throw data;
      }
    } else {
      // Network error
      throw error;
    }
  }
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
  // GetSharedAppUserList,
  changePassword,
  searchUser,
  registerUser,
  forgotPassword,
  resetPassword,
};
