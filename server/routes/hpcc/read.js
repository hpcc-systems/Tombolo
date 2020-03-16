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
		let url = cluster.thor_host + ':' + cluster.thor_port +'/WsDfu/DFUQuery.json?LogicalName=*'+req.body.keyword+'*';
		if(req.body.indexSearch)
    		url += '&ContentType=key'
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
	      	if(result.DFUQueryResponse.DFULogicalFiles != undefined) {
	      		var logicalFilesAutoComplete = [], fileSearchResult = result.DFUQueryResponse.DFULogicalFiles.DFULogicalFile;

				fileSearchResult.forEach((logicalFile, index) => {
					//dont add any duplicates
					var exists = logicalFilesAutoComplete.filter(function(file) {
						return file.text == logicalFile.Name;
					});
					if(exists != undefined && exists.length == 0) {
						logicalFilesAutoComplete.push({"text" : logicalFile.Name, "value" : logicalFile.Name});
					}
				});
				console.log('logicalFilesAutoComplete: '+logicalFilesAutoComplete.length)
	      	 	res.json(logicalFilesAutoComplete);
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

router.post('/querysearch', function (req, res) {
    console.log('clusterid: '+req.body.clusterid);
	getCluster(req.body.clusterid).then(function(cluster) {
		let url = cluster.thor_host + ':' + cluster.thor_port +'/WsWorkunits/WUListQueries.json?QueryName=*'+req.body.keyword+'*';
		if(req.body.indexSearch)
    		url += '&ContentType=key'
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
	      	if(result.WUListQueriesResponse.QuerysetQueries != undefined) {
	      		var querySearchAutoComplete = [], querySearchResult = result.WUListQueriesResponse.QuerysetQueries.QuerySetQuery;

				querySearchResult.forEach((querySet, index) => {
					//dont add any duplicates
					var exists = querySearchAutoComplete.filter(function(query) {
						return query.text == querySet.Id;
					});
					if(exists != undefined && exists.length == 0) {
						querySearchAutoComplete.push({"text" : querySet.Id, "value" : querySet.Name});
					}
				});
				console.log('querySearchAutoComplete: '+querySearchAutoComplete.length)
	      	 	res.json(querySearchAutoComplete);
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
			request.get({
			  url: cluster.thor_host + ':' + cluster.thor_port +'/WsDfu/DFUInfo.json?Name='+req.query.fileName,
			  auth : getClusterAuth(cluster)
			}, function(err, response, body) {
			  if (err) {
				console.log('ERROR - ', err);
				return response.status(500).send('Error');
		      }
		      else {
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
		      	var result = JSON.parse(body);
		      	if(result.Exceptions) {
		      		res.status(500).send('Error: '+result.Exceptions.Exception);
		      	}

		      	if(result.DFUInfoResponse != undefined) {
		      		var fileInfoResponse = result.DFUInfoResponse.FileDetail, fileInfo = {};
		      		getFileLayout(cluster, req.query.fileName).then(function(fileLayout) {
			      		fileInfo = {
			      			"name" : fileInfoResponse.Name,
			      			"fileName" : fileInfoResponse.Filename,
			      			"description" : fileInfoResponse.Description,
			      			"pathMask" : fileInfoResponse.PathMask,
			      			"isSuperfile" : fileInfoResponse.isSuperfile,
			      			"fileType": fileInfoResponse.ContentType,
			      			"layout" : fileLayout,
			      			"validations" : processFieldValidations(fileLayout)
			      		}
			      		console.log("final length: "+fileInfo.layout);
			      	 	res.json(fileInfo);
		      		})
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

function getFileLayout(cluster, fileName) {
	var layoutResults = [];
	return requestPromise.get({
	  url: cluster.thor_host + ':' + cluster.thor_port +'/WsDfu/DFUGetFileMetaData.json?LogicalFileName='+fileName,
	  auth : getClusterAuth(cluster)
	}).then(function(response) {
		  var result = JSON.parse(response);
		  console.log('response: '+response);
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
		  console.log(layoutResults);
      	return layoutResults;
    })
	.catch(function (err) {
      console.log('error occured: '+err);
  	});

}

router.get('/getIndexInfo', function (req, res) {
    try {
		getCluster(req.query.clusterid).then(function(cluster) {
			request.get({
			  url: cluster.thor_host + ':' + cluster.thor_port +'/WsDfu/DFUInfo.json?Name='+req.query.indexName,
			  auth : getClusterAuth(cluster)
			}, function(err, response, body) {
			  if (err) {
				console.log('ERROR - ', err);
				return response.status(500).send('Error');
		      }
		      else {
		      	var result = JSON.parse(body);
		      	if(result.DFUInfoResponse != undefined) {
		      		var fileInfoResponse = result.DFUInfoResponse.FileDetail, indexInfo = {};
		      		getIndexColumns(cluster, req.query.indexName).then(function(indexColumns) {
			      		indexInfo = {
			      			"name" : fileInfoResponse.Name,
			      			"fileName" : fileInfoResponse.Filename,
			      			"description" : fileInfoResponse.Description,
			      			"pathMask" : fileInfoResponse.PathMask,
			      			"columns" : indexColumns
			      		}
			      	 	res.json(indexInfo);
		      		})
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
		console.log('cluster: '+JSON.stringify(cluster));
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
			request.get({
			  url: cluster.thor_host + ':' + cluster.thor_port +'/WsWorkunits/WUResult.json?LogicalName='+req.query.fileName+'&Count=50',
			  auth : getClusterAuth(cluster)
			}, function(err, response, body) {
			  if (err) {
				console.log('ERROR - ', err);
				return response.status(500).send('Error');
		      }
		      else {
		      	var result = JSON.parse(body);
		      	if(result.WUResultResponse != undefined && result.WUResultResponse.Result != undefined && result.WUResultResponse.Result.Row != undefined) {
						var rows = result.WUResultResponse.Result.Row, indexInfo = {};
						if(rows.length > 0) {
							res.json(rows);
						} else {
							res.json([]);
						}

				} else {
		      		res.json([]);
		      	}
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
		      	console.log(result);
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
			request.get({
			  url: cluster.roxie_host + ':'+ cluster.roxie_port +'/WsEcl/example/request/query/roxie/'+req.query.queryName+'/json?display',
			  auth : getClusterAuth(cluster)
			}, function(err, response, body) {
			  if (err) {
				console.log('ERROR - ', err);
				return response.status(500).send('Error');
		      }
		      else {
		      	var result = JSON.parse(body);
		      	if(result[req.query.queryName] != undefined) {
			      	Object.keys(result[req.query.queryName]).forEach(function (key) {
			      		requestObj.push({
			      			"field" : key,
			      			"type" : (result[req.query.queryName][key] == true || result[req.query.queryName][key] == false) ? 'boolean' : result[req.query.queryName][key]
			      		});
			      	});
			      	resultObj.request = requestObj;
			      	//get query response
			      	request.get({
						url: cluster.roxie_host + ':'+ cluster.roxie_port +'/WsEcl/example/response/query/roxie/'+req.query.queryName+'/json?display',
					    auth : getClusterAuth(cluster)
					}, function(err, response, body) {
					  if (err) {
						console.log('ERROR - ', err);
						return response.status(500).send('Error');
				      }
				      else {
				      	var result = JSON.parse(body);
				      	if(result[req.query.queryName+"Response"] != undefined) {
					      	var rows = result[req.query.queryName+"Response"].Results;
							Object.keys(rows).forEach(function (key) {
								if(rows[key] instanceof Object) {
									if(rows[key].Row) {
										Object.keys(rows[key].Row[0]).forEach(function (responseKey) {
											responseObj[responseKey] = rows[key].Row[0][responseKey];
											responseObj.push(
											{
												"field" : responseKey,
			      								"type" : rows[key].Row[0][responseKey]
											}
											);
										});
									}
								}
							});
							resultObj.response = responseObj;
				      	} else {
				      		resultObj.response = {};
				      	}
				      	res.json(resultObj);
				      }

			      	});
		      	}
		      }

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
