const express = require('express');
const router = express.Router();
var models = require('../../models');
let Sequelize = require('sequelize');
const logger = require('../../config/logger');
const Op = Sequelize.Op;
let ControlsAndRegulations = models.controls_regulations;
let DataTypes = models.data_types;

router.get('/controlsAndRegulations', async (req, res) => {
  try {
    const regulations = await ControlsAndRegulations.findAll({
      attributes: [
        'compliance',
        [
          Sequelize.fn('GROUP_CONCAT', Sequelize.col('data_types')),
          'data_types',
        ],
      ],
      group: ['compliance'],
    });
    return res.status(200).json(regulations);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: err });
  }
});

router.get('/getRegulation', async (req, res) => {
  try {
    const regulations = await ControlsAndRegulations.findAll({
      where: { compliance: req.query.compliance },
    });

    return res.status(200).json(regulations);
  } catch (err) {
    logger.error('err', err);
    return res.status(500).json({ error: err });
  }
});

router.post('/delete', async (req, res) => {
  try {
    await ControlsAndRegulations.destroy({
      where: { compliance: req.body.compliance },
    });

    return res.status(200).json({ result: 'success' });
  } catch (err) {
    logger.error('err', err);
    return res.status(500).json({ error: err });
  }
});

router.post('/saveRegulations', async function (req, res) {
  const regulations = req.body.regulations;
  const compliance = req.body.compliance;
  if (
    req.body.oldCompName != '' &&
    req.body.oldCompName != req.body.compliance
  ) {
    compliance = req.body.oldCompName;
  }
  try {
    await ControlsAndRegulations.destroy({ where: { compliance: compliance } });
    await ControlsAndRegulations.bulkCreate(regulations);

    return res.status(200).json({ result: 'success ' });
  } catch (err) {
    logger.error('err', err);
    return res.status(500).json({ error: err });
  }
});

router.get('/dataTypes', async (req, res) => {
  try {
    const data_types = await DataTypes.findAll();
    return res.status(200).json(data_types);
  } catch (err) {
    logger.error('err', err);
    return res.status(500).json({ error: err });
  }
});

router.get('/getComplianceByDataType', async (req, res) => {
  try {
    let dataTypes = req.query.dataType.split(',');
    const regulations = await ControlsAndRegulations.findAll({
      attributes: ['compliance'],
      group: ['compliance'],
      where: { data_types: { [Op.in]: dataTypes } },
    });

    const compliance = [];
    if (regulations.length > 0) {
      for (var obj in regulations) {
        compliance.push(regulations[obj].compliance);
      }
    }

    return res.status(200).json(compliance);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: err });
  }
});

module.exports = router;
