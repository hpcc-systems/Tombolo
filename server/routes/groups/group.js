const express = require('express');
const router = express.Router();
const validatorUtil = require('../../utils/validator');
const { body, query, oneOf, validationResult } = require('express-validator');
var models  = require('../../models');
let Groups = models.groups;
let Index = models.indexes;
let File = models.file;
let Query = models.query;
let Job = models.job;

let createGroupHierarchy = (groups) => {
  let recursivelyPopulateGroup = (parentLevelGroup, parentKey) => {
    let childGroupHierarchy = [];
    //recursively find all children
    let children = groups.filter(group => group.parent_group == parentLevelGroup.id)
    children.forEach((childGroup, idx) => {
      let key = parentKey + '-' + idx
      childGroupHierarchy.push({
        title: childGroup.name,
        id: childGroup.id,
        key: key,
        children: recursivelyPopulateGroup(childGroup, key)
      })
    })

    return childGroupHierarchy;
  }

  return new Promise((resolve, reject) => {
    let groupHierarchy=[];
    let parentLevelGroups = groups.filter(group => group.parent_group == '');
    parentLevelGroups.forEach((parentLevelGroup, parentIdx) => {
      let key = '0-'+parentIdx;
      groupHierarchy.push({
        title: parentLevelGroup.name,
        id: parentLevelGroup.id,
        key: key,
        children: recursivelyPopulateGroup(parentLevelGroup, key)
      })
    })
    resolve(groupHierarchy)
  })
}

router.get('/details', [
  query('app_id').isUUID(4).withMessage('Invalid app id'),
  query('group_id').isUUID(4).withMessage('Invalid group id')
], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }
    Groups.findOne({where:{"application_id":req.query.app_id, "id":req.query.group_id}}).then(function(group) {
      res.json(group);
    })
    .catch(function(err) {
        console.log(err);
    });
});

router.get('/', [
  query('app_id')
    .isUUID(4).withMessage('Invalid app id')
], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }
    Groups.findAll({where:{"application_id":req.query.app_id}, order: [['name', 'ASC']]}).then(function(groups) {
      createGroupHierarchy(groups).then((groupHierarchy) => {
        res.json(groupHierarchy);
      })

    })
    .catch(function(err) {
        console.log(err);
    });
});

router.get('/assets', [
  query('app_id').isUUID(4).withMessage('Invalid app id'),
  query('group_id').isUUID(4).withMessage('Invalid group id')
], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }
    console.log("[groups/group.js] - Get groups for app_id = " + req.query.app_id);
    Groups.findAll({where:{"application_id":req.query.app_id, "id":req.query.group_id},
      include: [{model:File, attributes:['id', 'name', 'title', 'description', 'createdAt']}, {model:Job, attributes:['id', 'name', 'title', 'description', 'createdAt']}, {model:Query, attributes:['id', 'name', 'title', 'description', 'createdAt']}, {model:Index, attributes:['id', 'name', 'title', 'description', 'createdAt']}],
      order: [['name', 'ASC']]
    }).then(function(assets) {
      let finalAssets = [];
      assets[0].files.forEach((file) => {
        finalAssets.push({
          type: 'File',
          id: file.id,
          name: file.name,
          title: file.title,
          description: file.description,
          createdAt: file.createdAt
        })
      })
      assets[0].jobs.forEach((job) => {
        finalAssets.push({
          type: 'Job',
          id: job.id,
          name: job.name,
          title: job.title,
          description: job.description,
          createdAt: job.createdAt
        })
      })
      assets[0].indexes.forEach((index) => {
        finalAssets.push({
          type: 'Index',
          id: index.id,
          name: index.name,
          title: index.title,
          description: index.description,
          createdAt: index.createdAt
        })
      })
      assets[0].queries.forEach((query) => {
        finalAssets.push({
          type: 'Query',
          id: query.id,
          name: query.name,
          title: query.title,
          description: query.description,
          createdAt: query.createdAt
        })
      })
      //finalAssets = finalAssets.concat(assets[0].files).concat(assets[0].indexes).concat(assets[0].jobs).concat(assets[0].queries)
      res.json(finalAssets);
    })
    .catch(function(err) {
        console.log(err);
    });
});

router.post('/', [
  body('parentGroupId').optional({checkFalsy:true}).isUUID(4).withMessage('Invalid parent group id'),
  body('id').optional({checkFalsy:true}).isUUID(4).withMessage('Invalid id'),
  body('applicationId').isUUID(4).withMessage('Invalid application id'),
  body('name').matches(/^[a-zA-Z]{1}[a-zA-Z0-9_.\-:]*$/).withMessage('Invalid Name')
], (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
    if(req.body.isNew) {
      Groups.create({
        name: req.body.name,
        description: req.body.description,
        application_id: req.body.applicationId,
        parent_group: req.body.parentGroupId
      }).then((groupCreated) => {
        res.json({"success":true})
      })
    } else {
      Groups.update({
        name: req.body.name,
        description: req.body.description
      }, {where:{id:req.body.id}}).then((groupUpdated) => {
        res.json({"success":true})
      })
    }
  } catch (err) {
    console.log(err)
    return res.status(500).send("Error occured while saving Group");
  }
});

let canDeleteGroup = (group_id, appId) => {
  return new Promise((resolve, reject) => {
    Groups.findAll({where:{"application_id":appId, "id":group_id},
      include: [{model:File, attributes:['id', 'name', 'title', 'description', 'createdAt']}, {model:Job, attributes:['id', 'name', 'title', 'description', 'createdAt']}, {model:Query, attributes:['id', 'name', 'title', 'description', 'createdAt']}, {model:Index, attributes:['id', 'name', 'title', 'description', 'createdAt']}],
      order: [['name', 'ASC']]
    }).then((groups) => {
      if(groups[0].files.length > 0 || groups[0].jobs.length > 0 || groups[0].indexes.length || groups[0].queries.length) {
        resolve(false)
      } else {
        Groups.findAll({where:{parent_group:group_id, "application_id":appId}}).then((groups) => {
          if(groups.length > 0) {
            resolve(false);
          } else {
            resolve(true);
          }
        })
      }
    })
  })
}

router.delete('/', [
  body('app_id').isUUID(4).withMessage('Invalid app id'),
  body('group_id').isUUID(4).withMessage('Invalid group id')
], async (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      const deleteGroup = await canDeleteGroup(req.body.group_id, req.body.app_id);

      if(deleteGroup) {
        Groups.destroy({where:{"application_id":req.body.app_id, "id":req.body.group_id}}).then((groupDeleted) => {
          res.json({"success":true})
        })
      } else {
        res.status(400).send({"message":"The selected Group is not empty. Please empty the content of the group before it can be deleted"});
      }

    } catch (err) {
      console.log(err)
      return res.status(500).send("Error occured while deleting the Group");
    }

});

router.put('/move', [
  body('app_id').isUUID(4).withMessage('Invalid app id'),
  body('groupId').isUUID(4).withMessage('Invalid group id'),
  body('destGroupId').isUUID(4).withMessage('Invalid target group id')
], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }
    Groups.update({
      parent_group: req.body.destGroupId
    }, {where:{id:req.body.groupId, application_id:req.body.app_id}}).then((groupUpdated) => {
      res.json({"success":true})
    })
    .catch(function(err) {
      console.log(err);
      return res.status(500).send("Error occured while moving group");
    });
});

router.put('/move/asset', [
  body('app_id').isUUID(4).withMessage('Invalid app id'),
  body('assetId').isUUID(4).withMessage('Invalid asset id'),
  body('destGroupId').isUUID(4).withMessage('Invalid target group id'),
  body('assetType').matches(/^[a-zA-Z]/).withMessage('Invalid asset type')
], (req, res) => {
    const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }
    let appId = req.body.app_id, assetId = req.body.assetId, destGroupId = req.body.destGroupId;
    try {
      switch (req.body.assetType) {
        case 'File':
          File.update({groupId:destGroupId}, {where:{application_id:appId, id:assetId}}).then((updated) => {
            res.json({"success":true});
          })
          break;
        case 'Index':
          Index.update({groupId:destGroupId}, {where:{application_id:appId, id:assetId}}).then((updated) => {
            res.json({"success":true});
          })
          break;
        case 'Job':
          Job.update({groupId:destGroupId}, {where:{application_id:appId, id:assetId}}).then((updated) => {
            res.json({"success":true});
          })
          break;
        case 'Query':
          Query.update({groupId:destGroupId}, {where:{application_id:appId, id:assetId}}).then((updated) => {
            res.json({"success":true});
          })
          break;
      }
  } catch(err) {
    console.log(err);
    return res.status(500).send("Error occured while moving asset");
  }
});

module.exports = router;