const express = require('express');
const router = express.Router();
const validatorUtil = require('../../utils/validator');
const { body, query, oneOf, validationResult } = require('express-validator');
let Sequelize = require('sequelize');
const Op = Sequelize.Op;
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
    //find groups with no parents (those directly under root group)
    let parentLevelGroups = groups.filter(group => group.parent_group == '');
    parentLevelGroups.forEach((parentLevelGroup, parentIdx) => {
      let key = '0-0-'+parentIdx;
      groupHierarchy.push({
        title: parentLevelGroup.name,
        id: parentLevelGroup.id,
        key: key,
        children: recursivelyPopulateGroup(parentLevelGroup, key)
      })
    })
    //add the whole hierarchy under root group
    resolve(
      [{
        title: 'Groups',
        key: '0-0',
        children: groupHierarchy
      }]
    )
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
        console.log(JSON.stringify(groupHierarchy));
        res.json(groupHierarchy);
      })

    })
    .catch((err) => {
        console.log(err);
    });
});

let getChildGroups = (appId, groupId) => {
  return new Promise((resolve, reject) => {
    let childGroups = [], whereClause={};
    if(groupId && groupId != undefined) {
      whereClause.application_id = appId;
      whereClause.parent_group = groupId
    } else {
      whereClause.application_id = appId;
      whereClause.parent_group = {[Op.or]:[null, '']};
    }
    Groups.findAll({where:whereClause, order: [['name', 'ASC']]}).then((groups) => {
      groups.forEach((group) => {
        childGroups.push({
          type: 'Group',
          id: group.id,
          name: group.name,
          description: group.description,
          createdAt: group.createdAt
        })
      })
      resolve(childGroups);
    }).catch((err) => {
      reject(err);
    })
  })
}

let getKeywordsForQuery = (keywords) => {
  if (keywords.startsWith("*") && keywords.endsWith("*")) {
    keywords = '%'+keywords.substring(1, keywords.length -1)+'%';
  } else if(keywords.startsWith("*")) {
    keywords = '%'+keywords.substring(1, keywords.length)+'%';
  } else if(keywords.endsWith("*")) {
    keywords = keywords.substring(0, keywords.length-1)+'%';
  } else if(keywords.startsWith("\"") && keywords.endsWith("\"")) {
    keywords = '%'+keywords.substring(1, keywords.length -1)+'%';
  } else if(keywords.indexOf(" ") > 0) {
    keywords = keywords.split(" ");
    console.log('space: '+keywords);
  } else {
    keywords = '%'+keywords+'%';
  }
  console.log(keywords)
  return keywords;
}

let prepareWhereClause = (keywords) => {
  let whereClause = {};
  //multiple keywords - https://github.com/sequelize/sequelize/issues/10940#issuecomment-655563737
  if(keywords instanceof Array) {
    whereClause = {[Op.or]: [
      {name: {[Op.regexp]: keywords.join('|')}},
      {title: {[Op.regexp]: keywords.join('|')}},
      {description: {[Op.regexp]: keywords.join('|')}}
    ]};
  } else {
    whereClause = {[Op.or]: [
      {name: {[Op.like]: keywords}},
      {title: {[Op.like]: keywords}},
      {description: {[Op.like]: keywords}}
    ]};
  }
  return whereClause;
}

router.get('/assets', [
  query('app_id').isUUID(4).withMessage('Invalid app id'),
  query('group_id').optional({checkFalsy:true}).isUUID(4).withMessage('Invalid group id'),
  query('assetTypeFilter').optional({checkFalsy:true}).matches(/^[a-zA-Z]{1}[a-zA-Z,]*$/).withMessage('Invalid assetTypeFilter'),
  query('keywords').optional({checkFalsy:true}).matches(/^[*"a-zA-Z]{1}[a-zA-Z0-9_ :.\-*"\"]*$/).withMessage('Invalid keywords')
], async (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
  }
  let assetTypeFilter = req.query.assetTypeFilter;
  let attributes = ['id', 'name', 'title', 'description', 'createdAt'];
  //if no asset types filter in request, include all
  let defaultIncludes = [{model:File, attributes:attributes, required: false}, {model:Job, attributes, required:false}, {model:Query, attributes:attributes, required:false}, {model:Index, attributes:attributes, required:false}];
  //filter by asset types
  if(assetTypeFilter) {
    let filteredIncludes = [];
    assetTypeFilter.split(',').forEach((modelFilter) => {
      filteredIncludes.push({model: models[modelFilter.toLowerCase()], attributes:attributes})
    })
    defaultIncludes =  filteredIncludes;
  }
  //keyword search
  if(req.query.keywords) {
    let keywords = getKeywordsForQuery(req.query.keywords);
    defaultIncludes = defaultIncludes.map((includes) => {
      includes.where = prepareWhereClause(keywords);
      return includes;
    })
  }

  let finalAssets = [], childGroups = [], whereClause = {};
  //include groups if it is not a search
  if(!assetTypeFilter && !req.query.keywords) {
    childGroups = await getChildGroups(req.query.app_id, req.query.group_id);
  }
  //get assets
  if(req.query.group_id && req.query.group_id != undefined) {
    whereClause.application_id = req.query.app_id;
    whereClause.id = req.query.group_id;
    Groups.findAll({where:whereClause,
      include: defaultIncludes,
      order: [['name', 'ASC']]
    }).then((assets) => {
      if(assets && assets.length > 0) {
        if(assets[0].files) {
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
        }
        if(assets[0].jobs) {
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
        }
        if(assets[0].indexes) {
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
        }
        if(assets[0].queries) {
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
        }
      }
      finalAssets.sort(comparator);
      finalAssets = childGroups.concat(finalAssets);
      res.json(finalAssets);
    }).catch(function(err) {
      console.log(err);
      return res.status(500).send("Error occured while retrieving assets");
    });
  } else {
    //TO:DO - Look for options to combine this into one query
    let promises=[];
    //if group_id is not passed, this must be a root dir. pull all assets for that app_id
    let whereClause = {application_id:req.query.app_id, groupId:{[Op.or]:[null, '']}};
    if(req.query.keywords) {
      let keywords = getKeywordsForQuery(req.query.keywords);
      whereClause[Op.or] = prepareWhereClause(keywords)[Op.or];
    }

    if(!assetTypeFilter || assetTypeFilter.split(',').includes('File')) {
      promises.push(File.findAll({where:whereClause}).then((files) => {
        files.forEach((file) => {
          finalAssets.push({
            type: 'File',
            id: file.id,
            name: file.name,
            title: file.title,
            description: file.description,
            createdAt: file.createdAt
          })
        })
      }))
    }
    if(!assetTypeFilter || assetTypeFilter.split(',').includes('Indexes')) {
      promises.push(Index.findAll({where:whereClause}).then((indexes) => {
        indexes.forEach((index) => {
          finalAssets.push({
            type: 'Index',
            id: index.id,
            name: index.name,
            title: index.title,
            description: index.description,
            createdAt: index.createdAt
          })
        })
      }))
    }
    if(!assetTypeFilter || assetTypeFilter.split(',').includes('Job')) {
      promises.push(Job.findAll({where:whereClause}).then((jobs) => {
        jobs.forEach((job) => {
          finalAssets.push({
            type: 'Job',
            id: job.id,
            name: job.name,
            title: job.title,
            description: job.description,
            createdAt: job.createdAt
          })
        })
      }))
    }
    if(!assetTypeFilter || assetTypeFilter.split(',').includes('Query')) {
      promises.push(Query.findAll({where:whereClause}).then((queries) => {
        queries.forEach((query) => {
          finalAssets.push({
            type: 'Query',
            id: query.id,
            name: query.name,
            title: query.title,
            description: query.description,
            createdAt: query.createdAt
          })
        })
      }))
    }
    Promise.all(promises).then(() => {
      finalAssets.sort(function(a,b){
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      if(childGroups) {
        finalAssets = childGroups.concat(finalAssets);
      }
      res.json(finalAssets);
    })
  }

});

let groupExistsWithSameName = (parentGroupId, name, appId) => {
  return new Promise((resolve, reject) => {
    Groups.findAll({where:{parent_group: parentGroupId, name: name, application_id: appId}}).then((results)  => {
      if(results.length > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    })
  })
}

router.post('/', [
  body('parentGroupId').optional({checkFalsy:true}).isUUID(4).withMessage('Invalid parent group id'),
  body('id').optional({checkFalsy:true}).isUUID(4).withMessage('Invalid id'),
  body('applicationId').isUUID(4).withMessage('Invalid application id'),
  body('name').matches(/^[a-zA-Z]{1}[a-zA-Z0-9_.\-:]*$/).withMessage('Invalid Name')
], async (req, res) => {
  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
    let parentGroupId = (req.body.parentGroupId && req.body.parentGroupId != '') ? req.body.parentGroupId : '';
    if(req.body.isNew) {
      let duplicateGroupName = await groupExistsWithSameName(parentGroupId, req.body.name, req.body.applicationId);
      if(duplicateGroupName) {
        res.status(400).send({"message":"There is already a group with the same name under the parent group. Please select a different name"});
      } else {
        Groups.create({
          name: req.body.name,
          description: req.body.description,
          application_id: req.body.applicationId,
          parent_group: parentGroupId
        }).then((groupCreated) => {
          res.json({"success":true})
        })
      }
    } else {
      Groups.findOne({where: {id:req.body.id, application_id:req.body.applicationId}}).then(async (group) => {
        let duplicateGroupName = false;
        if(group.name != req.body.name) {
          duplicateGroupName = await groupExistsWithSameName(group.parent_group, req.body.name, req.body.applicationId);
        }
        if(duplicateGroupName) {
            res.status(400).send({"message":"There is already a group with the same name under the parent group. Please select a different name"});
        } else {
          Groups.update({
            name: req.body.name,
            description: req.body.description
          }, {where:{id:req.body.id}}).then((groupUpdated) => {
            res.json({"success":true})
          })
        }
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

let comparator = ((a,b) => {
  return new Date(b.createdAt) - new Date(a.createdAt);
});

module.exports = router;