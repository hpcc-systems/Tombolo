const express = require("express");
const router = express.Router();
var models = require("../../models");
const hpccUtil = require("../../utils/hpcc-util");
const assetUtil = require("../../utils/assets");
let Application = models.application;
let UserApplication = models.user_application;
let File = models.file;
let FileValidation = models.file_validation;
let License = models.license;
var Cluster = models.cluster;
let Rules = models.rules;
let DataTypes = models.data_types;
let AssetsGroups = models.assets_groups;

let ConsumerObject = models.consumer_object;

let Sequelize = require("sequelize");
const Op = Sequelize.Op;
let Indexes = models.indexes;
let Query = models.query;
let Job = models.job;
const JobFile = models.jobfile;
var request = require("request");
const validatorUtil = require("../../utils/validator");
const { body, query, validationResult } = require("express-validator");

//let FileTree = require('../../models/File_Tree');
const axios = require("axios");
const logger = require("../../config/logger");

router.post(
  "/superfile_meta",
  [body("superFileAssetId").isUUID(4).withMessage("Invalid asset id")],
  async (req, res, next) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    try {
      const superFileAssetId = req.body.superFileAssetId;
      const file = await File.findOne({ where: { id: superFileAssetId } });

      if (!file || !file?.isSuperFile) throw new Error("Asset not found");

      const cluster = await hpccUtil.getCluster(file.cluster_id);
      const clusterAuth = hpccUtil.getClusterAuth(cluster);

      const payload = {
        SuperfileListRequest: {
          superfile: file.name,
        },
      };

      const url =
        cluster.thor_host +
        ":" +
        cluster.thor_port +
        "/WsDfu/SuperfileList?ver_=1.57";
      const response = await axios.post(url, payload, { headers: clusterAuth });

      const subfiles = response.data?.SuperfileListResponse?.subfiles?.Item;
      if (!subfiles) throw new Error("Failed to get subfiles");

      res.json(subfiles);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.get(
  "/file_list",
  [
    query("application_id").isUUID(4).withMessage("Invalid application id"),
    query("cluster_id")
      .isUUID(4)
      .optional({ nullable: true })
      .withMessage("Invalid cluster id"),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    try {
      const { application_id, cluster_id } = req.query;

      if (!cluster_id) {
        const assets = await File.findAll({
          where: { application_id },
          attributes: [
            "application_id",
            "id",
            "name",
            "title",
            "isSuperFile",
            "description",
            "createdAt",
          ],
        });
        return res.json(assets);
      }

      const assets = await File.findAll({
        where: {
          application_id,
          [Op.or]: [{ cluster_id }, { cluster_id: null }],
        },
        attributes: [
          "id",
          "name",
          "title",
          "isSuperFile",
          "metaData",
          "description",
          "createdAt",
        ],
      });

      const assetList = assets.map((asset) => {
        const parsed = asset.toJSON();
        parsed.isAssociated = asset.metaData?.isAssociated || false;
        delete parsed.metaData;
        return parsed;
      });

      res.json(assetList);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Error occurred while retrieving assets",
      });
    }
  }
);

router.post(
  "/all",
  [
    query("keyword")
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage("Invalid keyword"),
    query("userId").isInt().withMessage("Invalid userid"),
  ],
  (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      Application.findAll({
        attributes: ["id"],
        raw: true,
        include: [UserApplication],
        where: { $user_id$: req.query.userId },
      })
        .then(function (applications) {
          let appIds = applications.map((app) => app.id);
          File.findAll({
            where: {
              application_id: { [Op.in]: appIds },
              title: { [Op.like]: "%" + req.query.keyword + "%" },
            },
            attributes: ["id", "title", "name", "application_id"],
            raw: true,
          }).then((fileDefns) => {
            console.log(fileDefns);
            let fileDefSuggestions = fileDefns.map((fileDefn) => {
              return {
                text: fileDefn.title,
                value: fileDefn.title,
                id: fileDefn.id,
                name: fileDefn.name,
                app_id: fileDefn.application_id,
              };
            });
            res.json(fileDefSuggestions);
          });
        })
        .catch(function (err) {
          console.log(err);
          return res.status(500).json({
            success: false,
            message: "Error occured while getting files",
          });
        });
    } catch (err) {
      console.log("err", err);
      return res
        .status(500)
        .json({ success: false, message: "Error occured while getting files" });
    }
  }
);

router.get("/licenses", (req, res) => {
  try {
    License.findAll({ attributes: ["id", "name", "url", "description"] })
      .then(function (licenses) {
        res.json(licenses);
      })
      .catch(function (err) {
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "Error occured while getting licenses",
        });
      });
  } catch (err) {
    console.log("err", err);
  }
});

router.get("/rules", (req, res) => {
  try {
    Rules.findAll()
      .then(function (rules) {
        res.json(rules);
      })
      .catch(function (err) {
        console.log(err);
        return res.status(500).json({
          success: false,
          message: "Error occured while getting rules",
        });
      });
  } catch (err) {
    console.log("err", err);
    return res
      .status(500)
      .json({ success: false, message: "Error occured while getting rules" });
  }
});

router.get("/files/:fileId/validation-rules", (req, res, next) => {
  FileValidation.findAll({
    where: {
      file_id: req.params.fileId,
    },
  })
    .then((rules) => {
      return res.json(rules);
    })
    .catch((err) => {
      console.log("err", err);
      return res.status(500).json({
        message: "An error occurred",
      });
    });
});

router.get("/files/:fileId/validation-rules/validations", (req, res, next) => {
  FileValidation.findAll({
    where: {
      file_id: req.params.fileId,
    },
  })
    .then((rules) => {
      let validations = "";
      rules.forEach((rule) => {
        if (rule.rule_test) {
          validations += rule.rule_name + ":" + rule.rule_test + ";";
        }
      });
      return res.json({
        ecl: validations,
      });
    })
    .catch((err) => {
      console.log("err", err);
      return res.status(500).json({
        message: "An error occurred",
      });
    });
});

router.get("/files/:fileId/validation-rules/fixes", (req, res, next) => {
  FileValidation.findAll({
    where: {
      file_id: req.params.fileId,
    },
  })
    .then((rules) => {
      let fixes = "";
      rules.forEach((rule) => {
        if (rule.rule_fix) {
          fixes += rule.rule_name + ":" + rule.rule_fix + ";";
        }
      });
      return res.json({
        ecl: fixes,
      });
    })
    .catch((err) => {
      console.log("err", err);
      return res.status(500).json({
        message: "An error occurred",
      });
    });
});

router.get(
  "/CheckFileId",
  [
    query("app_id").isUUID(4).withMessage("Invalid application id"),
    query("file_id").isUUID(4).withMessage("Invalid file id"),
  ],
  (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      File.findOne({
        where: { application_id: req.query.app_id, id: req.query.file_id },
      })
        .then(function (file) {
          if (file) res.json(true);
          else res.json(false);
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (err) {
      console.log("err", err);
    }
  }
);

router.get(
  "/file_ids",
  [query("app_id").isUUID(4).withMessage("Invalid application id")],
  (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    var results = [];
    try {
      File.findAll({ where: { application_id: req.query.app_id } })
        .then(function (fileIds) {
          fileIds.forEach(function (doc, idx) {
            var fileObj = {};
            fileObj.id = doc.id;
            fileObj.title = doc.title;
            fileObj.name = doc.name;
            results.push(fileObj);
          });
          res.json(results);
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (err) {
      console.log("err", err);
    }
  }
);

router.get(
  "/file_details",
  [
    query("app_id").isUUID(4).withMessage("Invalid application id"),
    query("file_id").isUUID(4).withMessage("Invalid fileId"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const fileInfo = await assetUtil.fileInfo(
        req.query.app_id,
        req.query.file_id
      );
      res.status(200).json(fileInfo);
    } catch (err) {
      console.log("err", err);
      res
        .status(500)
        .json({ success: false, message: "Error occured while file details" });
    }
  }
);

//Gets sub-files associated with a super file
router.get(
  "/getSubFiles",
  [
    query("clusterId").isUUID(4).withMessage("Invalid cluster ID"),
    query("fileName").notEmpty().withMessage("Invalid file name"),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const { clusterId, fileName } = req.query;
      const DFUService = await hpccUtil.getDFUService(clusterId);
      const response = await DFUService.DFUInfo({ Name: fileName });
      if (!response.FileDetail) throw new Error("File details not found");

      res.send(response.FileDetail.subfiles.Item);
    } catch (error) {
      console.log("---- error while fetching sub-files ---------");
      console.dir({ error }, { depth: null });
      console.log("---------------------------------------------");
      res
        .status(404)
        .json({ success: false, message: "Unable to fetch subfiles" });
    }
  }
);

exports.updateFileDetails = async (fileId, applicationId, req) => {
  const fieldsToUpdate = { file_id: fileId, application_id: applicationId };
  const { validation, consumer, basic } = req.body.file;

  // create validoations
  const newValidations = validation.map((validation) => ({
    ...validation,
    ...fieldsToUpdate,
  }));
  await FileValidation.bulkCreate(newValidations, {
    updateOnDuplicate: ["rule_name", "rule_field", "rule_test", "rule_fix"],
  });

  // update Consumer
  if (consumer) {
    await ConsumerObject.bulkCreate({
      consumer_id: consumer.id,
      object_id: fileId,
      object_type: "file",
    });
  }
  return {
    result: "success",
    fileId: fileId,
    title: basic.title,
    name: basic.name,
  };
};

router.post(
  "/saveFile",
  [
    body("id")
      .optional({ checkFalsy: true })
      .isUUID(4)
      .withMessage("Invalid id"),
    body("file.basic.application_id")
      .isUUID(4)
      .withMessage("Invalid application id"),
    body("file.basic.title")
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage("Invalid title"),
  ],
  async (req, res) => {
    var fileId = "",
      applicationId = req.body.file.app_id,
      fieldsToUpdate = {};

    try {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }

      const { removeAssetId = "", renameAssetId = "", basic } = req.body.file;
      const { name, cluster_id, application_id } = basic;

      // We want to delete design file if it was associated with existing file that is already in Tombolo DB
      if (removeAssetId) {
        await Promise.all([
          JobFile.destroy({ where: { file_id: removeAssetId } }),
          FileValidation.destroy({ where: { file_id: removeAssetId } }),
          File.destroy({ where: { id: removeAssetId, application_id } }),
        ]);
      }
      // We want to update design file if it was associated with HPCC file that was not in Tombolo DB
      if (renameAssetId)
        await File.update(
          { name, cluster_id },
          { where: { id: renameAssetId } }
        );

      File.findOne({
        where: {
          name: req.body.file.basic.name,
          application_id: applicationId,
        },
      }).then(async (existingFile) => {
        let file = null;
        if (!existingFile) {
          file = await File.create(req.body.file.basic);
        } else {
          file = await File.update(req.body.file.basic, {
            where: { application_id: applicationId, id: req.body.id },
          }).then((updatedFile) => {
            return updatedFile;
          });
        }
        let fileId = file.id ? file.id : req.body.id;
        if (req.body.file.basic && req.body.file.basic.groupId) {
          let assetsGroupsCreated = await AssetsGroups.findOrCreate({
            where: { assetId: fileId, groupId: req.body.file.basic.groupId },
            defaults: {
              assetId: fileId,
              groupId: req.body.file.basic.groupId,
            },
          });
        }
        this.updateFileDetails(fileId, applicationId, req).then((response) => {
          res.json(response);
        });
      });
    } catch (err) {
      console.log("err", err);
      return res.status(500).json({
        success: false,
        message: "Error occured while saving file details",
      });
    }
  }
);

router.post(
  "/delete",
  [
    body("fileId").isUUID(4).withMessage("Invalid file id"),
    body("application_id").isUUID(4).withMessage("Invalid application id"),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    console.log(
      "[file delete] - Get file list for fileId = " +
        req.body.fileId +
        " appId: " +
        req.body.application_id
    );
    try {
      const { fileId, application_id } = req.body;

      await Promise.all([
        File.destroy({ where: { id: fileId, application_id } }),
        FileValidation.destroy({ where: { file_id: fileId } }),
        ConsumerObject.destroy({
          where: { object_id: fileId, object_type: "file" },
        }),
      ]);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Error occured while deleting file details",
      });
    }
  }
);

router.get("/dataTypes", (req, res) => {
  try {
    var results = [];
    DataTypes.findAll()
      .then(function (data_types) {
        //results.push("");
        data_types.forEach(function (doc, idx) {
          results.push(doc.name);
        });
        res.json(results);
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (err) {
    console.log("err", err);
  }
});


router.post(
  "/tomboloFileSearch",
  [
    body("app_id").isUUID(4).withMessage("Invalid application id"),
    body("keyword")
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage("Invalid keyword"),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      let files = await assetUtil.fileSearch(req.body.app_id, req.body.keyword);
      res.json(files);
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .send("Error occured while retrieving file details");
    }
  }
);

// For logical file explorer
router.get(
  "/browseLogicalFile/:cluster/:scope",
  [
    query("cluster").isUUID(4).withMessage("Invalid cluster"),
    query("scope").exists().withMessage("Invalid Scope"),
  ],
  async (req, res) => {
    try {
      const { cluster, scope } = req.params;
      const logicalFileScope = scope === "$" ? null : scope;
      const dfuService = await hpccUtil.getDFUService(cluster);
      const fileView = await dfuService.DFUFileView({
        Scope: logicalFileScope,
      });
      const logicalItems = fileView?.DFULogicalFiles?.DFULogicalFile;
      const cleanedLogicalItems = logicalItems.map((item) => {
        return {
          Directory: item.Directory,
          isDirectory: item.isDirectory,
          value: item.isDirectory ? item.Directory : item.Name,
          label: item.isDirectory ? item.Directory : item.Name,
          isLeaf: item.isDirectory ? false : true,
        };
      });

      res.status(200).send(cleanedLogicalItems);
    } catch (err) {
      logger.error(err);
      res
        .status(500)
        .json({ message: "Error occured while searching for logical file" });
    }
  }
);

// For super file explorer
router.get(
  "/browseSuperFile/:cluster/:scope",
  [
    query("cluster").isUUID(4).withMessage("Invalid cluster"),
    query("scope").exists().withMessage("Invalid Scope"),
  ],
  async (req, res) => {
    try {
      const { cluster, scope } = req.params;

      //get super files based on scope prefix and cluster
      const superFileList = await hpccUtil.getSuperFiles(cluster, scope);

      //set up output
      let output = {};
      output.arr = new Array();

      //loop through and add all options to output in correct format
      for (i = 0; i < superFileList.length; i++) {
        let isDirectory = true;
        let splitName = superFileList[i].text.split("::");
        let removeScope;

        if (scope !== "*") {
          let tempScope = scope + "::";

          //split remainder to only be left with children
          removeScope = superFileList[i].text
            .split(tempScope)
            .slice(1)
            .join(tempScope);
          splitName = removeScope.split("::");

          //if no child exists it is a file not directory
          if (!splitName[1]) {
            isDirectory = false;
          }
        }

        output.arr.push({
          Directory: isDirectory,
          isDirectory: isDirectory,
          value: splitName[0],
          label: splitName[0],
          isLeaf: isDirectory ? false : true,
          fullName: isDirectory ? null : superFileList[i].text,
        });
      }

      //search for duplicates and remove from output
      const uniqueArray = output.arr.filter((value, index) => {
        const _value = JSON.stringify(value);
        return (
          index ===
          output.arr.findIndex((obj) => {
            return JSON.stringify(obj) === _value;
          })
        );
      });

      //return non-duplicate array
      res.status(200).send(uniqueArray);
    } catch (err) {
      logger.error(err);
      console.log(err);
      res
        .status(500)
        .json({ message: "Error occured while searching for Superfiles" });
    }
  }
);

module.exports = router;
