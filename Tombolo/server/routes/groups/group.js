const express = require('express');
const router = express.Router();
const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateGetDetails,
  validateGetGroup,
  validateGetAssets,
  validateGetNestedAssets,
  validateAssetsSearch,
  validateCreateGroup,
  validateDeleteGroup,
  validateMoveGroup,
  validateMoveAsset,
} = require('../../middlewares/groupMiddleware');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {
  Group,
  indexes: Index,
  File,
  Query,
  Job,
  AssetsGroup,
  FileTemplate,
  sequelize,
} = require('../../models');
const logger = require('../../config/logger');

let createGroupHierarchy = groups => {
  let recursivelyPopulateGroup = (parentLevelGroup, parentKey) => {
    let childGroupHierarchy = [];
    //recursively find all children
    let children = groups.filter(
      group => group.parent_group == parentLevelGroup.id
    );
    children.forEach((childGroup, idx) => {
      let key = parentKey + '-' + idx;
      childGroupHierarchy.push({
        title: childGroup.name,
        id: childGroup.id,
        key: key,
        children: recursivelyPopulateGroup(childGroup, key),
      });
    });

    return childGroupHierarchy;
  };

  return new Promise((resolve, reject) => {
    let groupHierarchy = [];
    //find groups with no parents (those directly under root group)
    let parentLevelGroups = groups.filter(group => group.parent_group == '');
    parentLevelGroups.forEach((parentLevelGroup, parentIdx) => {
      let key = '0-0-' + parentIdx;
      groupHierarchy.push({
        title: parentLevelGroup.name,
        id: parentLevelGroup.id,
        key: key,
        children: recursivelyPopulateGroup(parentLevelGroup, key),
      });
    });
    //add the whole hierarchy under root group
    resolve([
      {
        title: 'Groups',
        key: '0-0',
        children: groupHierarchy,
      },
    ]);
  });
};

router.get('/details', validate(validateGetDetails), async (req, res) => {
  try {
    const group = await Group.findOne({
      where: { application_id: req.query.app_id, id: req.query.group_id },
    });
    return res.status(200).json(group);
  } catch (err) {
    logger.error('group details: ', err);
    return res.status(500).json({ error: err });
  }
});

router.get('/', validate(validateGetGroup), async (req, res) => {
  try {
    const groups = await Group.findAll({
      where: { application_id: req.query.app_id },
      order: [['name', 'ASC']],
    });

    const groupHierarchy = await createGroupHierarchy(groups);
    return res.status(200).json(groupHierarchy);
  } catch (err) {
    logger.error('getGroups: ', err);
    return res.status(500).json({ message: 'Failed to get groups' });
  }
});

let getChildGroups = async (appId, groupId) => {
  let childGroups = [],
    whereClause = {};
  if (groupId && groupId != undefined) {
    whereClause.application_id = appId;
    whereClause.parent_group = groupId;
  } else {
    whereClause.application_id = appId;
    whereClause.parent_group = { [Op.or]: [null, ''] };
  }

  const groups = await Group.findAll({
    where: whereClause,
    order: [['name', 'ASC']],
  });
  groups.forEach(group => {
    childGroups.push({
      type: 'Group',
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt,
    });
  });
};

let getKeywordsForQuery = keywords => {
  if (typeof keywords !== 'string') return;

  if (keywords.startsWith('*') && keywords.endsWith('*')) {
    //keywords = '%'+keywords.substring(1, keywords.length -1)+'%';
    keywords = keywords.substring(1, keywords.length - 1);
  } else if (keywords.startsWith('*')) {
    //keywords = '%'+keywords.substring(1, keywords.length)+'%';
    keywords = keywords.substring(1, keywords.length) + '$';
  } else if (keywords.endsWith('*')) {
    //keywords = keywords.substring(0, keywords.length-1)+'%';
    keywords = '^' + keywords.substring(0, keywords.length - 1);
  } else if (keywords.startsWith('"') && keywords.endsWith('"')) {
    //keywords = '%'+keywords.substring(1, keywords.length -1)+'%';
    keywords = '/^' + keywords.substring(1, keywords.length - 1) + '$/';
  } else if (keywords.indexOf(' ') > 0) {
    keywords = keywords.split(' ').join('|');
  } else {
    //keywords = '%'+keywords+'%';
    keywords = keywords;
  }
  logger.verbose('keywords for group query: ', keywords);
  return keywords;
};

// Not used
// let prepareWhereClause = keywords => {
//   let whereClause = {};
//   //multiple keywords - https://github.com/sequelize/sequelize/issues/10940#issuecomment-655563737
//   if (keywords instanceof Array) {
//     whereClause = {
//       [Op.or]: [
//         { name: { [Op.regexp]: keywords.join('|') } },
//         { title: { [Op.regexp]: keywords.join('|') } },
//         { description: { [Op.regexp]: keywords.join('|') } },
//       ],
//     };
//   } else {
//     whereClause = {
//       [Op.or]: [
//         { name: { [Op.like]: keywords } },
//         { title: { [Op.like]: keywords } },
//         { description: { [Op.like]: keywords } },
//       ],
//     };
//   }
//   return whereClause;
// };

router.get('/assets', validate(validateGetAssets), (req, res) => {
  let finalAssets = [];
  if (req.query.group_id && req.query.group_id != undefined) {
    Group.findAll({
      where: {
        application_id: req.query.app_id,
        id: req.query.group_id,
      },
      include: [
        {
          model: File,
          as: 'files',
          attributes: ['id', 'name', 'title', 'description', 'createdAt'],
        },
        {
          model: FileTemplate,
          as: 'fileTemplates',
          attributes: ['id', 'title', 'description', 'createdAt'],
        },
        {
          model: Job,
          as: 'jobs',
          attributes: ['id', 'name', 'title', 'description', 'createdAt'],
        },
        {
          model: Query,
          as: 'queries',
          attributes: ['id', 'name', 'title', 'description', 'createdAt'],
        },
        {
          model: Index,
          as: 'indexes',
          attributes: ['id', 'name', 'title', 'description', 'createdAt'],
        },
      ],
      order: [['name', 'ASC']],
    })
      .then(async assets => {
        let childGroups = await getChildGroups(
          req.query.app_id,
          req.query.group_id
        );
        assets[0] &&
          assets[0].files.forEach(file => {
            finalAssets.push({
              type: 'File',
              id: file.id,
              name: file.name,
              title: file.title,
              description: file.description,
              createdAt: file.createdAt,
            });
          });
        assets[0] &&
          assets[0].fileTemplates.forEach(fileTemplate => {
            finalAssets.push({
              type: 'File Template',
              id: fileTemplate.id,
              title: fileTemplate.title,
              description: fileTemplate.description,
              createdAt: fileTemplate.createdAt,
            });
          });
        assets[0] &&
          assets[0].jobs.forEach(job => {
            finalAssets.push({
              type: 'Job',
              id: job.id,
              name: job.name,
              title: job.title,
              description: job.description,
              createdAt: job.createdAt,
            });
          });
        assets[0] &&
          assets[0].indexes.forEach(index => {
            finalAssets.push({
              type: 'Index',
              id: index.id,
              name: index.name,
              title: index.title,
              description: index.description,
              createdAt: index.createdAt,
            });
          });
        assets[0] &&
          assets[0].queries.forEach(query => {
            finalAssets.push({
              type: 'Query',
              id: query.id,
              name: query.name,
              title: query.title,
              description: query.description,
              createdAt: query.createdAt,
            });
          });

        finalAssets.sort(comparator);
        finalAssets = childGroups.concat(finalAssets);
        res.json(finalAssets);
      })
      .catch(function (err) {
        logger.error('Error occurred while retrieving assets for group: ', err);
      });
  } else {
    let promises = [],
      finalGroups = [];
    //if group_id is not passed, this could be a root dir. pull all assets for that app_id

    promises.push(
      File.findAll({
        where: {
          application_id: req.query.app_id,
          [Op.and]: Sequelize.literal(
            'not exists (select * from assets_groups where assets_groups.assetId = file.id)'
          ),
        },
      }).then(files => {
        files.forEach(file => {
          finalAssets.push({
            type: 'File',
            id: file.id,
            name: file.name,
            cluster_id: file.cluster_id,
            title: file.title,
            description: file.description,
            createdAt: file.createdAt,
          });
        });
      })
    );

    promises.push(
      FileTemplate.findAll({
        where: {
          application_id: req.query.app_id,
          [Op.and]: Sequelize.literal(
            'not exists (select * from assets_groups where assets_groups.assetId = fileTemplate.id)'
          ),
        },
      }).then(fileTemplates => {
        fileTemplates.forEach(fileTemplate => {
          finalAssets.push({
            type: 'File Template',
            id: fileTemplate.id,
            cluster_id: fileTemplate.cluster_id,
            title: fileTemplate.title,
            description: fileTemplate.description,
            createdAt: fileTemplate.createdAt,
          });
        });
      })
    );

    promises.push(
      Index.findAll({
        where: {
          application_id: req.query.app_id,
          [Op.and]: Sequelize.literal(
            'not exists (select * from assets_groups where assets_groups.assetId = indexes.id)'
          ),
        },
      }).then(indexes => {
        indexes.forEach(index => {
          finalAssets.push({
            type: 'Index',
            id: index.id,
            name: index.name,
            title: index.title,
            description: index.description,
            createdAt: index.createdAt,
          });
        });
      })
    );

    promises.push(
      Job.findAll({
        where: {
          application_id: req.query.app_id,
          [Op.and]: Sequelize.literal(
            'not exists (select * from assets_groups where assets_groups.assetId = job.id)'
          ),
        },
        attributes: ['id', 'name', 'title', 'description', 'createdAt'],
      }).then(jobs => {
        jobs.forEach(job => {
          finalAssets.push({
            type: 'Job',
            id: job.id,
            name: job.name,
            title: job.title,
            description: job.description,
            createdAt: job.createdAt,
          });
        });
      })
    );

    promises.push(
      Query.findAll({
        where: {
          application_id: req.query.app_id,
          [Op.and]: Sequelize.literal(
            'not exists (select * from assets_groups where assets_groups.assetId = query.id)'
          ),
        },
      }).then(queries => {
        queries.forEach(query => {
          finalAssets.push({
            type: 'Query',
            id: query.id,
            name: query.name,
            title: query.title,
            description: query.description,
            createdAt: query.createdAt,
          });
        });
      })
    );

    promises.push(
      Group.findAll({
        where: {
          application_id: req.query.app_id,
          parent_group: { [Op.or]: [null, ''] },
        },
        order: [['name', 'ASC']],
      }).then(groups => {
        groups.forEach(group => {
          finalGroups.push({
            type: 'Group',
            id: group.id,
            name: group.name,
            description: group.description,
            createdAt: group.createdAt,
          });
        });
      })
    );

    Promise.all(promises).then(() => {
      finalAssets.sort(comparator);

      finalAssets = finalGroups.concat(finalAssets);
      res.json(finalAssets);
    });
  }
});

router.get(
  '/nestedAssets',
  validate(validateGetNestedAssets),
  async (req, res) => {
    const replacements = {
      applicationId: req.query.app_id,
      groupId: req.query.group_id,
    };
    // eslint-disable-next-line quotes
    let query = `select assets.id, assets.name, assets.title, assets.description, assets.createdAt, assets.type, hie.name as group_name, hie.id as groupId from (select  id, name, parent_group from    (select * from groups order by parent_group, id) groups_sorted, (select @pv := (:groupId)) initialisation where find_in_set(parent_group, @pv) and length(@pv := concat(@pv, ',', id)) > 0 or id=(:groupId)) as hie join (select f.id, f.name, ag.groupId, f.title, f.description, f.createdAt, 'File' as type from file f, assets_groups ag where f.application_id = (:applicationId) and ag.assetId=f.id union all select q.id, q.name, ag.groupId, q.title, q.description, q.createdAt, 'Query' as type from query q, assets_groups ag where q.application_id = (:applicationId) and ag.assetId=q.id union all select idx.id, idx.name, ag.groupId, idx.title, idx.description, idx.createdAt, 'Index' as type  from indexes idx, assets_groups ag where idx.application_id = (:applicationId) and ag.assetId=idx.id union all select j.id, j.name, ag.groupId, j.title, j.description, j.createdAt, 'Job' as type  from job j, assets_groups ag where j.application_id = (:applicationId) and j.id = ag.assetId union all select g.id, g.name, g.parent_group, g.name as title, g.description, g.createdAt, 'Group' as type  from groups g where g.application_id = (:applicationId) ) as assets on (assets.groupId = hie.id) `;
    try {
      const assets = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        replacements: replacements,
      });
      return res.status(200).json(assets);
    } catch (err) {
      logger.error('group nestedAssets: ', err);
      return res.status(500).send('Error occurred while retrieving assets');
    }
  }
);

router.get(
  '/assetsSearch',
  validate(validateAssetsSearch),
  async (req, res) => {
    let replacements = {},
      query;
    let keywords = getKeywordsForQuery(req.query.keywords);
    let assetFilters = req.query.assetTypeFilter
      ? req.query.assetTypeFilter.split(',')
      : [];
    if (req.query.group_id) {
      query =
        'select assets.id, assets.name, assets.title, assets.description, assets.createdAt, assets.type, hie.name as group_name, hie.id as groupId from ' +
        '(select  id, name, parent_group ' +
        'from (select * from `groups` ' +
        'order by parent_group, id) groups_sorted, ' +
        '(select @pv := (:groupId)) initialisation ' +
        // eslint-disable-next-line quotes
        "where find_in_set(parent_group, @pv) and length(@pv := concat(@pv, ',', id)) > 0 or id=(:groupId)) as hie " +
        'join (';
      if (assetFilters.length == 0 || assetFilters.includes('File')) {
        query +=
          // eslint-disable-next-line quotes
          "select f.id, f.name, ag.groupId, f.title, f.description, f.createdAt, 'File' as type from file f, assets_groups ag where f.application_id = (:applicationId) and ag.assetId=f.id and f.deletedAt IS NULL and (f.name REGEXP (:keyword) or f.title REGEXP (:keyword)) ";
        query +=
          assetFilters.length == 0 || assetFilters.length > 1
            ? 'union all '
            : '';
      }
      if (assetFilters.length == 0 || assetFilters.includes('Query')) {
        query +=
          // eslint-disable-next-line quotes
          "select q.id, q.name, ag.groupId, q.title, q.description, q.createdAt, 'Query' as type from query q, assets_groups ag where q.application_id = (:applicationId) and ag.assetId=q.id and q.deletedAt IS NULL and (q.name REGEXP (:keyword) or q.title REGEXP (:keyword)) ";
        query +=
          assetFilters.length == 0 || assetFilters.length > 1
            ? 'union all '
            : '';
      }
      if (assetFilters.length == 0 || assetFilters.includes('Indexes')) {
        query +=
          // eslint-disable-next-line quotes
          "select idx.id, idx.name, ag.groupId, idx.title, idx.description, idx.createdAt, 'Index' as type  from indexes idx, assets_groups ag where idx.application_id = (:applicationId) and ag.assetId=idx.id and idx.deletedAt IS NULL and (idx.name REGEXP (:keyword) or idx.title REGEXP (:keyword)) ";
        query +=
          assetFilters.length == 0 || assetFilters.length > 1
            ? 'union all '
            : '';
      }
      if (assetFilters.length == 0 || assetFilters.includes('Job')) {
        query +=
          // eslint-disable-next-line quotes
          "select j.id, j.name, ag.groupId, j.title, j.description, j.createdAt, 'Job' as type  from job j, assets_groups ag where j.application_id = (:applicationId) and j.id = ag.assetId and j.deletedAt IS NULL and (j.name REGEXP (:keyword) or j.title REGEXP (:keyword)) ";
        query +=
          assetFilters.length == 0 || assetFilters.length > 1
            ? 'union all '
            : '';
      }
      if (assetFilters.length == 0 || assetFilters.includes('Groups')) {
        query +=
          // eslint-disable-next-line quotes
          "select g.id, g.name, g.parent_group, g.name as title, g.description, g.createdAt, 'Group' as type  from `groups` g where g.application_id = (:applicationId) and (g.name REGEXP (:keyword) and g.deletedAt IS NULL) ";
        query +=
          assetFilters.length == 0 || assetFilters.length > 1
            ? 'union all '
            : '';
      }

      query = query.endsWith(' union all ')
        ? query.substring(0, query.lastIndexOf(' union all '))
        : query;
      query += ' ) as assets on (assets.groupId = hie.id) ';
      replacements = {
        applicationId: req.query.app_id,
        groupId: req.query.group_id,
        keyword: keywords,
      };
    } else {
      query = '';
      if (assetFilters.length == 0 || assetFilters.includes('File')) {
        query +=
          // eslint-disable-next-line quotes
          "select files_res.*, g.name as group_name from (select f.id, f.name, ag.groupId, f.title, f.description, f.createdAt, 'File' as type from file f left join assets_groups ag on f.id = ag.assetId where f.application_id = (:applicationId) and  (f.name REGEXP (:keyword) or f.title REGEXP (:keyword)) and f.deletedAt IS NULL) as files_res left join `groups` g on files_res.groupId = g.id ";
        query +=
          assetFilters.length == 0 || assetFilters.length > 1
            ? 'union all '
            : '';
      }
      if (assetFilters.length == 0 || assetFilters.includes('Query')) {
        query +=
          // eslint-disable-next-line quotes
          "select queries_res.*, g.name as group_name from (select q.id, q.name, ag.groupId, q.title, q.description, q.createdAt, 'Query' as type from query q left join assets_groups ag on q.id = ag.assetId where q.application_id = (:applicationId) and  (q.name REGEXP (:keyword) or q.title REGEXP (:keyword)) and q.deletedAt IS NULL) as queries_res left join `groups` g on queries_res.groupId = g.id ";
        query +=
          assetFilters.length == 0 || assetFilters.length > 1
            ? 'union all '
            : '';
      }
      if (assetFilters.length == 0 || assetFilters.includes('Indexes')) {
        query +=
          // eslint-disable-next-line quotes
          "select idx_res.*, g.name as group_name from (select idx.id, idx.name, ag.groupId, idx.title, idx.description, idx.createdAt, 'Index' as type from indexes idx left join assets_groups ag on idx.id = ag.assetId where idx.application_id = (:applicationId) and  (idx.name REGEXP (:keyword) or idx.title REGEXP (:keyword)) and idx.deletedAt IS NULL) as idx_res left join `groups` g on idx_res.groupId = g.id ";
        query +=
          assetFilters.length == 0 || assetFilters.length > 1
            ? 'union all '
            : '';
      }
      if (assetFilters.length == 0 || assetFilters.includes('Job')) {
        query +=
          // eslint-disable-next-line quotes
          "select j_res.*, g.name as group_name from (select j.id, j.name, ag.groupId, j.title, j.description, j.createdAt, 'Job' as type from job j left join assets_groups ag on j.id = ag.assetId where j.application_id = (:applicationId) and  (j.name REGEXP (:keyword) or j.title REGEXP (:keyword)) and j.deletedAt IS NULL) as j_res left join `groups` g on j_res.groupId = g.id ";
        query +=
          assetFilters.length == 0 || assetFilters.length > 1
            ? 'union all '
            : '';
      }
      if (assetFilters.length == 0 || assetFilters.includes('Groups')) {
        query +=
          // eslint-disable-next-line quotes
          "select g.id, g.name, g.parent_group as groupId, gp.name as group_name, '' as title, g.description, g.createdAt, 'Group' as type  from `groups` g inner join `groups` gp on g.parent_group = gp.id where g.application_id = (:applicationId) and g.name REGEXP (:keyword) and g.deletedAt IS NULL";
        //query += (assetFilters.length == 0 || assetFilters.length > 1) ? "union all " : "";
      }
      replacements = { applicationId: req.query.app_id, keyword: keywords };
    }

    try {
      const assets = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        replacements: replacements,
      });
      return res.status(200).json(assets);
    } catch (err) {
      logger.error('assetsSearch: ', err);
      return res.status(500).send('Error occurred while retrieving assets');
    }
  }
);

let groupExistsWithSameName = async (parentGroupId, name, appId) => {
  const results = Group.findAll({
    where: { parent_group: parentGroupId, name: name, application_id: appId },
  });

  return results.length > 0;
};

router.post('/', validate(validateCreateGroup), async (req, res) => {
  try {
    let parentGroupId =
      req.body.parentGroupId && req.body.parentGroupId != ''
        ? req.body.parentGroupId
        : '';

    if (req.body.isNew) {
      let duplicateGroupName = await groupExistsWithSameName(
        parentGroupId,
        req.body.name,
        req.body.applicationId
      );
      if (duplicateGroupName)
        return res.status(400).send({
          message:
            'There is already a group with the same name under the parent group. Please select a different name',
        });

      const groupCreated = await Group.create({
        name: req.body.name,
        description: req.body.description,
        application_id: req.body.applicationId,
        parent_group: parentGroupId,
      });
      return res.status(200).json({ success: true, id: groupCreated.id });
    }

    const group = await Group.findOne({
      where: { id: req.body.id, application_id: req.body.applicationId },
    });

    let duplicateGroupName = false;
    if (group.name != req.body.name) {
      duplicateGroupName = await groupExistsWithSameName(
        group.parent_group,
        req.body.name,
        req.body.applicationId
      );
    }
    if (duplicateGroupName)
      return res.status(400).send({
        message:
          'There is already a group with the same name under the parent group. Please select a different name',
      });

    const groupUpdated = await Group.update(
      {
        name: req.body.name,
        description: req.body.description,
      },
      { where: { id: req.body.id } }
    );

    return res.status(200).json({ success: true, id: groupUpdated.id });
  } catch (err) {
    logger.error('group create: ', err);
    return res.status(500).send('Error occured while saving Group');
  }
});

let canDeleteGroup = async (group_id, appId) => {
  const groups = await Group.findAll({
    where: { application_id: appId, id: group_id },
    include: [
      {
        model: File,
        as: 'files',
        attributes: ['id', 'name', 'title', 'description', 'createdAt'],
      },
      {
        model: Job,
        as: 'jobs',
        attributes: ['id', 'name', 'title', 'description', 'createdAt'],
      },
      {
        model: Query,
        as: 'queries',
        attributes: ['id', 'name', 'title', 'description', 'createdAt'],
      },
      {
        model: Index,
        as: 'indexes',
        attributes: ['id', 'name', 'title', 'description', 'createdAt'],
      },
    ],
    order: [['name', 'ASC']],
  });

  if (
    groups[0].files.length > 0 ||
    groups[0].jobs.length > 0 ||
    groups[0].indexes.length ||
    groups[0].queries.length
  ) {
    return false;
  }

  const secondGroups = await Group.findAll({
    where: { parent_group: group_id, application_id: appId },
  });

  return secondGroups.length > 0 ? false : true;
};

router.delete('/', validate(validateDeleteGroup), async (req, res) => {
  try {
    const deleteGroup = await canDeleteGroup(
      req.body.group_id,
      req.body.app_id
    );

    if (!deleteGroup)
      return res.status(500).json({
        message:
          'The selected Group is not empty. Please empty the content of the group before it can be deleted',
      });

    await Group.destroy({
      where: { application_id: req.body.app_id, id: req.body.group_id },
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('group delete: ', err);
    return res.status(500).send('Error occured while deleting the Group');
  }
});

router.put('/move', validate(validateMoveGroup), async (req, res) => {
  try {
    let parentGroup = req.body.destGroupId ? req.body.destGroupId : '';

    await Group.update(
      { parent_group: parentGroup },
      { where: { id: req.body.groupId, application_id: req.body.app_id } }
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('group move: ', err);
    return res.status(500).send('Error occurred while moving group');
  }
});

router.put('/move/asset', validate(validateMoveAsset), async (req, res) => {
  const { app_id, assetId } = req.body;
  try {
    if (req.body.assetType === 'Group') {
      await Group.update(
        { parent_group: req.body.destGroupId || '' },
        { where: { application_id: app_id, id: assetId } }
      );
      return res.status(200).json({ success: true });
    }

    // create or update File
    if (!req.body.destGroupId) {
      //when we move asset to root "Group" folder we will not have destGroupId, in order to make it work we will need to remove record from AssetGroups
      await AssetsGroup.destroy({ where: { assetId }, force: true });
    } else {
      const assetGroupFields = { assetId, groupId: req.body.destGroupId };

      let [assetGroup, isAssetGroupCreated] = await AssetsGroup.findOrCreate({
        where: { assetId },
        defaults: assetGroupFields,
      });

      if (!isAssetGroupCreated) await assetGroup.update(assetGroupFields);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('group move asset: ', err);
    return res.status(500).send('Error occured while moving asset');
  }
});

let comparator = (a, b) => {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
};

module.exports = router;
