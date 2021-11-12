var request = require('request');
const path = require('path');
var requestPromise = require('request-promise');
var models  = require('../models');
var Cluster = models.cluster;
let hpccJSComms = require("@hpcc-js/comms");
const crypto = require('crypto');
let algorithm = 'aes-256-ctr';

const simpleGit = require('simple-git');
const cp = require('child_process');
const fs = require('fs');

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
      			"fileType": response.FileDetail.ContentType ? response.FileDetail.ContentType : (response.FileDetail.Format ? response.FileDetail.Format : "thor_file")
      		}
          fileInfo.file_layouts = fileLayout;
          fileInfo.file_validations = [];
      	 	resolve(fileInfo);
    		})

		  }).catch((err) => {
        console.log(err);
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

  exports.fetchDirectories = (host, port, data) => {
    let formData={};
    for(let key in data){
      formData[key] = data[key].toString()
    }
    try {
      return new Promise((resolve, reject) => {
          request.post({
            url: `${host}:${port}/FileSpray/FileList.json`,
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            formData: formData,
            resolveWithFullResponse: true
          }, function(err, response, body) {
            if (err) {
              console.log('ERROR - ', err);
              reject(' Error occured during dropzone file search');
            }
            else {
              var result = JSON.parse(body);		
              resolve(result);							
            }
        })
      })
    } catch (err) {
      console.log('err', err);
      reject('Error occured during dropzone file search');
    }
  }


exports.executeSprayJob = (job) => {
  try {
    return new Promise((resolve, reject) => {
      let cluster = module.exports.getCluster(job.cluster_id).then(async function(cluster) {			
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
          auth : module.exports.getClusterAuth(cluster),
          headers: {'content-type' : 'application/x-www-form-urlencoded'},
          formData: sprayPayload,
          resolveWithFullResponse: true
        }, function(err, response, body) {
          if (err) {
            console.log('ERROR - ', err);
            reject('Error occured during dropzone file search');
          }
          else {
            var result = JSON.parse(body);					
            resolve(result);							
          }
        })
      })
    })
	} catch (err) {
		console.log('err', err);
		reject('Error occured during dropzone file search');
	}
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

exports.getJobWuDetails = (clusterId, jobName) => {
  return new Promise((resolve, reject) => {
    module.exports.getCluster(clusterId).then(function(cluster) {
      let clusterAuth = module.exports.getClusterAuth(cluster);
      let wuService = new hpccJSComms.WorkunitsService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : "")});
      wuService.WUQuery({"Jobname":jobName, "PageSize":1, "PageStartFrom":0}).then((response) => {
        if(response.Workunits
          && response.Workunits.ECLWorkunit
          && response.Workunits.ECLWorkunit.length > 0) {
          //return the first wuid assuming that is the latest one
          resolve({wuid: response.Workunits.ECLWorkunit[0].Wuid, cluster: response.Workunits.ECLWorkunit[0].Cluster});
        } else {
          resolve(null);
        }
      }).catch(err => {
        console.log(err);
        reject(err)
      })
    })
  })
}

exports.resubmitWU = (clusterId, wuid, wucluster) => {
  return new Promise(async (resolve, reject) => {
    console.log(clusterId, wuid, wucluster);
    try {
      let body = {
        "WURunRequest": {
          "Wuid": wuid,
          "CloneWorkunit": true,
          "Cluster": wucluster,
          "Wait": 0
        }
      }
      let cluster = await module.exports.getCluster(clusterId);
      request.post({
        url: cluster.thor_host + ':' + cluster.thor_port +'/WsWorkunits/WURun.json?ver_=1.8',
        auth : module.exports.getClusterAuth(cluster),
        body: JSON.stringify(body),
        headers: {'content-type' : 'application/json'},
      }, function(err, response, body) {
        if (err) {
          console.log('ERROR - ', err);
          reject(err);
        } else {
          var result = JSON.parse(body);
          //console.log(result);
          resolve(result)
        }
      });
    } catch(err) {
      reject(err);
    }
  })
}

exports.workunitInfo = async (wuid, clusterId) => {
  let cluster = await module.exports.getCluster(clusterId);
  let clusterAuth = module.exports.getClusterAuth(cluster);
  let wsWorkunits = new hpccJSComms.WorkunitsService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : ""), type: "get" });
  return new Promise((resolve, reject) => {
    wsWorkunits.WUInfo({"Wuid":wuid, "IncludeExceptions":true, "IncludeSourceFiles":true, "IncludeResults":true, "IncludeTotalClusterTime": true}).then(async (wuInfo) => {
      resolve(wuInfo);
    }).catch((err) => {
      reject(err);
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
    							"required": 'false',
                  "description": ''
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
    									"required": 'false',
                      "description": ''
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
  return new Promise(async (resolve, reject) => {
    try {
      let cluster = await Cluster.findOne( {where: {id:clusterId}} );
      if(cluster == null) {
        throw new Error("Cluster not reachable...");
      }
      if(cluster.hash) {
        cluster.hash = crypto.createDecipher(algorithm,process.env['cluster_cred_secret']).update(cluster.hash,'hex','utf8');
      }
      let isReachable = await module.exports.isClusterReachable(cluster.thor_host, cluster.thor_port, cluster.username, cluster.password);
      if(isReachable)	 {
        resolve(cluster);
      } else {
        reject("Cluster not reachable...")
        //throw new Error("Cluster not reachable...");
      }      
    } catch(err) {
      console.log("Error occured while getting Cluster info....."+err);
      reject(err);
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

exports.getWorkunitsService = async (clusterId) =>{
  const cluster = await module.exports.getCluster(clusterId);
  const clusterAuth =  module.exports.getClusterAuth(cluster);

 const connectionSettings= {
   baseUrl: cluster.thor_host + ':' + cluster.thor_port,
   userID: clusterAuth ? clusterAuth.user : "",
   password: clusterAuth ? clusterAuth.password : ""
 }

 return new hpccJSComms.WorkunitsService(connectionSettings);
}

exports.createWorkUnit = async (clusterId,WUbody = {}) =>{
   try {
    const wuService = await module.exports.getWorkunitsService(clusterId);
    const respond = await wuService.WUCreate(WUbody);
    const wuid = respond.Workunit?.Wuid
    if (!wuid) throw respond;
    return wuid;
  } catch (error) {
    console.log('create workunit error------------------------------------');
    console.dir(error, { depth: null });
    const customError = new Error('Failed to create new Work Unit.');
    customError.details = error; // RESPOND WITH EXCEPTIONS CAN BE FOUND HERE.
    throw customError;
   }
};

exports.updateWorkUnit = async (clusterId, WUupdateBody) =>{
  try {
    const wuService = await module.exports.getWorkunitsService(clusterId);
    const respond = await wuService.WUUpdate(WUupdateBody);
    if (!respond.Workunit?.Wuid) throw respond; // assume that Wuid field is always gonna be in "happy" response
    return respond;
  } catch (error) {
    console.log('update workunit error------------------------------------');
    console.dir(error, { depth: null });
    const customError = new Error('Failed to update Work Unit.')
    customError.details = error; // RESPOND WITH EXCEPTIONS CAN BE FOUND HERE.
    throw customError;
  }
};

exports.submitWU = async (clusterId, WUsubmitBody) =>{
  try {
    const wuService = await module.exports.getWorkunitsService(clusterId);
    const respond = await wuService.WUSubmit(WUsubmitBody);
    if (respond.Exceptions) throw respond;
    return respond;
  } catch (error) {
    console.log('submit workunit error-----------------------------------');
    console.dir(error, { depth: null });
    const customError = new Error('Failed to submit Work Unit.')
    customError.details = error; // RESPOND WITH EXCEPTIONS CAN BE FOUND HERE.
    throw customError; 
  }
};

exports.updateWUAction = async (clusterId,WUactionBody) =>{  
  try {
    const wuService = await module.exports.getWorkunitsService(clusterId);
    const respond = await wuService.WUAction(WUactionBody);
    const result = respond.ActionResults?.WUActionResult?.[0]?.Result
    if (!result || result !== 'Success' ) throw respond;
    console.dir(respond, { depth: null });
    console.log('------------------------------------------');
    return respond;
  } catch (error) {
    console.log('update workunit action error----------------------------');
    console.dir(error, { depth: null });
    const customError = new Error("Failed to update Work Unit action");
    customError.details = error; // RESPOND WITH EXCEPTIONS CAN BE FOUND HERE.
    throw customError; 
  }
}

exports.pullFilesFromGithub = async( jobName="", clusterId, fileData ) => {

  const { selectedGitBranch, providedGithubRepo, selectedFile } = fileData; // TODO will need username and token in order to pull private repo
  const { projectOwner, projectName, name:startFileName, path:filePath } = selectedFile;

  const allClonesPath = path.join(process.cwd(),'..','gitClones');
  const currentClonedRepoPath = `${allClonesPath}/${projectOwner}_${projectName}` ;

  const executionRepoPath = path.join(currentClonedRepoPath,filePath.replace(startFileName,''));
  const startFilePath =path.join(currentClonedRepoPath,filePath);

  const gitOptions= { baseDir: allClonesPath };
  const git = simpleGit(gitOptions);

  const tasks ={ repoCloned: false, repoDeleted: false, archiveCreated: false, WUCreated:false, WUupdated: false, WUsubmitted: false, WUaction: null, error: null };
 
  let wuService;
  let wuid;
  try {
    // initializing wuService to update hpcc.
    wuService = await module.exports.getWorkunitsService(clusterId); 
    console.log('pullFilesFromGithub: DELETING REPO IF EXISTS-----------------------------------');
    deleteRepo(currentClonedRepoPath);
    // #1 - Clone repo
    console.log('pullFilesFromGithub: CLONING STARTED-------------------------------------------');
    await git.clone(providedGithubRepo, currentClonedRepoPath ,{'--branch':selectedGitBranch, '--single-branch':true} );
    tasks.repoCloned = true;
    console.log('pullFilesFromGithub: CLONING FINISHED------------------------------------------');

    // #2 - Create Archive XML File     
    let args = ['-E', startFilePath, '-I', executionRepoPath];
    const archived = await createEclArchive(args, executionRepoPath);
    tasks.archiveCreated =true;
    console.log('pullFilesFromGithub: Archive Created-------------------------------------------');
    console.dir(archived);

    // #3 - Create empty Work Unit;
    const createRespond = await wuService.WUCreate({}); 
    wuid = createRespond.Workunit?.Wuid
    if (!wuid) {
      console.log('pullFilesFromGithub: WUCreate error-----------------------------------------');
      console.dir(createRespond, { depth: null });
      throw new Error('Failed to update Work Unit.')
    }
    tasks.WUCreated = true;
    console.log('pullFilesFromGithub: WUCreated------------------------------------------------');

    // #4 - Update the Workunit with Archive XML 
    const updateBody ={ "Wuid": wuid, "Jobname": jobName, "QueryText": archived.stdout};
    const updateRespond = await wuService.WUUpdate(updateBody)
    if (!updateRespond.Workunit?.Wuid) { // assume that Wuid field is always gonna be in "happy" response
      console.log('pullFilesFromGithub: WUupdate error----------------------------------------');
      console.dir(updateRespond, { depth: null });
      throw new Error('Failed to update Work Unit.')
    }
    tasks.WUupdated = true;
    console.log('pullFilesFromGithub: WUupdated-----------------------------------------------');
    
    // #5 - Submit the Workunit to HPCC 
    const submitBody ={ "Wuid": wuid, "Cluster": 'thor' };
    const submitRespond = await wuService.WUSubmit(submitBody)
    if (submitRespond.Exceptions) {
      console.log('pullFilesFromGithub: WUsubmit error---------------------------------------');
      console.dir(submitRespond, { depth: null });
      throw new Error('Failed to submit Work Unit.')
    } 
    tasks.WUsubmitted = true;
    console.log('pullFilesFromGithub: WUsubmitted--------------------------------------------');

  } catch (error) { 
    // Error going to have messages related to where in process error happened, it will end up in router.post('/executeJob' catch block.
    try {
      const WUactionBody = { "Wuids": { "Item": [wuid] }, "WUActionType": "SetToFailed" };
      const actionRespond = await wuService.WUAction(WUactionBody);
      const result = actionRespond.ActionResults?.WUActionResult?.[0]?.Result
      if (!result || result !== 'Success' ) {
        console.log('pullFilesFromGithub: WUaction error-------------------------------------');
        console.dir(actionRespond, { depth: null });
        throw actionRespond
      }
      tasks.WUaction = actionRespond.ActionResults.WUActionResult;
    } catch (error) {
       error.message ?
       tasks.WUaction= {message:error.message, failedToUpdate: true} :
       tasks.WUaction= {...error, failedToUpdate: true };    
    }

    tasks.error = error;
    console.log('pullFilesFromGithub: ERROR IN MAIN CATCH------------------------------------');
    console.dir(error, { depth: null });
  } finally {
    //  delete repo;
    const isDeleted = deleteRepo(currentClonedRepoPath);
    console.log('pullFilesFromGithub: CLEANUP, REPO DELETED SUCCESSFULLY---------------------');
    tasks.repoDeleted = isDeleted;
    const summary = { wuid, ...tasks };
    return summary;
  }
};

const deleteRepo = (currentClonedRepoPath) => {
  let isRepoDeleted
  try {
      fs.rmSync(currentClonedRepoPath, { recursive: true, maxRetries:5, force: true });
      isRepoDeleted = true;
    } catch (err) {
      console.log('------------------------------------------');
      console.log('pullFilesFromGithub: Failed to delete a repo')
      console.dir(err);
      isRepoDeleted = false;
    } 
    return isRepoDeleted;
  }

let sortFiles = (files) => {
  return files.sort((a, b) => (a.name > b.name) ? 1 : -1);
}


const createEclArchive = (args, cwd) => {

  return new Promise((resolve, reject) => {
    const child = cp.spawn('eclcc', args, { cwd: cwd });
    child.on('error',(error)=>{
      error.message = 'Failed to create ECL Archive';
      reject(error)
    })
    let stdOut = "", stdErr = "";
    child.stdout.on("data", (data) => {
      stdOut += data.toString();
    });
    child.stderr.on("data", (data) => {
      stdErr += data.toString();
    });
    child.on("close", (_code, _signal) => {
      resolve({
        stdout: stdOut.trim(),
        stderr: stdErr.trim()
      });
    });
  });
};
