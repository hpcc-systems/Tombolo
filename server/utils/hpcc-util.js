const dbUtil = require('./db');
var request = require('request');
var requestPromise = require('request-promise');
var models  = require('../models');
var Cluster = models.cluster;
let hpccJSComms = require("@hpcc-js/comms");
const crypto = require('crypto');
let algorithm = 'aes-256-ctr';

exports.fileInfo = (fileName, clusterId) => {
	console.log('fileName: '+fileName+', '+clusterId);
	return new Promise((resolve, reject) => {
		module.exports.getCluster(clusterId).then(function(cluster) {
				let clusterAuth = module.exports.getClusterAuth(cluster);
				let dfuService = new hpccJSComms.DFUService({ baseUrl: cluster.thor_host + ':' + cluster.thor_port, userID:(clusterAuth ? clusterAuth.user : ""), password:(clusterAuth ? clusterAuth.password : "")});
				dfuService.DFUInfo({"Name":fileName}).then(response => {
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
	    		getFileLayout(cluster, fileName).then(function(fileLayout) {
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
	      	 	resolve(fileInfo);
	    		})

			  });
			});
	}).catch((err) => {
    console.log('err', err);
    reject(err);
	})
}

let getFileLayout = (cluster, fileName) =>  {
	var layoutResults = [];
	return requestPromise.get({
	  url: cluster.thor_host + ':' + cluster.thor_port +'/WsDfu/DFUGetFileMetaData.json?LogicalFileName='+fileName,
	  auth : module.exports.getClusterAuth(cluster)
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
		if(cluster.hash) {
			cluster.hash = crypto.createDecipher(algorithm,dbUtil.secret).update(cluster.hash,'hex','utf8');
		}
		let isReachable = await module.exports.isClusterReachable(cluster.thor_host, cluster.thor_port, cluster.username, cluster.password);
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
    if(objArray.length>0){
    Object.keys(fields).forEach(function (key, index) {
        objArray.forEach(function(obj) {
            obj[key] = fields[key];
        });
    });
    }
    return objArray;
}