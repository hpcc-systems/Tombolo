var request = require('request');
var requestPromise = require('request-promise');
var models  = require('../models');
var Cluster = models.cluster;
let hpccJSComms = require("@hpcc-js/comms");
const crypto = require('crypto');
let algorithm = 'aes-256-ctr';

exports.fileInfo = (fileName, clusterId) => {
	return new Promise((resolve, reject) => {
		module.exports.getCluster(clusterId).then(function(cluster) {
      var fileInfo = {};
			let clusterAuth = module.exports.getClusterAuth(cluster);
			let dfuService = new hpccJSComms.DFUService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : "")});
			dfuService.DFUInfo({"Name":fileName}).then(response => {
        if(response.DFUInfoResponse && response.DFUInfoResponse.Exceptions) {
          console.error(response.DFUInfoResponse.Exception[0]);
          resolve(null);
        }
        console.log(response)
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

    		getFileLayout(cluster, fileName, response.FileDetail.Format).then(function(fileLayout) {
      		fileInfo.basic = {
      			"name" : response.FileDetail.Name,
      			"fileName" : response.FileDetail.Filename,
      			"description" : response.FileDetail.Description,
      			"scope": response.FileDetail.Name.substring(0, response.FileDetail.Name.lastIndexOf('::')),
      			"pathMask" : response.FileDetail.PathMask,
      			"isSuperfile" : response.FileDetail.isSuperfile,
      			"fileType": response.FileDetail.ContentType,
      		}
          fileInfo.file_layouts = fileLayout;
          fileInfo.file_validations = [];
      	 	resolve(fileInfo);
    		})

		  }).catch((err) => {
        resolve(null);
      })
		}).catch((err) => {
      console.log('err-1', err);
      reject(err);
    })
	})
}

function getIndexColumns(cluster, indexName) {
  let columns={};
  return requestPromise.get({
    url: cluster.thor_host + ':' + cluster.thor_port +'/WsDfu/DFUGetFileMetaData.json?LogicalFileName='+indexName,
    auth : module.exports.getClusterAuth(cluster)
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
}).catch(function (err) {
  console.log('error occured: '+err);
});
}

exports.indexInfo = (clusterId, indexName) => {
  return new Promise((resolve, reject) => {
    try {
      module.exports.getCluster(clusterId).then(function(cluster) {
        let clusterAuth = module.exports.getClusterAuth(cluster);
        let dfuService = new hpccJSComms.DFUService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : "")});
        dfuService.DFUInfo({"Name":indexName}).then(response => {
          if(response.FileDetail) {
            let indexInfo = {};
            getIndexColumns(cluster, indexName).then(function(indexColumns) {
              indexInfo.basic = {
                "name" : response.FileDetail.Name,
                "title" : response.FileDetail.Filename,
                "description" : response.FileDetail.Description,
                "qualifiedPath" : response.FileDetail.PathMask,
                "index_keys" : indexColumns.keyedColumns,
                "index_payloads": indexColumns.nonKeyedColumns
              }
              resolve(indexInfo);
            })
          } else {
            resolve({});
          }
        });
      });
    } catch(err) {
      reject(err);
    }
  });
}

exports.queryInfo = (clusterId, queryName) => {
  let resultObj = {basic:{}}, requestObj = [], responseObj = [];
  try {
    return new Promise((resolve, reject) => {
      module.exports.getCluster(clusterId).then(function(cluster) {
        let clusterAuth = module.exports.getClusterAuth(cluster);
        let eclService = new hpccJSComms.EclService({ baseUrl: cluster.roxie_host + ':' + cluster.roxie_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : "")});
        eclService.requestJson("roxie", queryName).then(response => {
          if(response) {
            response.forEach((requestParam, idx) =>  {
              requestObj.push({"id": idx, "name":requestParam.id, "type":requestParam.type, "field_type": "input"});
            });
          }
          //resultObj.basic.request = requestObj;

          eclService.responseJson("roxie", queryName).then(response => {
            if(response) {
              let firstKey = Object.keys(response)[0];
              response[firstKey].forEach((responseParam, idx) => {
                responseObj.push(
                {
                  "id": idx,
                  "name" : responseParam.id,
                  "type" : responseParam.type,
                  "field_type": "output"
                });
              });
            }
            //resultObj.basic.response = responseObj;
            resultObj.basic.query_fields = requestObj.concat(responseObj);
            resultObj.basic.name=queryName;
            resultObj.basic.title=queryName;
            resolve(resultObj);

          }).catch(function (err) {
            console.log('error occured: '+err);
            reject(err);
          });

        }).catch(function (err) {
          console.log('error occured: '+err);
          reject(err);
        });
    });
  })
} catch (err) {
    console.log('err', err);
}
}

exports.getJobInfo = (clusterId, jobWuid, jobType) => {
  let sourceFiles=[], outputFiles=[], jobInfo = {};
  return new Promise((resolve, reject) => {
    module.exports.getCluster(clusterId).then(function(cluster) {
      request.get({
        url: cluster.thor_host + ':' + cluster.thor_port +'/WsWorkunits/WUInfo.json?Wuid='+jobWuid,
        auth : module.exports.getClusterAuth(cluster)
      }, function(err, response, body) {
        if (err) {
          console.log('ERROR - ', err);
          reject(err);
        } else {
          var result = JSON.parse(body);
          if(result.Exceptions) {
            reject(result.Exceptions.Exception);
          }
          if(jobType == 'Query Build') {
            let clusterAuth = module.exports.getClusterAuth(cluster);
            let wuService = new hpccJSComms.WorkunitsService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : "")});
            wuService.WUListQueries({"WUID":jobWuid}).then(response => {
              if(response.QuerysetQueries && response.QuerysetQueries.QuerySetQuery && response.QuerysetQueries.QuerySetQuery.length > 0) {
                wuService.WUQueryDetails({"QueryId":response.QuerysetQueries.QuerySetQuery[0].Id, "QuerySet":"roxie"}).then(queryDetails => {
                  queryDetails.LogicalFiles.Item.forEach((logicalFile)  => {
                    sourceFiles.push({"name":logicalFile, "file_type": "input"})
                  })
                  jobInfo = {
                    "name": result.WUInfoResponse.Workunit.Jobname,
                    "title": result.WUInfoResponse.Workunit.Jobname,
                    "description": result.WUInfoResponse.Workunit.Description,
                    "ecl": result.WUInfoResponse.Workunit.Query.Text,
                    "entryBWR": result.WUInfoResponse.Workunit.Jobname,
                    "wuid": result.WUInfoResponse.Workunit.Wuid,
                    "jobfiles": sortFiles(sourceFiles)
                  }
                  resolve(jobInfo);
                })
              } else {
                resolve(jobInfo)
              }
            });
          } else {
            if(result.WUInfoResponse && result.WUInfoResponse.Workunit) {
              var wuInfoResponse = result.WUInfoResponse.Workunit, fileInfo = {};
              if(wuInfoResponse.SourceFiles && wuInfoResponse.SourceFiles.ECLSourceFile) {
                wuInfoResponse.SourceFiles.ECLSourceFile.forEach((sourceFile) => {
                  sourceFiles.push({"name":sourceFile.Name, "file_type": "input"});
                });

              }
              if(wuInfoResponse.Results && wuInfoResponse.Results.ECLResult) {
                let files = wuInfoResponse.Results.ECLResult.filter((result) => {
                  return result.FileName != ""
                })
                files.forEach((file) => {
                  outputFiles.push({"name":file.FileName, "file_type": "output"});
                })
              }

              jobInfo = {
                "name": result.WUInfoResponse.Workunit.Jobname,
                "title": result.WUInfoResponse.Workunit.Jobname,
                "description": result.WUInfoResponse.Workunit.Description,
                "ecl": result.WUInfoResponse.Workunit.Query.Text,
                "entryBWR": result.WUInfoResponse.Workunit.Jobname,
                "wuid": result.WUInfoResponse.Workunit.Wuid,
                "jobfiles": sortFiles(sourceFiles.concat(outputFiles))
              };
              resolve(jobInfo);
            }

          }
        }
      });
    });
  });
}

exports.getJobWuidByName = (clusterId, jobName) => {
  return new Promise((resolve, reject) => {
    module.exports.getCluster(clusterId).then(function(cluster) {
      request.get({
        url: cluster.thor_host + ':' + cluster.thor_port +'/WsWorkunits/WUQuery.json?Jobname='+jobName,
        auth : module.exports.getClusterAuth(cluster)
      }, function(err, response, body) {
        if (err) {
          console.log('ERROR - ', err);
          reject(err);
        } else {
          var result = JSON.parse(body);
          if(result.Exceptions) {
            reject(err);
          }
          if(result.WUQueryResponse
            && result.WUQueryResponse.Workunits
            && result.WUQueryResponse.Workunits.ECLWorkunit
            && result.WUQueryResponse.Workunits.ECLWorkunit.length > 0) {
            //return the first wuid assuming that is the latest one
            resolve(result.WUQueryResponse.Workunits.ECLWorkunit[0].Wuid);
          } else {
            resolve(null);
          }
        }
      });
    });
  });
}

exports.resubmitWU = (clusterId, wuid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let body = {
        "WUResubmitRequest": {
           "Wuids": {
             "Item": [
               wuid
             ]
           },
           "BlockTillFinishTimer": 0,
           "ResetWorkflow": true,
           "CloneWorkunit": false
         }
      }
      let cluster = await module.exports.getCluster(clusterId);
      console.log(JSON.stringify(body));
      request.post({
        url: cluster.thor_host + ':' + cluster.thor_port +'/WsWorkunits/WUResubmit.json?ver_=1.77',
        auth : module.exports.getClusterAuth(cluster),
        body: JSON.stringify(body),
        headers: {'content-type' : 'application/json'},
      }, function(err, response, body) {
        if (err) {
          console.log('ERROR - ', err);
          reject(err);
        } else {
          var result = JSON.parse(body);
          console.log(result);
          resolve(result)
        }
      });
    } catch(err) {
      reject(err);
    }
  })
}

exports.workunitInfo = (wuid, cluster) => {
  let clusterAuth = module.exports.getClusterAuth(cluster);
  let wsWorkunits = new hpccJSComms.WorkunitsService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : ""), type: "get" });
  return new Promise((resolve, reject) => {
    wsWorkunits.WUInfo({"Wuid":wuid, "IncludeExceptions":true, "IncludeSourceFiles":true, "IncludeResults":true, "IncludeTotalClusterTime": true}).then(async (wuInfo) => {
      if(wuInfo.Workunit.State == 'completed' || wuInfo.Workunit.State == 'failed' || wuInfo.Workunit.State == 'wait' || wuInfo.Workunit.State == 'compiled') {
        resolve(wuInfo);
      } else {
        setTimeout(_ => {
          resolve(module.exports.workunitInfo(wuid, cluster));
        }, 500);

      }
    })
  });
}


let getFileLayout = (cluster, fileName, format) =>  {
	var layoutResults = [];
	if(format == 'csv') {
		return requestPromise.get({
		  url: cluster.thor_host + ':' + cluster.thor_port +'/WsDfu/DFURecordTypeInfo.json?Name='+fileName,
		  auth : module.exports.getClusterAuth(cluster)
		}).then(function(response) {
			var result = JSON.parse(response);
			if (result.DFURecordTypeInfoResponse != undefined) {
				if(result.DFURecordTypeInfoResponse.jsonInfo.fields != undefined) {
					result.DFURecordTypeInfoResponse.jsonInfo.fields.forEach((field, idx) => {
						layoutResults.push({
							"id": idx,
							"name" : field.name
						})
					})

					return layoutResults;
				}

			}
		})
	} else {
		return requestPromise.get({
		  url: cluster.thor_host + ':' + cluster.thor_port +'/WsDfu/DFUGetFileMetaData.json?LogicalFileName='+fileName,
		  auth : module.exports.getClusterAuth(cluster)
		}).then(function(response) {
			  var result = JSON.parse(response);
	    	if(result.DFUGetFileMetaDataResponse != undefined) {
				  var fileInfoResponse = result.DFUGetFileMetaDataResponse.DataColumns.DFUDataColumn, fileInfo = {};
	      		fileInfoResponse.forEach(function(column, idx) {
	      			if(column.ColumnLabel !== '__fileposition__') {
		      			var layout = {
		      				"id": idx,
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
			      			column.DataColumns.DFUDataColumn.forEach(function(childColumn, idx) {
			      				var childColumnObj = {
			      					"id": idx,
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

}

exports.getClusterAuth = (cluster) => {
	let auth = {};
	if(cluster.username && cluster.hash) {
		auth.user = cluster.username,
		auth.password = cluster.hash
		return auth;
	} else {
		return null;
	}
}

exports.getCluster = (clusterId) => {
	return Cluster.findOne( {where: {id:clusterId}} ).then(async function(cluster) {
		if(cluster == null) {
      throw new Error("Cluster not reachable...");
    }

    if(cluster.hash) {
			cluster.hash = crypto.createDecipher(algorithm,process.env['cluster_cred_secret']).update(cluster.hash,'hex','utf8');
		}
		let isReachable = await module.exports.isClusterReachable(cluster.thor_host, cluster.thor_port, cluster.username, cluster.password);
		if(isReachable)	 {
			return cluster;
		} else {
			throw new Error("Cluster not reachable...");
		}
	})
}

exports.isClusterReachable = async (clusterHost, port, username, password) => {
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

 exports.updateCommonData = (objArray, fields) => {
    if(objArray && objArray.length>0){
    Object.keys(fields).forEach(function (key, index) {
        objArray.forEach(function(obj) {
            obj[key] = fields[key];
        });
    });
    }
    return objArray;
}

let sortFiles = (files) => {
  return files.sort((a, b) => (a.name > b.name) ? 1 : -1);
}