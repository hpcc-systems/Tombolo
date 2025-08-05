const express = require('express');
const router = express.Router();
const { GithubRepoSetting } = require('../../models');
const { encryptString, decryptString } = require('../../utils/cipher');
const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateCreateGhProject,
  validateDeleteGhProject,
  validateGetGhProjects,
} = require('../../middlewares/ghProjectsMiddleware');
const logger = require('../../config/logger');

router.post('/', validate(validateCreateGhProject), async (req, res) => {
  try {
    let {
      id,
      application_id,
      ghBranchOrTag,
      ghLink,
      ghProject,
      ghToken,
      ghUserName,
    } = req.body;

    if (ghToken) ghToken = encryptString(ghToken);
    if (ghUserName) ghUserName = encryptString(ghUserName);

    let project;

    const defaultFields = {
      ghBranchOrTag,
      ghLink,
      ghProject,
      ghToken,
      ghUserName,
    };

    if (id) {
      project = await GithubRepoSetting.findOne({ where: { id } });
      if (!project) throw new Error('Project does not exist');
      project = await project.update(defaultFields);
    } else {
      project = await GithubRepoSetting.create({
        ...defaultFields,
        application_id,
      });
    }

    const projectToJson = project.toJSON();

    logger.info('------------------------------------------');
    logger.info({ projectToJson, defaultFields });
    logger.info('------------------------------------------');

    return res.status(200).send({ success: true, id: project.id });
  } catch (error) {
    logger.error('-error-----------------------------------------');
    logger.error(error);
    logger.error('------------------------------------------');

    return res.status(500).send('Error occurred while saving project');
  }
});

router.delete('/', validate(validateDeleteGhProject), async (req, res) => {
  try {
    let { id, application_id } = req.query;

    const deleted = await GithubRepoSetting.destroy({
      where: { id, application_id },
    });
    if (!deleted) throw new Error('Project does not exist');

    return res.status(200).send({ success: true });
  } catch (error) {
    logger.error('-error-----------------------------------------');
    logger.error(error);
    logger.error('------------------------------------------');

    return res.status(500).send('Error occurred while saving project');
  }
});

router.get('/', validate(validateGetGhProjects), async (req, res) => {
  try {
    const application_id = req.query.application_id;

    const projects = await GithubRepoSetting.findAll({
      where: { application_id },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    const projectList = projects.map(project => {
      const projectJSON = project.toJSON();
      if (projectJSON.ghToken)
        projectJSON.ghToken = decryptString(projectJSON.ghToken);
      if (projectJSON.ghUserName)
        projectJSON.ghUserName = decryptString(projectJSON.ghUserName);
      return projectJSON;
    });

    return res.status(200).send(projectList);
  } catch (error) {
    logger.error('-error-----------------------------------------');
    logger.error(error);
    logger.error('------------------------------------------');

    return res.status(500).send('Error occurred while retreiving credentials');
  }
});

module.exports = router;
