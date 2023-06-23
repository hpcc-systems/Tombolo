//dependencies to start app.js and make calls
const express = require("express");
const request = require("supertest");
const app = express();
app.use(express.json());

//import model and spy functions that will be called
const models = require("../../models");
const Cluster = models.cluster;
const hpccUtil = require("../../utils/hpcc-util");
const hpccJSComms = require("@hpcc-js/comms");
hpccJSComms.MachineService = jest.fn(hpccJSComms.MachineService);

//bring in standard testing data
const mockData = require("../mock-data/cluster.json");

hpccUtil.getCluster = jest.fn(async () => {
  return mockData;
});

Cluster.findOne = jest.fn(async () => {
  return mockData;
});

// //this example shows how to return example data
// apiKey.findOne = jest.fn(() => {
//     return mockData
// })

//route and models imported for testing
const cluster = require("../../routes/cluster/read");
app.use("/api/cluster", cluster);

//write tests
describe("Cluster Tests", () => {
  //globals needed for multiple tests
  const application_id = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc001";
  const clusterId = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc001";
  let response;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache

    response = null;
  });

  describe("Route Checks", () => {
    // test("Get Current Usage", async () => {
    //   response = await request(app).get(
    //     `/api/cluster//currentClusterUsage/${clusterId}`
    //   );
    //   expect(hpccUtil.getCluster).toBeCalled();
    //   expect(hpccJSComms.MachineService).toBeCalled();
    // });

    test("Get Current Usage - Param Error", async () => {
      response = await request(app).get(
        `/api/cluster/currentClusterUsage/badClusterId`
      );
      expect(response.status).toBe(422);
    });
    // test("Get Historical Usage ", async () => {
    //   response = await request(app).get(`/api/cluster/clusterStorageHistory/1`);
    //   expect(Cluster.findOne).toBeCalled();
    // });

    test("Get Usage File - CSV", async () => {
      response = await request(app).get(
        `/api/cluster/clusterStorageHistory/file/CSV/${clusterId}`
      );
      expect(Cluster.findOne).toBeCalled();
      expect(response.status).toBe(200);
    });

    test("Get Usage File - JSON", async () => {
      response = await request(app).get(
        `/api/cluster/clusterStorageHistory/file/JSON/${clusterId}`
      );
      expect(Cluster.findOne).toBeCalled();
      expect(response.status).toBe(200);
    });

    test("Get Usage File - Bad ID", async () => {
      response = await request(app).get(
        `/api/cluster/clusterStorageHistory/file/JSON/badClusterId`
      );
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });
});
