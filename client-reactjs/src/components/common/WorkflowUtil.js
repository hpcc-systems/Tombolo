import { message } from 'antd/lib';
import { authHeader, handleError } from "./AuthHeader.js"

export function handleJobDelete(jobId, applicationId) {
  console.log(jobId);
  return new Promise((resolve) => {
	  var data = JSON.stringify({jobId: jobId, application_id: applicationId});
	  fetch("/api/job/delete", {
	    method: 'post',
	    headers: authHeader(),
	    body: data
	  }).then((response) => {
	    if(response.ok) {
	      resolve(response.json());
	    } else {
	    	handleError(response);
	    }
	  }).catch(error => {
	    console.log(error);
	    message.error("There was an error deleting the Job file");
	  });
	});
}

export function handleIndexDelete(indexId, applicationId) {
  console.log(indexId);
  return new Promise((resolve) => {
	  var data = JSON.stringify({indexId: indexId, application_id: applicationId});
	  fetch("/api/index/read/delete", {
	    method: 'post',
	    headers: authHeader(),
	    body: data
	  }).then((response) => {
	    if(response.ok) {
	      resolve(response.json());
	    } else {
	    	handleError(response);
	    }
	  }).catch(error => {
	    console.log(error);
	    message.error("There was an error deleting the Index file");
	  });
	});
}

 export function handleQueryDelete(queryId, applicationId) {
  console.log(queryId);
  return new Promise((resolve) => {
	  var data = JSON.stringify({queryId: queryId, application_id: applicationId});
	  fetch("/api/query/delete", {
	    method: 'post',
	    headers: authHeader(),
	    body: data
	  }).then((response) => {
	    if(response.ok) {
	      resolve(response.json());
	    } else {
	    	handleError(response);
	    }
	  }).catch(error => {
	    console.log(error);
	    message.error("There was an error deleting the Query");
	  });
	});
}

export function handleFileDelete (fileId, applicationId) {
  console.log(fileId);
  return new Promise((resolve) => {
    var data = JSON.stringify({fileId: fileId, application_id: applicationId});
    fetch("/api/file/read/delete", {
      method: 'post',
      headers: authHeader(),
      body: data
    }).then((response) => {
      if(response.ok) {
        return response.json();
      } else {
      	handleError(response);
      }
    }).catch(error => {
      console.log(error);
      message.error("There was an error deleting the file");
    });
  });
}

export function updateGraph(assetId, applicationId) {
  console.log(assetId);
  return new Promise((resolve) => {
	  var data = JSON.stringify({id: assetId, application_id: applicationId});
	  fetch("/api/workflowgraph/deleteAsset", {
	    method: 'post',
	    headers: authHeader(),
	    body: data
	  }).then((response) => {
	    if(response.ok) {
	      resolve(response.json());
	    }
	  }).catch(error => {
	    console.log(error);
	    message.error("There was an error updating the graph");
	  });
	});
}
