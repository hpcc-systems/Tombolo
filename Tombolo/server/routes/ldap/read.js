const express = require('express');
const router = express.Router();
var ActiveDirectory = require('activedirectory');
const logger = require('../../config/logger');

var config = {
  url: process.env.LDAP_URL,
  baseDN: process.env.BASE_DN,
  username: process.env.LDAP_USER,
  password: process.env.LDAP_PASSWORD,
};

router.get('/groupsearch', (req, res) => {
  var groupName = req.query.groupName,
    results = [];
  var query = 'CN=*' + groupName + '*';
  var ad = new ActiveDirectory(config);
  ad.findGroups(query, function (err, group) {
    if (err) {
      logger.error(err);
      return;
    }

    if (!group) {
      logger.error('Group: ' + groupName + ' not found.');
    } else {
      group.forEach(groupObj => {
        results.push(groupObj.cn);
      });
      return res.json(results);
    }
  });
});

module.exports = router;
