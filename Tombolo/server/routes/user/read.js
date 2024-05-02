const express = require('express');
const router = express.Router();
const { body, validationResult } = require("express-validator");

const userService = require('./userservice');
const tokenService = require('../../utils/token_service')
let models = require("../../models");
let UserApplication = models.user_application;

const errorFormatter = ({ msg }) => { return `${msg}`; };

// routes
router.post('/register', register); // open
router.post('/authenticate', authenticate); // open
router.post('/validateToken', validateToken); // open
router.post('/changePassword', changePassword); // open
router.get('/probe', (req,res) => res.status(200).end()); // open, polling

router.post('/registerUser', [
  body('firstName')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_ -]*$/).withMessage('Invalid First Name'),
  body('lastName').optional({checkFalsy:true})
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_ -]*$/).withMessage('Invalid Last Name'),
  body('username')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_-]*$/).withMessage('Invalid User Name'),
  body('email').optional({checkFalsy:true})
    .isEmail().withMessage('Invalid Email Address'),
  body('organization').optional({checkFalsy:true})
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_-]*$/).withMessage('Invalid Organization Name'),
  body('password').optional({checkFalsy:true}).isLength({ min: 4 })
], (req, res, next) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  userService.registerUser(req, res)
    .then((response) => {
      res.status(response.statusCode).json({"success":"true"});
    })
    .catch((err) => {
      res.status(500).json({ errors: err.message });
    })
}) // open

router.post('/forgot-password', [
  body('email')
    .isEmail().withMessage('Invalid E-mail'),
], (req, res, next) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ "success": false, errors: errors.array() });
  }

  userService.forgotPassword(req, res)
  .then((response) => {
    res.status(response.statusCode).json(response.message);
  })
  .catch((err) => {
    // res.status(500).json({ errors: [err.error] });
    console.log(err);
  })
}) // open

router.post('/resetPassword'
, [
  body('id')
  .isLength({ min: 36 }).withMessage('Invalid id'),
  body('password').optional({checkFalsy:true}).isLength({ min: 4 })
]
, (req, res, next) => {
      const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

   userService.resetPassword(req, res)
  .then((response) => {
    res.status(response.statusCode).json({"success":"true"});
  })
  .catch((err) => {
    console.log(err);
    res.status(500).json({ errors: [err.message] });
  })
}) // open

// Authenticate token before proceeding to route
router.use(tokenService.verifyToken);

router.get('/', getAll); // hidden
router.put('/:id', update); // hidden 
router.get('/:id', getById); // hidden
router.delete('/:id', _delete); // hidden
router.get('/current', getCurrent); // hidden
router.get('/searchuser/', searchUser); // hidden
router.get('/:user_id/:app_id', GetuserListToShareApp); // hidden
router.get('/:app_id/sharedAppUser/:username', GetSharedAppUserList); // hidden

module.exports = router;

function authenticate(req, res, next) {
  //var user = await userService.authenticate(req, res, req.body);
  userService.authenticate(req, res, req.body)
  .then(function (user) {
      res.json(user);
  })
  .catch(err =>{ res.status(401).json({ "message": "Wrong username or password" })});
}

function register(req, res, next) {
  userService.create(req.body)
      .then(() => res.json({}))
      .catch(err => res.status(500).json({ "message": "Error Occured while registering user" }));
}

function getAll(req, res, next) {
  userService.getAll()
      .then(users => res.json(users))
      .catch(err => res.status(500).json({ "message": "Error occured while retrieving users" }));
}

function getCurrent(req, res, next) {
  userService.getById(req.user.sub)
      .then(user => user ? res.json(user) : res.sendStatus(404))
      .catch(err => res.status(500).json({ "message": "Error occured while retrieving users" }));
}

function getById(req, res, next) {
  console.log('getById: '+req.params.id);
  userService.getById(req.params.id)
      .then(user => user ? res.json(user) : res.sendStatus(404))
      .catch(err => res.status(500).json({ "message": "Error occured while retrieving users" }));
}

function update(req, res, next) {
  userService.update(req.params.id, req.body)
      .then(() => res.json({}))
      .catch(err => res.status(500).json({ "message": "Error occured while updating users" }));
}

function _delete(req, res, next) {
  userService.delete(req.params.id)
      .then(() => res.json({}))
      .catch(err => res.status(500).json({ "message": "Error occured while deleting users" }));
}

function validateToken(req, res, next) {
  userService.validateToken(req, res, next)
      .then(user => user ? res.json(user.userWithoutHash) : res.status(401).json({ message: 'Invalid Token' }))
      .catch(err => res.status(401).json({ "message": "Invalid Token" }));
}

function GetuserListToShareApp(req, res, next) {
  if (process.env.APP_AUTH_METHOD === 'azure_ad'){
    return []
  }else{
      userService
      .GetuserListToShareApp(req, res, next)
      .then((user) => (user ? res.json(user) : res.sendStatus(404)))
      .catch((err) =>
        res
          .status(500)
          .json({ message: "Error occured while retrieving users" })
      );
  }
}

async function GetSharedAppUserList (req, res, next) {
  try{
    const { app_id, username } = req.params;
    const shares = await UserApplication.findAll({where: {application_id : app_id}, raw: true});
    const users = shares.map((share) => share.user_id);
    const filteredUsers = users.filter(user => user != username)
    res.status(200).send(filteredUsers);
  }catch(err){
    res.status(500).json({success: false, message: "Failed to fetch users"})
  }
}

function changePassword(req, res, next) {
  userService.changePassword(req, res, req.body)
  .then(function (response) {
    res.json(response)
  })
  .catch(err => res.status(500).json({ "message": "Error occured while changing password" }));
}

function searchUser(req, res, next) {
  userService.searchUser(req, res, next)
    .then(users => users ? res.json(users) : res.sendStatus([]))
    .catch(err => res.status(500).json({ "message": "Error occured while searching users" }));
}
