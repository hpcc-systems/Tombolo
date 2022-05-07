const express = require('express');
const router = express.Router();
const crypto = require('crypto');
var request = require('request');
var requestPromise = require('request-promise');
const hpccUtil = require('../../utils/hpcc-util');
const assetUtil = require('../../utils/assets');
const {encryptString} = require('../../utils/cipher')
const validatorUtil = require('../../utils/validator');
var models  = require('../../models');
var Cluster = models.cluster;
var File = models.file;
var Query = models.query;
var Index = models.indexes;
var Job = models.job;
let algorithm = 'aes-256-ctr';
let hpccJSComms = require("@hpcc-js/comms")
const { body, query, validationResult } = require('express-validator');
const ClusterWhitelist = require('../../cluster-whitelist');
let lodash = require('lodash');
const {io} = require('../../server');
const fs = require("fs");
const { response } = require('express');
const userService = require('../user/userservice');
const path = require('path');
var sanitize = require("sanitize-filename");

router.post('/filesearch', [
  body('keyword')
    .matches(/^.[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid keyword')
], function (req, res) {
	const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
	if (!errors.isEmpty()) {
		return res.status(422).send({"success":"false", "message": "Error occurred during search."});
	}

	hpccUtil.getCluster(req.body.clusterid).then(function(cluster) {
		let results = [];
		try {
			let clusterAuth = hpccUtil.getClusterAuth(cluster);
			let contentType = req.body.indexSearch ? "key" : "";
			console.log("contentType: "+contentType);
			let dfuService = new hpccJSComms.DFUService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : "")});
			const {fileNamePattern} = req.body;

			let logicalFileName = "*"+req.body.keyword+"*";
			if(fileNamePattern === 'startsWith'){
				logicalFileName = req.body.keyword+"*";
			}else if(fileNamePattern === 'endsWith'){
				logicalFileName = "*"+req.body.keyword
			}
			
			dfuService.DFUQuery({"LogicalName": logicalFileName, ContentType:contentType}).then(response => {
				if(response.DFULogicalFiles && response.DFULogicalFiles.DFULogicalFile && response.DFULogicalFiles.DFULogicalFile.length > 0) {
					let searchResults = response.DFULogicalFiles.DFULogicalFile;
					searchResults.forEach((logicalFile) => {
						results.push({"text": logicalFile.Name, "value":logicalFile.Name});
					});
					//remove duplicates
					results = results.filter((elem, index, self) => self.findIndex(
    						(t) => {return (t.text === elem.text)}) === index)
				}
				res.json(results);
			});
		} catch(err) {
			console.log(err);
			res.status(500).send({"success":"false", "message": "Error occured during search."});
		}
  }).catch(err => {
	console.log('------------------------------------------');
	console.log('Cluster not reachable', +JSON.stringify(err) )
	console.log('------------------------------------------');
  	res.status(500).send({"success":"false", "message": "Search failed. Please check if the cluster is running."});
  });
});

router.post('/querysearch', [
  body('keyword')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid keyworkd')
], function (req, res) {
	const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
	hpccUtil.getCluster(req.body.clusterid).then(function(cluster) {
		let clusterAuth = hpccUtil.getClusterAuth(cluster);
		let wsWorkunits = new hpccJSComms.WorkunitsService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : ""), type: "get" }),
			  querySearchAutoComplete = [];

		wsWorkunits.WUListQueries({"QueryName":"*"+req.body.keyword+"*", "QuerySetName": "roxie", "Activated": true}).then(response => {
			console.log(response)
	  	if(response.QuerysetQueries) {
	  		querySearchResult = response.QuerysetQueries.QuerySetQuery;

				querySearchResult.forEach((querySet, index) => {
						querySearchAutoComplete.push({"text" : querySet.Name, "value" : querySet.Name});
				});

				querySearchAutoComplete = querySearchAutoComplete.filter((elem, index, self) => self.findIndex(
					(t) => {return (t.text === elem.text)}) === index)

			}
			res.json(querySearchAutoComplete);
    }).catch(err => {
    	console.log('Error occured while querying : '+JSON.stringify(err));
    	res.status(500).send({"success":"false", "message": "Search failed. Error occured while querying."});
    });
	}).catch(err => {
  	  	console.log('Cluster not reachable: '+JSON.stringify(err));
  		res.status(500).send({"success":"false", "message": "Search failed. Please check if the cluster is running."});
  });
});


router.post('/jobsearch', [
  body('keyword')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_: .\-]*$/).withMessage('Invalid keyword')
], function (req, res) {
	const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
	hpccUtil.getCluster(req.body.clusterid).then(function(cluster) {
		let url = cluster.thor_host + ':' + cluster.thor_port +'/WsWorkunits/WUQuery.json?Jobname=*'+req.body.keyword+'*';
        request.get({
		  url: url,
		  auth : hpccUtil.getClusterAuth(cluster)
		}, function(err, response, body) {
		  if (err) {
				console.log('ERROR - ', err);
				return response.status(500).send('Error');
			}
			else {
				var result = JSON.parse(body);
				if(result.WUQueryResponse && result.WUQueryResponse.Workunits != undefined) {
					var jobSearchAutoComplete = [], workunits = result.WUQueryResponse.Workunits.ECLWorkunit;

					workunits.forEach((workunit, index) => {
						//dont add any duplicates
						var exists = jobSearchAutoComplete.filter(function(job) {
							return workunit.Jobname == job.text;
						});
						if(exists != undefined && exists.length == 0) {
							jobSearchAutoComplete.push({"text" : workunit.Jobname, "value" : workunit.Wuid});
						}
					});
					res.json(jobSearchAutoComplete);
				} else {
						res.json([]);
				}
			}
		});
    }).catch(err => {
    	console.log('Cluster not reachable: '+JSON.stringify(err));
    	res.status(500).send({"success":"false", "message": "Search failed. Please check if the cluster is running."});
    });
});

router.get('/getClusters', async (req, res) => {
	try {
	  const clusters = await Cluster.findAll({
		attributes: { exclude: ['hash', 'username'] },
		order: [['createdAt', 'DESC']],
	  });
	  res.send(clusters);
	} catch (err) {
	  res.status(500).send({ success: 'false', message: 'Error occurred while retrieving cluster list' });
	}
  });

router.get('/getClusterWhitelist', function (req, res) {
  try {
		res.json(ClusterWhitelist.clusters);
  } catch (err) {
      console.log('err', err);
  }
});

router.get('/getCluster', function (req, res) {
  console.log('in /getCluster');
  try {
		Cluster.findOne(
			{where: {id:req.query.cluster_id}}
		).then(function(clusters) {
			res.json(clusters);
		})
	.catch(function(err) {
        console.log(err);
    });
  } catch (err) {
      console.log('err', err);
  }
});


router.post('/newcluster', [
  body('name').matches(/^[a-zA-Z0-9_:\s\-]*$/).withMessage('Invalid name'),
  body('id').optional({checkFalsy:true}).isUUID(4).withMessage('Invalid id')
	], async function (req, res) {
		const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      let cluster = ClusterWhitelist.clusters.filter(cluster => cluster.name == req.body.name);
      if(cluster && cluster.length > 0) {
    		var ThorReachable=false;
    		var RoxieReachable=false;
    		ThorReachable = await hpccUtil.isClusterReachable(cluster[0].thor, cluster[0].thor_port, req.body.username, req.body.password);
    		//RoxieReachable = await hpccUtil.isClusterReachable(cluster[0].roxie, cluster[0].roxie_port, req.body.username, req.body.password);
    		if(ThorReachable) {
    			var newCluster = {"name":req.body.name, "thor_host":cluster[0].thor, "thor_port":cluster[0].thor_port,
    			 "roxie_host":cluster[0].roxie, "roxie_port":cluster[0].roxie_port};
    			if (req.body.username && req.body.password) {
    				newCluster.username = req.body.username;
					newCluster.hash= encryptString(req.body.password);
    			}
    			if(req.body.id == undefined || req.body.id == "") {
    				Cluster.create(newCluster).then(function(cluster) {
    					res.json({"result":"success"});
    				});
    			} else {
		        Cluster.update(
		        	newCluster,
		            {
		            	where: {id:req.body.id}
		        	}
		        ).then(function(application) {
		            res.json({"result":"success"});
		        });
    		  }
    		} else {
    			return res.status(500).json({"message": "Cluster could not be reached"});
        }
      }
    } catch (err) {
      console.log('err', err);
      return res.status(500).send({"success":"false", "message": "Error occured while adding new Cluster"});
    }
});

router.post('/removecluster', function (req, res) {
    console.log(req.body.clusterIdsToDelete);
    try {
        Cluster.destroy({ where: {id: req.body.clusterIdsToDelete}}, function(err) {})
        return res.status(200).send({"result":"success"});
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/getFileInfo', [
  query('fileName').exists().withMessage('Invalid file name'),
  query('clusterid').optional({checkFalsy:true}).isUUID(4).withMessage('Invalid cluster id'),
  query('applicationId').isUUID(4).withMessage('Invalid application id')
], function (req, res) {
	const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
	console.log('fileName: '+req.query.fileName+ " clusterId: "+req.query.clusterid );
  File.findOne({where: {name: req.query.fileName, application_id: req.query.applicationId}}).then(async (existingFile) => {
		console.log(existingFile);
    if(existingFile) {
      await assetUtil.fileInfo(req.query.applicationId, existingFile.id).then((existingFileInfo) => {
        res.json(existingFileInfo);
      })
    } else {
      hpccUtil.fileInfo(req.query.fileName, req.query.clusterid).then((fileInfo) => {
        res.json(fileInfo);
      }).catch((err) => {
        console.log('err', err);
        return res.status(500).send("Error occured while getting file details");
      })
    }
  })
});


router.get('/getIndexInfo', [
  query('indexName')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid index name'),
  query('clusterid')
    .isUUID(4).withMessage('Invalid cluster id'),
  query('applicationId')
    .isUUID(4).withMessage('Invalid application id')
],function (req, res) {
	const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
	  Index.findOne({where: {name: req.query.indexName, application_id: req.query.applicationId}}).then((existingIndex) => {
      if(existingIndex) {
        assetUtil.indexInfo(req.query.applicationId, existingIndex.id).then((existingIndexInfo) => {
          res.json(existingIndexInfo);
        })
      } else {
        hpccUtil.indexInfo(req.query.clusterid, req.query.indexName).then((indexInfo) => {
          res.json(indexInfo);
        }).catch((err) => {
          console.log('err', err);
          return res.status(500).send("Error occured while getting file details");
        })
      }
    })
  } catch (err) {
    console.log('err', err);
    return res.status(500).send("Error occured while getting file details");
  }
});

function getIndexColumns(cluster, indexName) {
	let columns={};
	return requestPromise.get({
	  url: cluster.thor_host + ':' + cluster.thor_port +'/WsDfu/DFUGetFileMetaData.json?LogicalFileName='+indexName,
	  auth : hpccUtil.getClusterAuth(cluster)
	}).then(function(response) {
      	var result = JSON.parse(response);
      	if(result.DFUGetFileMetaDataResponse != undefined) {
	      	var indexColumns = result.DFUGetFileMetaDataResponse.DataColumns.DFUDataColumn, nonkeyedColumns=[], keyedColumns=[];
	      	if(indexColumns != undefined) {
	      		indexColumns.forEach(function(column) {
				    if(column.IsKeyedColumn) {
				    	keyedColumns.push({'id':column.ColumnID, 'name':column.ColumnLabel, 'type': column.ColumnType, 'eclType':column.ColumnEclType});
					} else if(!column.IsKeyedColumn) {
				    	nonkeyedColumns.push({'id':column.ColumnID, 'name':column.ColumnLabel, 'type': column.ColumnType, 'eclType':column.ColumnEclType});
					}
				});
	      		columns.nonKeyedColumns = nonkeyedColumns;
	      		columns.keyedColumns = keyedColumns;
	      	}
	    }
      	return columns;
    })
	.catch(function (err) {
      console.log('error occured: '+err);
  	});
}

router.get('/getData', [
  query('clusterid')
    .isUUID(4).withMessage('Invalid cluster id'),
  query('fileName')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid file name')
], function (req, res) {
	const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {

		hpccUtil.getCluster(req.query.clusterid).then(function(cluster) {
			let clusterAuth = hpccUtil.getClusterAuth(cluster);
			let wuService = new hpccJSComms.WorkunitsService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : "")});
			wuService.WUResult({"LogicalName":req.query.fileName, "Cluster": "mythor", "Count":50}).then(response => {
				if(response.Result != undefined && response.Result != undefined && response.Result.Row != undefined) {
					var rows = response.Result.Row, indexInfo = {};
					if(rows.length > 0) {
						rows.shift();
						res.json(rows);
					} else {
						res.json([]);
					}
				}
				else {
      		res.json([]);
      	}
			}).catch((err) => {
				console.log('err', err);
				return res.status(500).send("Error occured while getting file data");		
			})
		});
	} catch (err) {
    console.log('err', err);
		return res.status(500).send("Error occured while getting file data");
  }
});

router.get('/getFileProfile', function (req, res) {
    try {
		hpccUtil.getCluster(req.query.clusterid).then(function(cluster) {
			request.get({
			  url: cluster.thor_host + ':' + cluster.thor_port +'/WsWorkunits/WUResult.json?LogicalName='+req.query.fileName+'.profile',
			  auth : hpccUtil.getClusterAuth(cluster)
			}, function(err, response, body) {
			  if (err) {
				console.log('ERROR - ', err);
				return response.status(500).send('Error');
		      }
		      else {
		      	var result = JSON.parse(body);
		      	if(result.Exceptions) {
		      		res.json([]);
		      	}

		      	if(result.WUResultResponse != undefined && result.WUResultResponse.Result != undefined && result.WUResultResponse.Result.Row != undefined) {
						var rows = result.WUResultResponse.Result.Row, indexInfo = {};
						if(rows.length > 0) {
							rows.forEach(function (row, index) {
								Object.keys(row).forEach(function (key) {
									if(row[key] instanceof Object) {
										if(row[key].Row) {
											row[key] = row[key].Row;
										}
									}
								});
							});
							res.json(rows);
						}

				} else {
		      		res.json();
		      	}
		      }

	      	});
		});
	} catch (err) {
        console.log('err', err);
    }
});

router.get('/getFileProfileHTML', function (req, res) {
    try {
		hpccUtil.getCluster(req.query.clusterid).then(function(cluster) {
			//call DFUInfo to get workunit id
      		var wuid = req.query.dataProfileWuid;
      		//get resource url's from wuinfo
      		request.post({
			  url: cluster.thor_host + ':' + cluster.thor_port +'/WsWorkunits/WUInfo.json',
			  auth : hpccUtil.getClusterAuth(cluster),
			  headers: {'content-type' : 'application/x-www-form-urlencoded'},
			  body: "Wuid="+wuid+"&TruncateEclTo64k=true&IncludeResourceURLs=true&IncludeExceptions=false&IncludeGraphs=false&IncludeSourceFiles=false&IncludeResults=false&IncludeResultsViewNames=false&IncludeVariables=false&IncludeTimers=false&IncludeDebugValues=false&IncludeApplicationValues=false&IncludeWorkflows=false&IncludeXmlSchemas=false&SuppressResultSchemas"
			}, function(err, response, body) {
			  if (err) {
				console.log('ERROR - ', err);
				return response.status(500).send('Error');
		      }
		      else {
		      	var result = JSON.parse(body);
		      	var filterdUrl = result.WUInfoResponse.Workunit.ResourceURLs.URL.filter(function(url) {
		      		return !url.startsWith("manifest");
		      	}).map(function(url) {
	      			return cluster.thor_host + ':' + cluster.thor_port + '/WsWorkunits/' + url.replace("./report", "report");
		      	});
		      	console.log("URL's: "+JSON.stringify(filterdUrl));
		      	res.json(filterdUrl);
		      }
		  })
		});
	} catch (err) {
        console.log('err', err);
    }
});

router.get('/getQueryInfo', [
  query('clusterid')
    .isUUID(4).withMessage('Invalid cluster id'),
  query('queryName')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid query name')
],function (req, res) {
	const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  Query.findOne({where: {name: req.query.queryName, application_id: req.query.applicationId}}).then((existingQuery) => {
    if(existingQuery) {
      assetUtil.queryInfo(req.query.applicationId, existingQuery.id).then((existingQueryInfo) => {
        res.json(existingQueryInfo);
      })
    } else {
      hpccUtil.queryInfo(req.query.clusterid, req.query.queryName).then((queryInfo) => {
        res.json(queryInfo);
      }).catch((err) => {
        console.log('err', err);
        return res.status(500).send("Error occured while getting file details");
      })
    }
  })
});

router.get('/getJobInfo', [
  query('clusterid')
    .isUUID(4).withMessage('Invalid cluster id'),
  query('jobWuid')
    .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/).withMessage('Invalid workunit id')
], function (req, res) {
	const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  try {
  	console.log('jobName: '+req.query.jobWuid);
    Job.findOne({where: {name: req.query.jobName, cluster_id: req.query.clusterid, application_id: req.query.applicationId}, attributes:['id']}).then((existingJob) => {
      if(existingJob) {
        assetUtil.jobInfo(req.query.applicationId, existingJob.id).then((existingJobInfo) => {
          res.json(existingJobInfo);
        })
      } else {
        hpccUtil.getJobInfo(req.query.clusterid, req.query.jobWuid, req.query.jobType).then((jobInfo) => {
          res.json(jobInfo);
        }).catch((err) => {
          console.log('err', err);
          return res.status(500).send("Error occured while getting file details");
        })
      }
    })
  } catch (err) {
      console.log('err', err);
  }
});

router.get('/getDropZones', [
	query('clusterId')
    .isUUID(4).withMessage('Invalid cluster id'),
  ],  function (req, res) {
	  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
	if (!errors.isEmpty()) {
	  return res.status(422).json({ success: false, errors: errors.array() });
	}
	try {
		 hpccUtil.getCluster(req.query.clusterId).then(function(cluster) {
			let url = cluster.thor_host + ':' + cluster.thor_port +'/WsTopology/TpDropZoneQuery.json';
			request.get({
				url: url,
				auth : hpccUtil.getClusterAuth(cluster)
			}, function(err, response, body) {
			if (err) {
				console.log('ERROR - ', err);
				return response.status(500).send('Error');
			}
			else {
				let result = JSON.parse(body);
				let dropZones = result.TpDropZoneQueryResponse.TpDropZones.TpDropZone;
				let _dropZones = {};
				let dropZoneDetails = []
				dropZones.map(dropzone => {
					dropZoneDetails.push({name : dropzone.Name, path: dropzone.Path, machines : dropzone.TpMachines.TpMachine})
					_dropZones[dropzone.Name] = [];
					lodash.flatMap(dropzone.TpMachines.TpMachine, (tpMachine) => {
						_dropZones[dropzone.Name] = _dropZones[dropzone.Name].concat([tpMachine.Netaddress]);
					})
				});

				if(req.query.for === "fileUpload" || req.query.for === "manualJobSerach" || req.query.for === "lzFileExplorer"){
					res.json(dropZoneDetails)
				}else{
					res.json(_dropZones);
				}
			}
			})
		}).catch(err =>{
			res.status(500).json({success: false, message : err});
		})
	} catch (err) {
		console.log('err', err);
		return res.status(500).send("Error occured while getting dropzones");
	}
})

/* This route is re-written below. Leaving it here because it is  being called in couple other places. 
Can retire after the changes are made in those places */
router.get('/getDirectories',[
	query('data').exists().withMessage('Invalid data'),
	query('host').exists().withMessage('Invalid host name'),
	query('port').exists().withMessage('Invalid Port')
], function (req, res) {
	const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
	if (!errors.isEmpty()) {
	  return res.status(422).json({ success: false, errors: errors.array() });
	}
		
	else{
		const {data,host, port, clusterId} = req.query;
		let inputs = JSON.parse(data);
		hpccUtil.getCluster(clusterId)
				.then((cluster) =>{
					hpccUtil.fetchDirectories(host,port, inputs, cluster)
					.then(response =>{
						return res.status(200).json(response)
					})
				}).catch(err =>{
					  console.log(err)
					  return res.status(500).json({success : false, message : 'Error occured while getting directories'})
				})
	}
})

// GET DIRECTORIES FROM DROP ZONE 
router.get('/dropZoneDirectories', [
	query('clusterId').exists().withMessage('Invalid cluster ID'),
	query('Netaddr').exists().withMessage('Invalid Netaddr'),
	query('Path').exists().withMessage('Invalid path') ], async(req, res) =>{
	const {clusterId, Netaddr,  Path, DirectoryOnly} = req.query;
	try{
		const cluster = await hpccUtil.getCluster(clusterId);
		const response = await hpccUtil.fetchLandingZoneDirectories({cluster, Netaddr,  Path, DirectoryOnly})
		res.status(200).json(response);

	}catch(err){
		console.log(err);
		res.status(503).json({success : false, message : err.message})
	}
})

router.post('/dropZoneFileSearch', [
	body('clusterId').isUUID(4).withMessage('Invalid cluster id'),
	body('dropZoneName').matches(/^[a-zA-Z0-9]{1}[a-zA-Z0-9_:\-.]*$/).withMessage('Invalid dropzone name'),
	body('server').matches(/^[a-zA-Z0-9]{1}[a-zA-Z0-9_:\-.]/).withMessage('Invalid server'),
	body('nameFilter').matches(/^[a-zA-Z0-9]{1}[a-zA-Z0-9_:\-.]*$/).withMessage('Invalid file filter'),
  ], function (req, res) {
	  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
	if (!errors.isEmpty()) {
	  return res.status(422).json({ success: false, errors: errors.array() });
	}
	try {
		hpccUtil.getCluster(req.body.clusterId).then(function(cluster) {
			request.post({
				url: cluster.thor_host + ':' + cluster.thor_port +'/FileSpray/DropZoneFileSearch.json',
				auth : hpccUtil.getClusterAuth(cluster),
				headers: {'content-type' : 'application/x-www-form-urlencoded'},
				body: 'DropZoneName='+req.body.dropZoneName+'&Server='+req.body.server+'&NameFilter=*'+req.body.nameFilter+'*&__dropZoneMachine.label='+req.body.server+'&__dropZoneMachine.value='+req.body.server+'&__dropZoneMachine.selected=true&rawxml_=true'				
			}, function(err, response, body) {
			  if (err) {
					console.log('ERROR - ', err);
					return response.status(500).send('Error occured during dropzone file search');
				}
				else {
					var result = JSON.parse(body);
					let files = [];
					if(result && result.DropZoneFileSearchResponse && 
						result.DropZoneFileSearchResponse['Files'] && 
							result.DropZoneFileSearchResponse['Files']['PhysicalFileStruct']) {
						files = result.DropZoneFileSearchResponse['Files']['PhysicalFileStruct'];						
					}	
					return res.status(200).send(files);							
				}
			})
		})
	} catch (err) {
		console.log('err', err);
		return response.status(500).send('Error occured during dropzone file search');
	}
});

router.post('/executeSprayJob', [
	body('jobId').isUUID(4).withMessage('Invalid cluster id')
  ], async function (req, res) {
	  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
	if (!errors.isEmpty()) {
	  return res.status(422).json({ success: false, errors: errors.array() });
	}
	
	try {
		let job = await Job.findOne({where: {id: req.body.jobId}, attributes: { exclude: ['assetId'] }});
		let cluster = hpccUtil.getCluster(job.cluster_id).then(async function(cluster) {			
			let sprayPayload = {
				destGroup: 'mythor',
				DFUServerQueue: 'dfuserver_queue',
				namePrefix: job.sprayedFileScope,
				targetName: job.sprayFileName,
				overwrite: 'on',
				sourceIP: job.sprayDropZone,
				sourcePath: '/var/lib/HPCCSystems/mydropzone/' + job.sprayFileName,
				destLogicalName: job.sprayedFileScope + '::' + job.sprayFileName,
				rawxml_: 1,
				sourceFormat: 1,
				sourceCsvSeparate: '\,',
				sourceCsvTerminate: '\n,\r\n',
				sourceCsvQuote: '"'
			};
			console.log(sprayPayload);
			request.post({
				url: cluster.thor_host + ':' + cluster.thor_port +'/FileSpray/SprayVariable.json',
				auth : hpccUtil.getClusterAuth(cluster),
				headers: {'content-type' : 'application/x-www-form-urlencoded'},
				formData: sprayPayload,
		    resolveWithFullResponse: true
			}, function(err, response, body) {
			  if (err) {
					console.log('ERROR - ', err);
					return response.status(500).send('Error occured during dropzone file search');
				}
				else {
					var result = JSON.parse(body);					
					return res.status(200).send(result);							
				}
			})
		})
	} catch (err) {
		console.log('err', err);
		return response.status(500).send('Error occured during dropzone file search');
	}
});


// Drop Zone file upload namespace
io.of("/landingZoneFileUpload").on("connection", (socket) => {

	if(socket.handshake.auth){
		userService.verifyToken(socket.handshake.auth.token)
		.then(response =>{ 
			return response;
		}).catch(err =>{
			socket.emit("error", err);
			socket.disconnect();
		})
	}

	let cluster, destinationFolder, machine;
	//Receive cluster and destination folder info when client clicks upload
	socket.on('start-upload', message=> {
		cluster = message.cluster;
		destinationFolder = message.pathToAsset;
		machine = message.machine;
	})

	//Upload File 
	const upload = async (cluster, destinationFolder, id ,fileName) =>{
		//Check file ext
		const acceptableFileTypes = ['xls', 'xlsm', 'xlsx', 'txt', 'json', 'csv'];
		const sanitizedFileName = sanitize(fileName)
		const filePath = path.join(__dirname, '..', '..', 'uploads', sanitizedFileName);

		let fileExtension = fileName.substr(fileName.lastIndexOf('.') + 1).toLowerCase();
		if(!acceptableFileTypes.includes(fileExtension)){
			socket.emit('file-upload-response', {id, fileName,  success : false, message :"Invalid file type, Acceptable filetypes are xls, xlsm, xlsx, txt, json and csv"});
			fs.unlink(filePath, err =>{
				if(err){
					console.log(`Failed to remove ${sanitizedFileName} from FS - `, err)
				}
			});
			return;
		}
		try{
			const selectedCluster = await hpccUtil.getCluster(cluster.id);
			request({
				url : `${cluster.thor_host}:${cluster.thor_port}/FileSpray/UploadFile.json?upload_&rawxml_=1&NetAddress=${machine}&OS=2&Path=${destinationFolder}`,
				method : 'POST',
				auth : hpccUtil.getClusterAuth(selectedCluster),
				formData : {
					'UploadedFiles[]' : {
						value : fs.createReadStream(filePath),
						options : {
							filename : fileName,
						}
					}
				}
				},
				function(err, httpResponse, body){
					const response = JSON.parse(body);
					if(err){
						return console.log(err)
					}
					if(response.Exceptions){
						socket.emit('file-upload-response', {id, fileName,success : false, message : response.Exceptions.Exception[0].Message});
					}else{
						socket.emit('file-upload-response', {id, fileName, success : true, message : response.UploadFilesResponse.UploadFileResults.DFUActionResult[0].Result });
					}
					fs.unlink(filePath, err =>{
						if(err){
							console.log(`Failed to remove ${sanitizedFileName} from FS - `, err)
						}
					})
				}
				
			)
		}catch(err){
			console.log(err)
		}
	}
		
	//When whole file is supplied by the client
	socket.on('upload-file',  (message) => {
		let {id, fileName, data} = message;
		const sanitizedFileName  = sanitize(fileName);
		const filePath = path.join(__dirname, '..', '..', 'uploads', sanitizedFileName);
		 fs.writeFile(filePath, data, function(err){
			if(err){
				console.log(`Error occured while saving ${sanitizedFileName} in FS`, err);
				socket.emit('file-upload-response', {fileName, id, success : false, message : 'Unknown error occured during upload'});
			}else{
				  upload(cluster, destinationFolder, id, sanitizedFileName )
			}
		});
	});

	//Ask for more
	const supplySlice = (file) =>{
		if(file.fileSize - file.received <= 0){
				let fileData = file.data.join('');
				let fileBuffer = Buffer.from(fileData);
				const fileName = sanitize(file.fileName);
				const filePath = path.join(__dirname, '..', '..', 'uploads', fileName);
				fs.writeFile(filePath, fileBuffer, function(err){
					if(err){
						console.log('Error writing file to the FS', error);
						socket.emit('file-upload-response', {fileName,success : false, message : err});
					}else{
					  upload(cluster, destinationFolder, file.id , fileName)
					}
				})
		}
		else if(file.fileSize - file.received >= 100000){
				socket.emit('supply-slice', {
					id:file.id,
					chunkStart : file.received,
					chunkSize: 100000
				})
		
		}else if(file.fileSize -file.received < 100000){
				socket.emit('supply-slice', {
					id:file.id,
					chunkStart : file.received, 
					chunkSize: file.fileSize - file.received
				})	
		}
	}
	//when a slice of file is supplied by the client
	let files = [{}];
	socket.on('upload-slice', (message) =>{
		let {id, fileName, data, fileSize, chunkSize} = message;
		let indexOfCurrentItem = files.findIndex(item => item.id === id);
		if(indexOfCurrentItem < 0){
			files.push({id, fileName, data : [data], fileSize, received : chunkSize});
			let i = files.findIndex(item => item.id === id);
				supplySlice(files[i])
		}else{
			let i = files.findIndex(item => item.id === id);
			files[i].data.push(data);
			files[i].received = files[i].received + chunkSize;
			supplySlice(files[i])
		}
	})
});
module.exports = router;