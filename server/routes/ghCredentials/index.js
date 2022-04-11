const express = require('express');
const router = express.Router();
const algorithm = 'aes-256-ctr';
const { GHCredentials } = require('../../models');
const {encryptString, decryptString} = require('../../utils/cipher');

const crypto = require('crypto');

router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const GHUsername = encryptString(req.body.GHUsername);
    const GHToken = encryptString(req.body.GHToken)

    let credentials = await GHCredentials.findOne({ where: { userId } });
    if (credentials) {
      if (GHToken !== credentials.GHToken || GHUsername !== credentials.GHUsername) {
        credentials = await credentials.update({ GHUsername, GHToken });
      }
    } else {
      credentials = await GHCredentials.create({ userId, GHUsername, GHToken });
    }

    res.send({ id: credentials.id });
  } catch (error) {
    console.log('-error-----------------------------------------');
    console.dir({ error }, { depth: null });
    console.log('------------------------------------------');
    res.status(500).send('Error occurred while saving credentials');
  }
});

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const credentials = await GHCredentials.findOne({ where: { userId } });

    if (credentials) {
      credentials.GHUsername = decryptString(credentials.GHUsername);
      credentials.GHToken = decryptString(credentials.GHToken);
    }
    res.send({ credentials });
  } catch (error) {
    console.log('-error-----------------------------------------');
    console.dir({ error }, { depth: null });
    console.log('------------------------------------------');
    res.status(500).send('Error occurred while retreiving credentials');
  }
});

module.exports = router;
