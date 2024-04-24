const express = require('express');
const router = express.Router();
const {body, param, validationResult} = require('express-validator');

const logger = require("../../config/logger");
const models = require('../../models');
const TeamsHook = models.teams_hook;

// GET all teams hooks
router.get('/', async(req, res) => {
    try{
        const response = await TeamsHook.findAll({raw: true})
        res.status(200).send(response);
    }catch(err){
        logger.error(err);
        res.status(500).send('Error while fetching teams hooks. Try again later.');
    }
});

// POST create teams hook
router.post('/',  [
        body('name').isString().matches(/^[a-zA-Z0-9_ ()-]+$/).withMessage('Name is required and must be a string containing a-z, A-Z, 0-9, _'),
        body('url').isString().withMessage('URL is required and must be a string'),
        body('createdBy').isString().matches(/^[a-zA-Z0-9_ ]+$/).withMessage('CreatedBy is required and must be a string containing a-z, A-Z, 0-9, _'),
        body('lastModifiedBy').isString().matches(/^[a-zA-Z0-9_ ]+$/).withMessage('LastModified is required and must be a string containing a-z, A-Z, 0-9, _'),
        body('approved').optional().isBoolean().withMessage('Approved  must be a boolean'),
        body('approvedBy').optional().isString().matches(/^[a-zA-Z0-9_]+$/).withMessage('ApprovedBy  must be a string containing a-z, A-Z, 0-9, _'),
        body('metaData').optional({ nullable: true }).isJSON().withMessage('MetaData must be a valid JSON or null')
    ],
    async(req, res) => {
    try{
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(503).json({ errors: errors.array() });
        }
        const response = await TeamsHook.create(req.body);
        res.status(200).send(response);
        
    }catch(err){
        logger.error(err);
        res.status(500).send('Error while creating teams hook. Try again later.');
    }
});

// PUT edit teams hook
router.patch(
  "/",
  [
    (req, res, next) => {
        if(req.body.createdBy){
          delete req.body.createdBy;
        }
        next();
    },
    body('id').isUUID().withMessage('ID is required and must be a UUID'),
    body("name").optional().isString().matches(/^[a-zA-Z0-9_ ]+$/).withMessage("Name must be a string containing a-z, A-Z, 0-9, _"),
    body("url").optional().isString().withMessage("URL is required and must be a string"),
    body("lastModifiedBy").isString().matches(/^[a-zA-Z0-9_ ]+$/).withMessage("LastModified imust be a string containing a-z, A-Z, 0-9, _"),
    body("approved").optional().isBoolean().withMessage("Approved  must be a boolean"),
    body("approvedBy").optional().isString().matches(/^[a-zA-Z0-9_]+$/).withMessage("ApprovedBy  must be a string containing a-z, A-Z, 0-9, _"),
    body("metaData").optional({ nullable: true }).isJSON().withMessage("MetaData must be a valid JSON or null"),
  ],
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(503).json({ errors: errors.array() });
        }
      const response = await TeamsHook.update(req.body,{where: {id: req.body.id}});
      res.status(200).send(response);
    } catch (err) {
      logger.error(err);
      res.status(500).send("Error while updating teams hook. Try again later.");
    }
  }
);

// DELETE delete teams hook
router.delete('/:id',
[
    param('id').isUUID().withMessage('ID is required and must be a UUID')
],
 async(req, res) => {
    try{
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(503).json({ errors: errors.array() });
        }

        const response = await TeamsHook.destroy({where: {id: req.params.id}});
        res.status(200).send("Successfully deleted teams hook")
    }catch(err){
        logger.error(err);
        res.status(500).send('Error while deleting teams hook. Try again later.');
    }
});

module.exports = router;
