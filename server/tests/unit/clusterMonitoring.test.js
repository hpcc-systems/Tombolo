//dependencies to start app.js and make calls
const express = require("express");
const request = require("supertest");
const app = express();
app.use(express.json());

//import model and spy functions that will be called
const models = require("../../models");
const JobScheduler = require("../../job-scheduler");
const logger = require("../../config/logger");

const ClusterMonitoring = models.clusterMonitoring;

//route and models imported for testing
const clusterMonitoring = require("../../routes/clustermonitoring/read");
app.use("/api/clustermonitoring", clusterMonitoring);

//bring in standard testing data
const mockData = require("../mock-data/clustermonitoring.json");
ClusterMonitoring.create = jest.fn(async () => {
  return mockData;
});
ClusterMonitoring.findOne = jest.fn(async () => {
  return mockData;
});
ClusterMonitoring.findAll = jest.fn();
ClusterMonitoring.destroy = jest.fn();
ClusterMonitoring.update = jest.fn(async () => {
  return mockData;
});
logger.verbose = jest.fn(() => {});
JobScheduler.createClusterMonitoringBreeJob = jest.fn();
JobScheduler.removeJobFromScheduler = jest.fn();

//write tests
describe("Cluster Monitoring Tests", () => {
  //globals needed for multiple tests
  const application_id = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc001";
  const id = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc003";
  let response;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    response = null;
  });

  describe("Route Checks", () => {
    test("Create Cluster Monitoring", async () => {
      response = await request(app)
        .post(`/api/clustermonitoring/`)
        .send(mockData)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");

      expect(ClusterMonitoring.create).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(201);
      expect(response.body).toStrictEqual(mockData);
    });

    test("Create Cluster Monitoring - No Data Error", async () => {
      response = await request(app).post(`/api/clustermonitoring/`);
      expect(ClusterMonitoring.create).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Get All - No Data Error", async () => {
      response = await request(app).get(
        `/api/clustermonitoring/all/${application_id}`
      );
      expect(ClusterMonitoring.findAll).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Get All", async () => {
      response = await request(app).get(
        `/api/clustermonitoring/all/badapplicationid`
      );
      expect(ClusterMonitoring.findAll).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Delete", async () => {
      response = await request(app).delete(`/api/clustermonitoring/${id}`);
      expect(ClusterMonitoring.destroy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Delete - Error", async () => {
      response = await request(app).delete(`/api/clustermonitoring/badID`);
      expect(ClusterMonitoring.destroy).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Update Monitoring Active", async () => {
      response = await request(app).put(
        `/api/clustermonitoring/clusterMonitoringStatus/${id}`
      );
      expect(ClusterMonitoring.findOne).toHaveBeenCalledTimes(1);
      expect(ClusterMonitoring.update).toHaveBeenCalledTimes(1);
      expect(JobScheduler.createClusterMonitoringBreeJob).toHaveBeenCalledTimes(
        1
      );
      expect(JobScheduler.removeJobFromScheduler).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(200);
    });

    test("Update Monitoring Active - Error", async () => {
      response = await request(app).put(
        `/api/clustermonitoring/clusterMonitoringStatus/badid`
      );
      expect(ClusterMonitoring.findOne).toHaveBeenCalledTimes(0);
      expect(ClusterMonitoring.update).toHaveBeenCalledTimes(0);
      expect(JobScheduler.createClusterMonitoringBreeJob).toHaveBeenCalledTimes(
        0
      );
      expect(JobScheduler.removeJobFromScheduler).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    // test("Get One", async () => {
    //   response = await request(app).get(`/api/clustermonitoring/${id}`);
    //   expect(ClusterMonitoring.findOne).toHaveBeenCalledTimes(1);
    //   expect(response.status).toBe(200);
    //   expect(response.body).toStrictEqual(mockData);
    // });

    // test("Get One - Error", async () => {
    //   response = await request(app).get(`/api/clustermonitoring/badId`);
    //   expect(ClusterMonitoring.findOne).toHaveBeenCalledTimes(0);
    //   expect(response.status).toBe(422);
    // });
  });
});
