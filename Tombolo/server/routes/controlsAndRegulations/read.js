// const express = require('express');
// const router = express.Router();
// const { ControlsRegulation, DataType } = require('../../models');
// let Sequelize = require('sequelize');
// const logger = require('../../config/logger');
// const { sendSuccess, sendError } = require('../../utils/response');
// const Op = Sequelize.Op;
//
// router.get('/controlsAndRegulations', async (req, res) => {
//   try {
//     const regulations = await ControlsRegulation.findAll({
//       attributes: [
//         'compliance',
//         [
//           Sequelize.fn('GROUP_CONCAT', Sequelize.col('data_types')),
//           'data_types',
//         ],
//       ],
//       group: ['compliance'],
//     });
//     return sendSuccess(res, regulations);
//   } catch (err) {
//     logger.error('getControlsAndRegulations: ', err);
//     return sendError(res, err.message || err);
//   }
// });
//
// router.get('/getRegulation', async (req, res) => {
//   try {
//     const regulations = await ControlsRegulation.findAll({
//       where: { compliance: req.query.compliance },
//     });
//
//     return sendSuccess(res, regulations);
//   } catch (err) {
//     logger.error('getRegulation: ', err);
//     return sendError(res, err.message || err);
//   }
// });
//
// router.post('/delete', async (req, res) => {
//   try {
//     await ControlsRegulation.destroy({
//       where: { compliance: req.body.compliance },
//     });
//
//     return sendSuccess(res, null, 'Regulation deleted successfully');
//   } catch (err) {
//     logger.error('regulations/read delete: ', err);
//     return sendError(res, err.message || err);
//   }
// });
//
// router.post('/saveRegulations', async function (req, res) {
//   const regulations = req.body.regulations;
//   let compliance = req.body.compliance;
//   if (
//     req.body.oldCompName != '' &&
//     req.body.oldCompName != req.body.compliance
//   ) {
//     compliance = req.body.oldCompName;
//   }
//   try {
//     await ControlsRegulation.destroy({ where: { compliance: compliance } });
//     await ControlsRegulation.bulkCreate(regulations);
//
//     return sendSuccess(res, null, 'Regulations saved successfully');
//   } catch (err) {
//     logger.error('regulations/read saveRegulations: ', err);
//     return sendError(res, err.message || err);
//   }
// });
//
// router.get('/dataTypes', async (req, res) => {
//   try {
//     const data_types = await DataType.findAll();
//     return sendSuccess(res, data_types);
//   } catch (err) {
//     logger.error('regulations/read dataTypes: ', err);
//     return sendError(res, err.message || err);
//   }
// });
//
// router.get('/getComplianceByDataType', async (req, res) => {
//   try {
//     let dataTypes = req.query.dataType.split(',');
//     const regulations = await ControlsRegulation.findAll({
//       attributes: ['compliance'],
//       group: ['compliance'],
//       where: { data_types: { [Op.in]: dataTypes } },
//     });
//
//     const compliance = [];
//     if (regulations.length > 0) {
//       for (var obj in regulations) {
//         compliance.push(regulations[obj].compliance);
//       }
//     }
//
//     return sendSuccess(res, compliance);
//   } catch (err) {
//     logger.error('regulations/read getComplianceByDataType: ', err);
//     return sendError(res, err.message || err);
//   }
// });
//
// module.exports = router;
