const express = require('express');
const router = express.Router();
const algorithm = 'aes-256-ctr';
const { GHCredentials } = require('../../models');

const crypto = require('crypto');

router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const GHUsername = crypto.createCipher(algorithm, process.env.cluster_cred_secret).update(req.body.GHUsername, 'utf8', 'hex');
    const GHToken = crypto.createCipher(algorithm, process.env.cluster_cred_secret).update(req.body.GHToken, 'utf8', 'hex');

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
      credentials.GHUsername = crypto .createDecipher(algorithm, process.env.cluster_cred_secret) .update(credentials.GHUsername, 'hex', 'utf8');
      credentials.GHToken = crypto .createDecipher(algorithm, process.env.cluster_cred_secret) .update(credentials.GHToken, 'hex', 'utf8');
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
