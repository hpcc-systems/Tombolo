const express = require('express');
const router = express.Router();
const crypto = require('crypto');
var request = require('request');
var requestPromise = require('request-promise');
const dbUtil = require('../../utils/db');
var models  = require('../../models');
var Cluster = models.cluster;
let algorithm = 'aes-256-ctr';
let hpccJSComms = require("@hpcc-js/comms")
var http = require('http');

router.post('/filesearch', function (req, res) {
  console.log('clusterid: '+req.body.clusterid);

	getCluster(req.body.clusterid).then(function(cluster) {
		let results = [];
		try {
			let clusterAuth = getClusterAuth(cluster);
			let contentType = req.body.indexSearch ? "key" : "";
			console.log("contentType: "+contentType);
			let dfuService = new hpccJSComms.DFUService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : "")});
			dfuService.DFUQuery({"LogicalName":"*"+req.body.keyword+"*", ContentType:contentType}).then(response => {
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
  	console.log('Cluster not reachable: '+JSON.stringify(err));
  	res.status(500).send({"success":"false", "message": "Search failed. Please check if the cluster is running."});
  });
});

router.post('/querysearch', function (req, res) {
	getCluster(req.body.clusterid).then(function(cluster) {
		let clusterAuth = getClusterAuth(cluster);
		let wsWorkunits = new hpccJSComms.WorkunitsService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : ""), type: "get" }),
			  querySearchAutoComplete = [];

		wsWorkunits.WUListQueries({"QueryName":"*"+req.body.keyword+"*", "QuerySetName": "roxie", "Activated": true}).then(response => {
			console.log(response)
	  	if(response.QuerysetQueries) {
	  		querySearchResult = response.QuerysetQueries.QuerySetQuery;

				querySearchResult.forEach((querySet, index) => {
						querySearchAutoComplete.push({"text" : querySet.Id, "value" : querySet.Name});
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


router.post('/jobsearch', function (req, res) {
    console.log('clusterid: '+req.body.clusterid);
	getCluster(req.body.clusterid).then(function(cluster) {
		let url = cluster.thor_host + ':' + cluster.thor_port +'/WsWorkunits/WUQuery.json?Jobname=*'+req.body.keyword+'*&State=completed';
        request.get({
		  url: url,
		  auth : getClusterAuth(cluster)
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
				console.log('jobSearchAutoComplete: '+jobSearchAutoComplete.length)
	      	 	res.json(jobSearchAutoComplete);
	      	} else {
	      		res.json("");
	      	}
	      }
      	});
    }).catch(err => {
    	console.log('Cluster not reachable: '+JSON.stringify(err));
    	res.status(500).send({"success":"false", "message": "Search failed. Please check if the cluster is running."});
    });
});

router.get('/getClusters', function (req, res) {
    try {
		Cluster.findAll().then(function(clusters) {
			res.json(clusters);
		})
		.catch(function(err) {
	        console.log(err);
	    });
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


router.post('/newcluster', async function (req, res) {
    try {
		var ThorReachable=false;
		var RoxieReachable=false;
		ThorReachable = await isClusterReachable(req.body.thor_host, req.body.thor_port, req.body.username, req.body.password);
		RoxieReachable = await isClusterReachable(req.body.roxie_host, req.body.roxie_port, req.body.username, req.body.password);
		if(ThorReachable && RoxieReachable) {
			var newCluster = {"name":req.body.name, "thor_host":req.body.thor_host, "thor_port":req.body.thor_port,
			 "roxie_host":req.body.roxie_host, "roxie_port":req.body.roxie_port};
			if (req.body.username && req.body.password) {
				newCluster.username = req.body.username;
				newCluster.hash = crypto.createCipher(algorithm, dbUtil.secret).update(req.body.password,'utf8','hex');
			}
			console.log(req.body.id);
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

router.get('/getFileInfo', function (req, res) {
  try {
		console.log('fileName: '+req.query.fileName);
		getCluster(req.query.clusterid).then(function(cluster) {
			let clusterAuth = getClusterAuth(cluster);
			let dfuService = new hpccJSComms.DFUService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : "")});
			dfuService.DFUInfo({"Name":req.query.fileName}).then(response => {
		  	var processFieldValidations = function(fileLayout) {
      		var fieldsValidations=[];
      		fileLayout.forEach(function(field, idx) {
      			//fields[idx] = field.trim().replace(";","");
      			var validations = {
	      			"name" : field.name,
	      			"ruleType" : '',
	      			"rule" : '',
	      			"action" : '',
	      			"fixScript" : ''
	      		}
      			fieldsValidations.push(validations);
      			//console.log(fields[idx]);
      		});
      		return fieldsValidations;
      	}
      	var fileInfo = {};
    		getFileLayout(cluster, req.query.fileName).then(function(fileLayout) {
      		fileInfo = {
      			"name" : response.FileDetail.Name,
      			"fileName" : response.FileDetail.Filename,
      			"description" : response.FileDetail.Description,
      			"scope": response.FileDetail.Name.substring(0, response.FileDetail.Name.lastIndexOf('::')),
      			"pathMask" : response.FileDetail.PathMask,
      			"isSuperfile" : response.FileDetail.isSuperfile,
      			"fileType": response.FileDetail.ContentType,
      			"layout" : fileLayout,
      			"validations" : processFieldValidations(fileLayout)
      		}
      	 	res.json(fileInfo);
    		})

		  });
		});

  } catch (err) {
      console.log('err', err);
  }
});

function getFileLayout(cluster, fileName) {
	var layoutResults = [];
	return requestPromise.get({
	  url: cluster.thor_host + ':' + cluster.thor_port +'/WsDfu/DFUGetFileMetaData.json?LogicalFileName='+fileName,
	  auth : getClusterAuth(cluster)
	}).then(function(response) {
		  var result = JSON.parse(response);
    	if(result.DFUGetFileMetaDataResponse != undefined) {
			  var fileInfoResponse = result.DFUGetFileMetaDataResponse.DataColumns.DFUDataColumn, fileInfo = {};
      		fileInfoResponse.forEach(function(column) {
      			if(column.ColumnLabel !== '__fileposition__') {
	      			var layout = {
		      			"name" : column.ColumnLabel,
		      			"type" : column.ColumnType,
		      			"eclType" : column.ColumnEclType,
		      			"displayType" : '',
		      			"displaySize" : '',
		      			"textJustification" : 'right',
		      			"format" : '',
		      			"isPCI" : 'false',
		      			"isPII" : 'false',
						"isHIPAA":'false',
						"required": 'false'
		      		}
		      		if(column.DataColumns != undefined) {
		      			var childColumns = [];
		      			column.DataColumns.DFUDataColumn.forEach(function(childColumn) {
		      				var childColumnObj = {
		      					"name" : childColumn.ColumnLabel,
				      			"type" : childColumn.ColumnType,
				      			"eclType" : childColumn.ColumnEclType,
				      			"displayType" : '',
				      			"displaySize" : '',
				      			"textJustification" : 'right',
				      			"format" : '',
				      			"isPCI" : 'false',
				      			"isPII" : 'false',
								"isHIPAA":'false',
								"required": 'false'
		      				}
		      				childColumns.push(childColumnObj);

		      			});
		      			layout.children = childColumns;
		      		}
		      		layoutResults.push(layout);
		      	}
      		});
		  }
    	return layoutResults;
    })
	.catch(function (err) {
      console.log('error occured: '+err);
  	});

}

router.get('/getIndexInfo', function (req, res) {
    try {
			getCluster(req.query.clusterid).then(function(cluster) {
				let clusterAuth = getClusterAuth(cluster);
				let dfuService = new hpccJSComms.DFUService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : "")});
				dfuService.DFUInfo({"Name":req.query.indexName}).then(response => {
	    		if(response.FileDetail) {
		    		let indexInfo = {};
		    		getIndexColumns(cluster, req.query.indexName).then(function(indexColumns) {
		      		indexInfo = {
		      			"name" : response.FileDetail.Name,
		      			"fileName" : response.FileDetail.Filename,
		      			"description" : response.FileDetail.Description,
		      			"pathMask" : response.FileDetail.PathMask,
		      			"columns" : indexColumns
		      		}
		      	 	res.json(indexInfo);
		    		})
		    	} else {
		    		res.json();
		    	}
	    	});
			});
    } catch (err) {
        console.log('err', err);
    }
});

function getIndexColumns(cluster, indexName) {
	let columns={};
	return requestPromise.get({
	  url: cluster.thor_host + ':' + cluster.thor_port +'/WsDfu/DFUGetFileMetaData.json?LogicalFileName='+indexName,
	  auth : getClusterAuth(cluster)
	}).then(function(response) {
      	var result = JSON.parse(response);
      	if(result.DFUGetFileMetaDataResponse != undefined) {
	      	var indexColumns = result.DFUGetFileMetaDataResponse.DataColumns.DFUDataColumn, nonkeyedColumns=[], keyedColumns=[];
	      	if(indexColumns != undefined) {
	      		indexColumns.forEach(function(column) {
				    if(column.IsKeyedColumn) {
				    	keyedColumns.push(column);
					} else if(!column.IsKeyedColumn) {
				    	nonkeyedColumns.push(column);
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

let getCluster = function(clusterId) {
	return Cluster.findOne( {where: {id:clusterId}} ).then(async function(cluster) {
		if(cluster.hash) {
			cluster.hash = crypto.createDecipher(algorithm,dbUtil.secret).update(cluster.hash,'hex','utf8');
		}
		let isReachable = await isClusterReachable(cluster.thor_host, cluster.thor_port, cluster.username, cluster.password);
		if(isReachable)	 {
			return cluster;
		} else {
			throw new Error("Cluster not reachable...");
		}

	})
	.catch(function(err) {
        console.log(err);
    });
}

function getClusterAuth(cluster) {
	let auth = {};
	if(cluster.username && cluster.hash) {
		auth.user = cluster.username,
		auth.password = cluster.hash
		return auth;
	} else {
		return null;
	}
}

router.get('/getData', function (req, res) {
  try {
		getCluster(req.query.clusterid).then(function(cluster) {
			let clusterAuth = getClusterAuth(cluster);
			let wuService = new hpccJSComms.WorkunitsService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : "")});
			wuService.WUResult({"LogicalName":req.query.fileName, "Count":50}).then(response => {
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
			});
		});
	} catch (err) {
      console.log('err', err);
  }
});

router.get('/getFileProfile', function (req, res) {
    try {
		getCluster(req.query.clusterid).then(function(cluster) {
			request.get({
			  url: cluster.thor_host + ':' + cluster.thor_port +'/WsWorkunits/WUResult.json?LogicalName='+req.query.fileName+'.profile',
			  auth : getClusterAuth(cluster)
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
		getCluster(req.query.clusterid).then(function(cluster) {
			//call DFUInfo to get workunit id
      		var wuid = req.query.dataProfileWuid;
      		//get resource url's from wuinfo
      		request.post({
			  url: cluster.thor_host + ':' + cluster.thor_port +'/WsWorkunits/WUInfo.json',
			  auth : getClusterAuth(cluster),
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

router.get('/getQueryInfo', function (req, res) {
    var resultObj = {}, requestObj = [], responseObj = [];
    try {
			getCluster(req.query.clusterid).then(function(cluster) {
				let clusterAuth = getClusterAuth(cluster);
				let eclService = new hpccJSComms.EclService({ baseUrl: cluster.roxie_host + ':' + cluster.roxie_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : "")});
				eclService.requestJson("roxie", req.query.queryName).then(response => {
					if(response) {
						response.forEach((requestParam) =>  {
							requestObj.push({"field":requestParam.id, "type":requestParam.type});
						});
					}
					resultObj.request = requestObj;

			  	eclService.responseJson("roxie", req.query.queryName).then(response => {
						if(response) {
							let firstKey = Object.keys(response)[0];
							response[firstKey].forEach((responseParam) => {
								responseObj.push(
								{
									"field" : responseParam.id,
	    						"type" : responseParam.id
								});
							});
						}
						resultObj.response = responseObj;
						res.json(resultObj);

					}).catch(function (err) {
			      console.log('error occured: '+err);
			  	});

				}).catch(function (err) {
		      console.log('error occured: '+err);
		  	});
			});
    } catch (err) {
        console.log('err', err);
    }
});

router.get('/getJobInfo', function (req, res) {
    try {
		console.log('jobName: '+req.query.jobWuid);
		let sourceFiles=[], outputFiles=[];
		getCluster(req.query.clusterid).then(function(cluster) {
			request.get({
			  url: cluster.thor_host + ':' + cluster.thor_port +'/WsWorkunits/WUInfo.json?Wuid='+req.query.jobWuid,
			  auth : getClusterAuth(cluster)
			}, function(err, response, body) {
			  if (err) {
				console.log('ERROR - ', err);
				return response.status(500).send('Error');
		      }
		      else {
		      	var result = JSON.parse(body);
		      	if(result.Exceptions) {
		      		res.status(500).send('Error: '+result.Exceptions.Exception);
		      	}

		      	if(result.WUInfoResponse && result.WUInfoResponse.Workunit) {
		      		var wuInfoResponse = result.WUInfoResponse.Workunit, fileInfo = {};
		      		if(wuInfoResponse.SourceFiles && wuInfoResponse.SourceFiles.ECLSourceFile) {
		      			wuInfoResponse.SourceFiles.ECLSourceFile.forEach((sourceFile) => {
		      				sourceFiles.push({"name":sourceFile.Name});
		      			});

		      		}
		      		if(wuInfoResponse.Results && wuInfoResponse.Results.ECLResult) {
		      			let files = wuInfoResponse.Results.ECLResult.filter((result) => {
		      				return result.FileName != ""
		      			})
		      			files.forEach((file) => {
		      				outputFiles.push({"name":file.FileName});
		      			})
		      		}

		      		res.json({
		      			"sourceFiles": sourceFiles,
		      			"outputFiles": outputFiles,
		      			"Jobname": result.WUInfoResponse.Workunit.Jobname,
		      			"description": result.WUInfoResponse.Workunit.Description,
		      			"entryBWR": result.WUInfoResponse.Workunit.Jobname
		      		});
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

async function isClusterReachable(clusterHost, port, username, password) {
	let auth = null;
	if(username && password) {
		auth = {};
		auth.user = username,
		auth.password = password
	}
	return new Promise((resolve, reject) => {
		request.get({
		  url:clusterHost+":"+port,
		  auth : auth,
		  timeout: 3000
		},
		function (error, response, body) {
		    if (!error && response.statusCode == 200) {
		      resolve(true);
		    } else {
		    	console.log(error);
		    	resolve(false);
		    }
	  })
	});
 }

module.exports = router;
