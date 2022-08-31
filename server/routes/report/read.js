const express = require('express');
const router = express.Router();

const models  = require('../../models');
let Dataflow = models.dataflow;
const DataflowVersions = models.dataflow_versions;
const { query, validationResult } = require('express-validator');
const validatorUtil = require('../../utils/validator');

router.get( '/associatedDataflows',
    [
      query('assetId').optional({ checkFalsy: true }).isUUID(4).withMessage('Invalid asset id'),
      query('type')
        .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:\-]*$/)
        .withMessage('Invalid type'),
    ],
    async (req, res) => {
      const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }
  
  
      try {
        const { application_id, assetId } = req.query;
  
        const versions = await DataflowVersions.findAll({
          where: { isLive: true },
          include: [{
              required: true,
              model: Dataflow,
              where: { application_id },
              attributes: ['id', 'title', 'description', 'clusterId' ],
            }],
          attributes: ['id', 'graph' ],
        });
        
        
        const inDataflows = [];
  
        for (const version of versions) {
          const cells = version?.graph?.cells;
          if (cells) {
            const asset = cells.find((cell) => cell.data?.assetId === assetId);
            if (asset) {
              inDataflows.push({
                application_id,
                id: version.dataflow.id,
                title: version.dataflow.title,
                description: version.dataflow.description,
                clusterId: version.dataflow.clusterId,
              });
            }
          }
        }        
  
        res.send(inDataflows);
      } catch (error) {
        console.log('-error-----------------------------------------');
        console.dir({ error }, { depth: null });
        console.log('------------------------------------------');
  
        res.status(500).send('Error occurred while checking asset in dataflows');
      }
    }
  );
  

module.exports = router;