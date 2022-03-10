const express = require('express');
const router = express.Router();
const { github_repo_settings: GHprojects } = require('../../models');
const { encryptString, decryptString } = require('../../utils/cipher');
const { body, query, validationResult } = require('express-validator');
const validatorUtil = require('../../utils/validator');

router.post( '/',
  [
    body('id').optional({ checkFalsy: true }).isUUID(4).withMessage('Invalid id'),
    body('application_id').isUUID(4).withMessage('Invalid application id'),
    body('ghProject') .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_. \-:]*$/) .withMessage('Invalid name'),
    body('ghLink').isURL().withMessage('Invalid GitHub Link'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  
    try {
      let { id, application_id, ghBranchOrTag, ghLink, ghProject, ghToken, ghUserName } = req.body;
  
      if (ghToken) ghToken = encryptString(ghToken);
      if (ghUserName) ghUserName = encryptString(ghUserName);
  
      let project;
  
      const defaultFields = { ghBranchOrTag, ghLink, ghProject, ghToken, ghUserName };
  
      if (id) {
        project = await GHprojects.findOne({ where: {id} });
        if (!project) throw new Error('Project does not exist');
        project = await project.update(defaultFields);
      } else {
        project = await GHprojects.create({ ...defaultFields, application_id });
      }
  
      const projectToJson = project.toJSON();
  
      console.log('------------------------------------------');
      console.dir({ projectToJson, defaultFields }, { depth: null });
      console.log('------------------------------------------');
  
      res.send({ success: true, id: project.id });
    } catch (error) {
      console.log('-error-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
      res.status(500).send('Error occurred while saving project');
    }
  }
);


router.delete('/',
  [
    query('id').isUUID(4).withMessage('Invalid id'),
    query('application_id').isUUID(4).withMessage('Invalid application id'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  
    try {
      let { id, application_id } = req.query;

      const deleted = await GHprojects.destroy({ where: {id, application_id} });
      if (!deleted) throw new Error('Project does not exist');
      res.send({ success: true});

    } catch (error) {
      console.log('-error-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
      res.status(500).send('Error occurred while saving project');
    }
  }
);

router.get('/',
  [query('application_Id').isUUID(4).withMessage('Invalid application id')],
  async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    try {
      const application_id = req.query.application_id;

      const projects = await GHprojects.findAll({
        where: { application_id },
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
      });

      const projectList = projects.map((project) => {
        const projectJSON = project.toJSON();
        if (projectJSON.ghToken) projectJSON.ghToken = decryptString(projectJSON.ghToken);
        if (projectJSON.ghUserName) projectJSON.ghUserName = decryptString(projectJSON.ghUserName);
        return projectJSON;
      });

      console.log('-projectList-----------------------------------------');
      console.dir({ projectList }, { depth: null });
      console.log('------------------------------------------');

      res.send(projectList);
    } catch (error) {
      console.log('-error-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
      res.status(500).send('Error occurred while retreiving credentials');
    }
  }
);

module.exports = router;
