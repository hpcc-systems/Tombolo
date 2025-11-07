// const express = require('express');
// const router = express.Router();
// const { GithubRepoSetting } = require('../../models');
// const { encryptString, decryptString } = require('../../utils/cipher');
// const { validate } = require('../../middlewares/validateRequestBody');
// const {
//   validateCreateGhProject,
//   validateDeleteGhProject,
//   validateGetGhProjects,
// } = require('../../middlewares/ghProjectsMiddleware');
// const logger = require('../../config/logger');
// const { sendSuccess, sendError } = require('../../utils/response');
//
// router.post('/', validate(validateCreateGhProject), async (req, res) => {
//   try {
//     let {
//       id,
//       application_id,
//       ghBranchOrTag,
//       ghLink,
//       ghProject,
//       ghToken,
//       ghUserName,
//     } = req.body;
//
//     if (ghToken) ghToken = encryptString(ghToken);
//     if (ghUserName) ghUserName = encryptString(ghUserName);
//
//     let project;
//
//     const defaultFields = {
//       ghBranchOrTag,
//       ghLink,
//       ghProject,
//       ghToken,
//       ghUserName,
//     };
//
//     if (id) {
//       project = await GithubRepoSetting.findOne({ where: { id } });
//       if (!project) throw new Error('Project does not exist');
//       project = await project.update(defaultFields);
//     } else {
//       project = await GithubRepoSetting.create({
//         ...defaultFields,
//         application_id,
//       });
//     }
//
//     const projectToJson = project.toJSON();
//
//     logger.info('------------------------------------------');
//     logger.info({ projectToJson, defaultFields });
//     logger.info('------------------------------------------');
//
//     return sendSuccess(res, { id: project.id }, 'Project saved successfully');
//   } catch (error) {
//     logger.error('gh_projects/index create: ', error);
//     return sendError(res, 'Error occurred while saving project');
//   }
// });
//
// router.delete('/', validate(validateDeleteGhProject), async (req, res) => {
//   try {
//     let { id, application_id } = req.query;
//
//     const deleted = await GithubRepoSetting.destroy({
//       where: { id, application_id },
//     });
//     if (!deleted) return sendError(res, 'Project does not exist', 404);
//
//     return sendSuccess(res, null, 'Project deleted successfully');
//   } catch (error) {
//     logger.error('gh_projects/index delete: ', error);
//     return sendError(res, 'Error occurred while deleting project');
//   }
// });
//
// router.get('/', validate(validateGetGhProjects), async (req, res) => {
//   try {
//     const application_id = req.query.application_id;
//
//     const projects = await GithubRepoSetting.findAll({
//       where: { application_id },
//       attributes: { exclude: ['createdAt', 'updatedAt'] },
//     });
//
//     const projectList = projects.map(project => {
//       const projectJSON = project.toJSON();
//       if (projectJSON.ghToken)
//         projectJSON.ghToken = decryptString(projectJSON.ghToken);
//       if (projectJSON.ghUserName)
//         projectJSON.ghUserName = decryptString(projectJSON.ghUserName);
//       return projectJSON;
//     });
//
//     return sendSuccess(res, projectList);
//   } catch (error) {
//     logger.error('gh_projects/index get: ', error);
//     return sendError(res, 'Error occurred while retrieving credentials');
//   }
// });
//
// module.exports = router;
