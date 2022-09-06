const express = require('express');
const { body, param, validationResult } = require('express-validator');
const validatorUtil = require('../../utils/validator');
const logger = require('../../config/logger');
const router = express.Router();

const { constraint: Constraint } = require('../../models');


router.get( '/', async (req, res) => {
    try {
      const constraints = await Constraint.findAll();
      res.status(200).send(constraints)
    } catch (error) {
      logger.error(`Something went wrong`, error);
      res.status(500).json({ message: error.message });
    }
  },
);

router.delete( '/:id', [ param("id").isUUID(4) ], async (req, res) => {
    try {
      // Express validator
      const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
      if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
      // Route logic

      const { id } = req.params;
    
      const isRemoved = await Constraint.destroy({where:{id}});
      if(!isRemoved) throw new Error('Contraint was not removed!');

      res.status(200).send({ success: true, id });

    } catch (error) {
      logger.error(`Something went wrong`, error);
      res.status(500).json({ message: error.message });
    }
  },
);


router.post( '/',
  [
    body("id").optional({ checkFalsy: true }).isUUID(4),
    body("name").isString().notEmpty().escape().trim(),
    body("short_description").optional({ checkFalsy: true }).escape().trim(),
    body("description").optional({ checkFalsy: true }).trim()
  ],
  async (req, res) => {
    // Express validator
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
    // Route logic
    try {
    const constraint = req.body;

    if (!constraint.id){
      const newContraint = await Constraint.create(constraint);
      return res.status(200).send(newContraint)
    } else {
      const { id, ...restFields} = constraint;

      const existingContraint = await Constraint.findOne({where:{id}});
      if (!existingContraint) throw new Error("Contraint does not exist");

      const updated = await existingContraint.update(restFields);

      res.status(200).send(updated)
    }
    } catch (error) {
      logger.error(`Something went wrong`, error);
      res.status(500).json({ message: error.message });
    }
  },
);

module.exports = router;