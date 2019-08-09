const express = require('express');
const router = express.Router();
const userService = require('./userservice');

// routes
router.post('/authenticate', authenticate);
router.post('/register', register);
router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);
router.post('/validateOrRefreshToken', validateOrRefreshToken);
router.get('/:user_id/:app_id', userListByUserAndAppId);

module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(user => user ? res.json(user.userWithoutHash) : res.status(400).json({ message: 'Username or password is incorrect' }))
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

function validateOrRefreshToken(req, res, next) {
    userService.validateOrRefreshToken(req, res, next)
        .then(user => user ? res.json(user.userWithoutHash) : res.status(401).json({ message: 'Invalid Token' }))
        .catch(err => next(err));
}
function userListByUserAndAppId(req, res, next) {
    userService.userListByUserAndAppId(req, res, next)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

