const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const userService = require('./userservice');
const tokenService = require('../../utils/token_service');
let { user_application: UserApplication } = require('../../models');
const logger = require('../../config/logger');

const errorFormatter = ({ msg }) => {
  return `${msg}`;
};

// routes
router.post('/register', register); // open
router.post('/authenticate', authenticate); // open
router.post('/validateToken', validateToken); // open
router.post('/changePassword', changePassword); // open
router.get('/probe', (req, res) => res.status(200).end()); // open, polling

router.post(
  '/registerUser',
  [
    body('firstName')
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_ -]*$/)
      .withMessage('Invalid First Name'),
    body('lastName')
      .optional({ checkFalsy: true })
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_ -]*$/)
      .withMessage('Invalid Last Name'),
    body('username')
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_-]*$/)
      .withMessage('Invalid User Name'),
    body('email')
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage('Invalid Email Address'),
    body('organization')
      .optional({ checkFalsy: true })
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_-]*$/)
      .withMessage('Invalid Organization Name'),
    body('password').optional({ checkFalsy: true }).isLength({ min: 4 }),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const response = await userService.registerUser(req, res);

      return res.status(response.statusCode).json({ success: 'true' });
    } catch (err) {
      logger.error(err);
      return res.status(500).json({ errors: err.message });
    }
  }
); // open

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Invalid E-mail')],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      const response = await userService.forgotPassword(req, res);

      return res.status(response.statusCode).json(response.message);
    } catch (err) {
      return res.status(500).json({ errors: [err.error] });
    }
  }
); // open

router.post(
  '/resetPassword',
  [
    body('id').isLength({ min: 36 }).withMessage('Invalid id'),
    body('password').optional({ checkFalsy: true }).isLength({ min: 4 }),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const response = await userService.resetPassword(req, res);
      return res.status(response.statusCode).json({ success: 'true' });
    } catch (err) {
      logger.error(err);
      return res.status(500).json({ errors: [err.message] });
    }
  }
); // open

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

async function authenticate(req, res) {
  try {
    const user = await userService.authenticate(req, res, req.body);
    return res.status(200).json(user);
  } catch (err) {
    logger.error(err);
    return res.status(401).json({ message: 'Wrong username or password' });
  }
}

async function register(req, res) {
  try {
    await userService.create(req.body);
    return res.json({});
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .json({ message: 'Error Occured while registering user' });
  }
}

async function getAll(req, res) {
  try {
    const users = await userService.getAll();
    return res.status(200).json(users);
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .json({ message: 'Error occured while retrieving users' });
  }
}

async function getCurrent(req, res) {
  try {
    const user = await userService.getById(req.user.sub);
    if (user) return res.status(200).json(user);

    return res.sendStatus(404);
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .json({ message: 'Error occured while retrieving users' });
  }
}

async function getById(req, res) {
  try {
    const user = await userService.getById(req.params.id);
    if (user) return res.json(user);

    return res.sendStatus(404);
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .json({ message: 'Error occured while retrieving users' });
  }
}

async function update(req, res) {
  try {
    await userService.update(req.params.id, req.body);
    return res.status(200).json({});
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .json({ message: 'Error occured while updating users' });
  }
}

async function _delete(req, res) {
  try {
    await userService.delete(req.params.id);
    return res.status(200).json({});
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .json({ message: 'Error occured while deleting users' });
  }
}

async function validateToken(req, res, next) {
  try {
    const user = await userService.validateToken(req, res, next);
    if (user) return res.status(200).json(user.userWithoutHash);

    return res.status(401).json({ message: 'Invalid Token' });
  } catch (err) {
    logger.error(err);
    return res.status(401).json({ message: 'Invalid Token' });
  }
}

async function GetuserListToShareApp(req, res, next) {
  if (process.env.APP_AUTH_METHOD === 'azure_ad') {
    return [];
  } else {
    try {
      const user = await userService.GetuserListToShareApp(req, res, next);
      if (user) return res.status(200).json(user);

      return res.sendStatus(404);
    } catch (err) {
      logger.error(err);
      return res
        .status(500)
        .json({ message: 'Error occured while retrieving users' });
    }
  }
}

async function GetSharedAppUserList(req, res) {
  try {
    const { app_id, username } = req.params;
    const shares = await UserApplication.findAll({
      where: { application_id: app_id },
      raw: true,
    });
    const users = shares.map(share => share.user_id);
    const filteredUsers = users.filter(user => user != username);
    return res.status(200).send(filteredUsers);
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch users' });
  }
}

async function changePassword(req, res) {
  try {
    const response = await userService.changePassword(req, res, req.body);
    return res.status(200).json(response);
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .json({ message: 'Error occured while changing password' });
  }
}

async function searchUser(req, res, next) {
  try {
    const users = await userService.searchUser(req, res, next);
    if (users) return res.status(200).json(users);

    return res.sendStatus([]);
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .json({ message: 'Error occured while searching users' });
  }
}
