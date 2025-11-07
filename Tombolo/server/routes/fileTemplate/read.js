// const express = require('express');
// const router = express.Router();
// const { body, query, validationResult } = require('express-validator');
// const {
//   sendSuccess,
//   sendError,
//   sendValidationError,
// } = require('../../utils/response');
//
// let Sequelize = require('sequelize');
// const Op = Sequelize.Op;
// const logger = require('../../config/logger');
//
// const {
//   FileTemplate,
//   FileMonitoring,
//   FileTemplateLayout,
//   AssetsGroup,
// } = require('../../models');
//
// router.post(
//   '/saveFileTemplate',
//   [
//     body('assetId')
//       .optional({ checkFalsy: true })
//       .isUUID(4)
//       .withMessage('Invalid id'),
//     body('application_id').isUUID(4).withMessage('Invalid application id'),
//     body('cluster')
//       .isUUID(4)
//       .optional({ checkFalsy: true })
//       .withMessage('Invalid cluster id'),
//     body('title')
//       .isString()
//       .optional({ checkFalsy: true })
//       .withMessage('Invalid title'),
//     body('fileNamePattern')
//       .isString()
//       .optional({ checkFalsy: true })
//       .withMessage('Invalid fileNamePattern'),
//     body('searchString')
//       .isString()
//       .optional({ checkFalsy: true })
//       .withMessage('Invalid searchString'),
//     body('sampleLayoutFile')
//       .isString()
//       .optional({ nullable: true })
//       .withMessage('Invalid sampleLayoutFile'),
//   ],
//   async (req, res) => {
//     try {
//       let errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return sendValidationError(res, errors.array());
//       }
//
//       const {
//         application_id,
//         cluster,
//         title,
//         fileNamePattern,
//         groupId,
//         description,
//         sampleLayoutFile,
//         fileLayoutData,
//         assetId,
//         // eslint-disable-next-line no-unused-vars
//         licenses,
//         metaData,
//       } = req.body;
//
//       let { searchString } = req.body;
//       if (fileNamePattern === 'startsWith') {
//         searchString = req.body.searchString + '*';
//       } else if (fileNamePattern === 'endsWith') {
//         searchString = '*' + req.body.searchString;
//       } else if (fileNamePattern === 'contains') {
//         searchString = '*' + req.body.searchString + '*';
//       }
//
//       if (assetId) {
//         // file template exists -> edit it
//         await FileTemplate.update(
//           {
//             title,
//             cluster_id: cluster,
//             fileNamePattern,
//             searchString,
//             sampleLayoutFile,
//             description,
//             metaData,
//           },
//           { where: { id: assetId } }
//         );
//         await FileTemplateLayout.update(
//           { fields: { layout: fileLayoutData } },
//           { where: { fileTemplate_id: assetId } }
//         );
//         // await FileTemplate_licenses.destroy({where : { fileTemplate_id : assetId}});
//         return sendSuccess(
//           res,
//           {
//             assetId: assetId,
//             isMonitoring: !!metaData.fileMonitoringTemplate,
//           },
//           `File template '${title}' updated successfully`
//         );
//       }
//
//       // New file template -> Create it
//       const fileTemplate = await FileTemplate.create({
//         application_id,
//         title,
//         cluster_id: cluster,
//         fileNamePattern,
//         searchString,
//         sampleLayoutFile,
//         description,
//         metaData,
//       });
//       if (groupId)
//         await AssetsGroup.create({ assetId: fileTemplate.id, groupId });
//       await FileTemplateLayout.create({
//         application_id,
//         fileTemplate_id: fileTemplate.id,
//         fields: { layout: fileLayoutData },
//       });
//
//       return sendSuccess(
//         res,
//         {
//           assetId: fileTemplate.id,
//           isMonitoring: !!metaData.fileMonitoringTemplate,
//         },
//         `File template '${title}' created successfully`
//       );
//     } catch (err) {
//       logger.error('fileTemplate/read - saveFileTemplate: ', err);
//       return sendError(res, 'Failed to save file template details');
//     }
//   }
// );
//
// // GET FILE TEMPLATE LIST THAT ARE NOT ALREADY ADDED IN THE DATAFLOW
// router.get(
//   '/fileTemplate_list',
//   [
//     query('application_id').isUUID(4).withMessage('Invalid application id'),
//     query('dataflowId')
//       .isUUID(4)
//       .optional({ nullable: true })
//       .withMessage('Invalid dataflow id'),
//     query('clusterId')
//       .isUUID(4)
//       .optional({ nullable: true })
//       .withMessage('Invalid cluster id'),
//   ],
//   async (req, res) => {
//     let errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return sendValidationError(res, errors.array());
//     }
//
//     try {
//       const { application_id, cluster_id } = req.query;
//       const assets = await FileTemplate.findAll({
//         where: {
//           application_id,
//           [Op.or]: [{ cluster_id }, { cluster_id: null }],
//         },
//         attributes: ['id', 'title', 'metaData', 'description', 'createdAt'],
//       });
//
//       const assetList = assets.reduce((acc, asset) => {
//         const parsed = asset.toJSON();
//         if (parsed.metaData?.fileMonitoringTemplate) {
//           const template = {
//             ...parsed,
//             name: parsed.title,
//             isAssociated: true,
//             isMonitoring: true,
//           };
//
//           delete template.metaData;
//           acc.push(template);
//         }
//         return acc;
//       }, []);
//
//       return sendSuccess(
//         res,
//         assetList,
//         'File templates retrieved successfully'
//       );
//     } catch (error) {
//       logger.error('fileTemplate/read - fileTemplate_list: ', error);
//       return sendError(res, 'Failed to retrieve file templates');
//     }
//   }
// );
//
// router.post(
//   '/getFileTemplate',
//   [
//     body('id')
//       .optional({ checkFalsy: true })
//       .isUUID(4)
//       .withMessage('Invalid id'),
//     body('application_id').isUUID(4).withMessage('Invalid application id'),
//   ],
//   async (req, res) => {
//     let errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return sendValidationError(res, errors.array());
//     }
//     try {
//       const TemplateResults = await FileTemplate.findOne({
//         where: { id: req.body.id },
//         include: FileTemplateLayout,
//         raw: true,
//       });
//
//       if (!TemplateResults) {
//         return sendError(res, 'File template not found', 404);
//       }
//
//       const fileMonitoring = await FileMonitoring.findOne({
//         where: { fileTemplateId: TemplateResults.id },
//       });
//
//       return sendSuccess(
//         res,
//         {
//           ...TemplateResults,
//           monitoring: fileMonitoring ? true : false,
//         },
//         'File template details retrieved successfully'
//       );
//     } catch (err) {
//       logger.error('fileTemplate/read - getFileTemplate: ', err);
//       return sendError(res, 'Failed to fetch file template details');
//     }
//   }
// );
//
// router.post(
//   '/deleteFileTemplate',
//   [
//     body('id')
//       .optional({ checkFalsy: true })
//       .isUUID(4)
//       .withMessage('Invalid id'),
//     body('application_id').isUUID(4).withMessage('Invalid application id'),
//   ],
//   async (req, res) => {
//     let errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return sendValidationError(res, errors.array());
//     }
//     const { id, application_id } = req.body;
//     try {
//       const result = await FileTemplate.destroy({
//         where: { id, application_id },
//       });
//       if (!result) {
//         return sendError(res, 'File template not found', 404);
//       }
//       return sendSuccess(res, { id }, 'File template deleted successfully');
//     } catch (err) {
//       logger.error('fileTemplate/read - deleteFileTemplate: ', err);
//       return sendError(res, 'Failed to delete file template');
//     }
//   }
// );
//
// router.post(
//   '/getAssociatedLicenses',
//   [
//     body('fileTemplate_id')
//       .optional({ checkFalsy: true })
//       .isUUID(4)
//       .withMessage('Invalid File template ID'),
//   ],
//   async (req, res) => {
//     let errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return sendValidationError(res, errors.array());
//     }
//     const { fileTemplate_id } = req.body;
//     try {
//       // Note: FileTemplate_licenses model appears to be missing or deprecated
//       // For now, returning empty array until model is defined
//       let associateLicenses = []; // await FileTemplate_licenses.findAll({ where: { fileTemplate_id } });
//
//       return sendSuccess(
//         res,
//         associateLicenses,
//         'Associated licenses retrieved successfully'
//       );
//     } catch (err) {
//       logger.error('fileTemplate/read - getAssociatedLicenses: ', err);
//       return sendError(res, 'Failed to get associated licenses');
//     }
//   }
// );
//
// module.exports = router;
