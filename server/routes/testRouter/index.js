const express = require('express');
const router = express.Router();
var models  = require('../../models');
let Dataflow = models.dataflow;
const Dataflow_cluster_credentials = models.dataflow_cluster_credentials;
const validatorUtil = require('../../utils/validator');
const { body, query, validationResult } = require('express-validator');
const {isClusterReachable} = require('../../utils/hpcc-util');
const {encryptString, decryptString} = require('../../utils/cipher')

router.post(
  '/save',
  [
    body('id').optional({ checkFalsy: true }).isUUID(4).withMessage('Invalid dataflow id'),
    body('application_id').isUUID(4).withMessage('Invalid application id'),
    body('clusterId').isUUID(4).withMessage('Invalid cluster id'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    //Check if cluster is reachable
    const { clusterHost, port, id, application_id, title, description, clusterId, metaData } = req.body;
    console.log("Dataflow Save...1")
    /*const username = req.body.username || '';
    const password = req.body.password || '';
    const reachable = await isClusterReachable(clusterHost, port, username, password);

    console.log("Dataflow Save..."+reachable);
    if (reachable.statusCode === 503) {
      res.status(503).json({ success: false, message: 'Cluster not reachable' });
    } else if (reachable.statusCode === 403) {
      res.status(403).json({ success: false, message: 'Invalid cluster credentials' });
    } else {
      try {
        if (id) {
          // If id is available on req.body -> updating existing workflow
          const dataFlow = await Dataflow.findOne({ where: { id } });
          if (dataFlow) {
            await Dataflow.update(
              {
                application_id,
                title,
                type: 'main',
                description,
                clusterId,
                metaData,
              },
              { where: { id: id } }
            );

            await Dataflow_cluster_credentials.update(
              {
                cluster_id: clusterId,
                cluster_username: username,
                cluster_hash: encryptString(password),
              },
              { where: { dataflow_id: id } }
            );
            res.status(200).json({ success: true, message: 'Dataflow updated' });
          } else {
            // send error to front end - could not update no DF found
            res.status(404).json({ success: false, message: 'Unable to update dataflow - dataflow not found' });
          }
        } else {
          let newDataflow = await Dataflow.create({
            application_id,
            title,
            type: 'main',
            description,
            clusterId,
            metaData,
          });

          await Dataflow_cluster_credentials.create({
            dataflow_id: newDataflow.id,
            cluster_id: clusterId,
            cluster_username: username,
            cluster_hash: encryptString(password),
          });
          res.status(200).json({ success: true, message: 'Dataflow created successfully' });
        }
      } catch (err) {
        res.status(409).json({ success: false, message: 'Unable to create dataflow' });
      }      
    }*/
    res.status(200).json({ success: true, message: 'Dataflow created successfully' });
  }
);

module.exports = router;