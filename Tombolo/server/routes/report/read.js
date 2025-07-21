const express = require('express');
const router = express.Router();

const {
  dataflow: Dataflow,
  dataflow_versions: DataflowVersions,
  file: File,
  report: Report,
} = require('../../models');
const { query, body, param, validationResult } = require('express-validator');
const validatorUtil = require('../../utils/validator');
const logger = require('../../config/logger');

router.get(
  '/:application_id',
  [param('application_id').isUUID(4)],
  async (req, res) => {
    try {
      // Express validator
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      // Route logic
      const { application_id } = req.params;
      const reports = await Report.findAll({ where: { application_id } });
      return res.status(200).send(reports);
    } catch (error) {
      logger.error('Something went wrong', error);
      return res.status(500).json({ message: error.message });
    }
  }
);

router.delete('/:reportId', [param('reportId').isUUID(4)], async (req, res) => {
  try {
    // Express validator
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    // Route logic
    const { reportId } = req.params;
    const isRemoved = await Report.destroy({ where: { id: reportId } });
    if (!isRemoved) throw new Error('Report was not removed!');
    return res.status(200).send({ success: true, id: reportId });
  } catch (error) {
    logger.error('Something went wrong', error);
    return res.status(500).json({ message: error.message });
  }
});

router.get(
  '/generate_current/:application_id',
  [param('application_id').isUUID(4)],
  async (req, res) => {
    try {
      // Express validator
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      // Route logic
      const { application_id } = req.params;

      const files = await File.findAll({
        where: { application_id },
        attributes: ['id', 'name', 'metaData'],
      });

      const summary = {
        type: 'current',
        isBaseLine: false,
        report: [],
        application_id,
      };

      for (const file of files) {
        const layout = file.metaData?.layout;
        if (!layout || layout.length === 0) continue;

        const { name, id } = file;
        const reportRecord = { id, name, fields: [] };

        for (const field of layout) {
          const { own, inherited } = field.constraints;
          if (own.length || inherited.length) {
            reportRecord.fields.push({ name: field.name, own, inherited });
          }
        }

        if (reportRecord.fields.length > 0) summary.report.push(reportRecord);
      }

      const newReport = await Report.create(summary);

      return res.status(200).send(newReport);
    } catch (error) {
      logger.error('Something went wrong', error);
      return res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  '/baseline/:application_id',
  [
    param('application_id').isUUID(4),
    body('id').isUUID(4),
    body('action').exists().isString(),
  ],
  async (req, res) => {
    try {
      // Express validator
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      // Route logic
      const { id, action } = req.body;
      const { application_id } = req.params;

      const actions = ['assign', 'remove'];

      if (!actions.includes(action)) throw new Error('No such action');

      if (action === 'remove') {
        const [isUpdated] = await Report.update(
          { isBaseLine: false },
          { where: { id } }
        );

        if (!isUpdated) throw new Error('Failed to remove baseline');
        return res.status(200).send({ success: true, id });
      }

      if (action === 'assign') {
        let newBaseLineReport = await Report.findOne({ where: { id } });
        if (!newBaseLineReport) throw new Error('Report does not exist');

        await Report.update(
          { isBaseLine: false },
          { where: { isBaseLine: true, application_id } }
        );

        newBaseLineReport = await newBaseLineReport.update({
          isBaseLine: true,
        });

        return res
          .status(200)
          .send({ success: true, id: newBaseLineReport.id });
      }
    } catch (error) {
      logger.error('Something went wrong', error);
      return res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  '/associatedDataflows',
  [
    query('assetId')
      .optional({ checkFalsy: true })
      .isUUID(4)
      .withMessage('Invalid asset id'),
    query('type')
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:\-]*$/)
      .withMessage('Invalid type'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const { application_id, assetId } = req.query;

      const versions = await DataflowVersions.findAll({
        where: { isLive: true },
        include: [
          {
            required: true,
            model: Dataflow,
            where: { application_id },
            attributes: ['id', 'title', 'description', 'clusterId'],
          },
        ],
        attributes: ['id', 'graph'],
      });

      const inDataflows = [];

      for (const version of versions) {
        const cells = version?.graph?.cells;
        if (cells) {
          const asset = cells.find(cell => cell.data?.assetId === assetId);
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

      return res.status(200).send(inDataflows);
    } catch (error) {
      logger.error('-error-----------------------------------------');
      logger.error(error);
      logger.error('------------------------------------------');

      return res
        .status(500)
        .send('Error occurred while checking asset in dataflows');
    }
  }
);

module.exports = router;
