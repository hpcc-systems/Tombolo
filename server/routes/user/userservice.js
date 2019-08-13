const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
let mongoose = require('mongoose');
const dbUtil = require('../../utils/db');
let models = require('../../models');
let User = models.user;
const Sequelize = require('sequelize');
let UserApplication = models.user_application;

module.exports = {
    authenticate,
    getAll,
    getById,
    create,
    update,
    verifyToken,
    delete: _delete,
    validateOrRefreshToken,
    GetuserListToShareApp,
    GetSharedAppUserList
};

async function authenticate({ username, password }) {
    const user = await User.findOne({ where: {"username":username}, attributes: ['id', 'username', 'hash', 'firstName', 'lastName', 'role']});
    if (user && bcrypt.compareSync(password, user.hash)) {
        return generateToken(user);
    }
}

async function verifyToken(req, res, next) {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (token) {
        if (token.startsWith('Bearer ')) {
          token = token.slice(7, token.length);
          return await jwt.verify(token, dbUtil.secret)
        }
    }
}

async function validateOrRefreshToken(req, res, next) {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (token) {
        if (token.startsWith('Bearer ')) {
          token = token.slice(7, token.length);
          console.log('token: '+token);
          var verified = await jwt.verify(token, dbUtil.secret);
          if(verified) {
            const user = await User.findOne({ where: {"username":req.body.username}, attributes: ['id', 'username', 'hash', 'firstName', 'lastName', 'role']});
            return generateToken(user);
          }
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
    const Op = Sequelize.Op
      return await models.user.findAll({
            where: {"id" :{ [Op.ne]:req.params.user_id},
            "role":"user",
            "id": {
                [Op.notIn]: Sequelize.literal( 
                    '( SELECT user_id ' +
                        'FROM user_application ' +
                       'WHERE application_id = "' + req.params.app_id +
                    '")')
                }
            }
        });
    }
    async function GetSharedAppUserList(req, res, next) {
        const Op = Sequelize.Op
       return await models.user.findAll({
            where:{
            //"id" :{ [Op.ne]:req.params.user_id}, 
            "role":"user",
            "id": {
            [Op.in]: Sequelize.literal( 
                '( SELECT user_id ' +
                    'FROM user_application ' +
                   'WHERE application_id = "' + req.params.app_id +
                   '" and user_id != "' + req.params.user_id +
                '")')
            }
        }
    });
}