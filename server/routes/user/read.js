const express = require('express');
const router = express.Router();
const userService = require('./userservice');
const { body, query, check, validationResult } = require('express-validator');
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {    
  return `${location}[${param}]: ${msg}`;
};
// routes
router.get('/searchuser', searchUser);
router.post('/authenticate', authenticate);
router.post('/register', register);
router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/:app_id/sharedAppUser', GetSharedAppUserList);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);
router.post('/validateToken', validateToken);
router.get('/:user_id/:app_id', GetuserListToShareApp);
router.post('/changePassword', changePassword);

module.exports = router;
function authenticate(req, res, next) {
  //var user = await userService.authenticate(req, res, req.body);
  userService.authenticate(req, res, req.body)
  .then(function (user) {
      res.json(user);
  })
  .catch(err => next(err));
}

function register(req, res, next) {
  userService.create(req.body)
      .then(() => res.json({}))
      .catch(err => next(err));
}

function getAll(req, res, next) {
  userService.getAll()
      .then(users => res.json(users))
      .catch(err => next(err));
}

function getCurrent(req, res, next) {
  userService.getById(req.user.sub)
      .then(user => user ? res.json(user) : res.sendStatus(404))
      .catch(err => next(err));
}

function getById(req, res, next) {
  console.log('getById: '+req.params.id);
  userService.getById(req.params.id)
      .then(user => user ? res.json(user) : res.sendStatus(404))
      .catch(err => next(err));
}

function update(req, res, next) {
  userService.update(req.params.id, req.body)
      .then(() => res.json({}))
      .catch(err => next(err));
}

function _delete(req, res, next) {
  userService.delete(req.params.id)
      .then(() => res.json({}))
      .catch(err => next(err));
}

function validateToken(req, res, next) {
  userService.validateToken(req, res, next)
      .then(user => user ? res.json(user.userWithoutHash) : res.status(401).json({ message: 'Invalid Token' }))
      .catch(err => next(err));
}
function GetuserListToShareApp(req, res, next) {
  userService.GetuserListToShareApp(req, res, next)
      .then(user => user ? res.json(user) : res.sendStatus(404))
      .catch(err => next(err));
}
function GetSharedAppUserList(req, res, next) {
  console.log('GetSharedAppUserList')
  userService.GetSharedAppUserList(req, res, next)
    .then(user => user ? res.json(user) : [])
    .catch(err => next(err));
}

function changePassword(req, res, next) {
  userService.changePassword(req, res, req.body)
  .then(function (response) {
    res.json(response)
  })
  .catch(err => next(err));
}

function searchUser(req, res, next) {
  userService.searchUser(req, res, next)
    .then(users => users ? res.json(users) : res.sendStatus([]))
    .catch(err => next(err));
}

router.post('/registerUser', [
  body('firstName')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_-]*$/).withMessage('Invalid First Name'),
  body('lastName').optional({checkFalsy:true})
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_-]*$/).withMessage('Invalid Last Name'),
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
      console.log('response: '+JSON.stringify(response));
      res.json(response)
    })
    .catch((err) => {
      console.log('here-2: '+JSON.stringify(err))
      res.status(500).json({ errors: [err.error] });      
    })
})






