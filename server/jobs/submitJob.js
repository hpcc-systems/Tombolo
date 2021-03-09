const { parentPort, workerData } = require("worker_threads");
const request = require('request-promise');

let isCancelled = false;

if (parentPort) {
  parentPort.once('message', (message) => {
    if (message === 'cancel') isCancelled = true;
  });
}

(async () => {
  console.log(
    `submitting job ${workerData.jobName} ` +
    `(WU: ${workerData.workunitId}) to url ${workerData.cluster}/WsWorkunits/WUResubmit.json?ver_=1.78`
  );
  try {
    let response = await request({
      method: 'POST',
      uri: workerData.cluster + '/WsWorkunits/WUResubmit.json?ver_=1.78',
      body: {
        "WUResubmitRequest": {
          "Wuids": {
            "Item": [workerData.workunitId]
          },
          "BlockTillFinishTimer": 0,
          "ResetWorkflow": false,
          "CloneWorkunit": false
        }
      },
      json: true,
      // uri: workerData.cluster + '/WsWorkunits/WUResult.json',
      // form: {
      //   Wuid: workerData.workunitId
      // },
      headers: {
        'Content-Type': 'application/json'
      },
      resolveWithFullResponse: true
    });
    if (response.body) {
      console.log(JSON.stringify(response.body));
    }
  } catch (err) {
    console.log(err);
  } finally {
    if (parentPort) {
      parentPort.postMessage('done');
    } else {
      process.exit(0);
    }
  }
})();