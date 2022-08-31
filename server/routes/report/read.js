const express = require('express');
const router = express.Router();

const { dataflow: Dataflow, dataflow_versions: DataflowVersions, report: Report } = require('../../models');
const { query, param, validationResult } = require('express-validator');
const validatorUtil = require('../../utils/validator');
const logger = require('../../config/logger');

router.get('/:application_id', [ param("application_id").isUUID(4) ], async (req, res) => {
  try {
    // Express validator
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    // Route logic
    const { application_id } = req.params;
    const reports = await Report.findAll({where:{application_id}});
    res.status(200).send(reports)
  } catch (error) {
    logger.error(`Something went wrong`, error);
    res.status(500).json({ message: error.message });
  }
}
);

router.delete('/:reportId', [ param("reportId").isUUID(4) ], async (req, res) => {
  try {
    // Express validator
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
    
    // Route logic
    const { reportId } = req.params;
    const isRemoved = await Report.destroy({where:{id: reportId}});
    if(!isRemoved) throw new Error('Report was not removed!');
    res.status(200).send({ success: true, id: reportId });
  } catch (error) {
    logger.error(`Something went wrong`, error);
    res.status(500).json({ message: error.message });
  }
}
);

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