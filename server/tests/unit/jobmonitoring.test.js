//dependencies to start app.js and make calls
const express = require("express");
const request = require("supertest");
const app = express();
app.use(express.json());

//import model and spy functions that will be called
const models = require("../../models");
const JobMonitoring = models.jobMonitoring;
const hpccJSComms = require("@hpcc-js/comms");
const hpccUtil = require("../../utils/hpcc-util");
const JobScheduler = require("../../job-scheduler");

//route and models imported for testing
const jobmonitoring = require("../../routes/jobmonitoring/read");
app.use("/api/job", jobmonitoring);

//bring in standard testing data
const mockData = require("../mock-data/job.json");

JobMonitoring.create = jest.fn(async () => {
  return mockData;
});
JobMonitoring.findOne = jest.fn(async () => {
  return mockData;
});
JobMonitoring.findAll = jest.fn();
JobMonitoring.destroy = jest.fn();
JobMonitoring.update = jest.fn(async () => {
  return mockData;
});

JobScheduler.createJobMonitoringBreeJob = jest.fn();
JobScheduler.removeJobFromScheduler = jest.fn();

//write tests
describe("File Monitoring Tests", () => {
  //globals needed for multiple tests
  const application_id = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc001";
  const id = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc003";
  let response;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    response = null;
  });

  describe("Route Checks", () => {
    test("Create Job Monitoring", async () => {
      response = await request(app)
        .post(`/api/job/`)
        .send(mockData)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");

      expect(JobMonitoring.create).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(201);
      expect(response.body).toStrictEqual(mockData);
    });
    test("Create File - No Data Error", async () => {
      response = await request(app).post(`/api/job/`);
      expect(JobMonitoring.create).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Get All - No Data Error", async () => {
      response = await request(app).get(`/api/job/all/${application_id}`);
      expect(JobMonitoring.findAll).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Get All", async () => {
      response = await request(app).get(`/api/job/all/badapplicationid`);
      expect(JobMonitoring.findAll).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Get One", async () => {
      response = await request(app).get(`/api/job/${id}`);
      expect(JobMonitoring.findOne).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual(mockData);
    });

    test("Get One - Error", async () => {
      response = await request(app).get(`/api/job/badId`);
      expect(JobMonitoring.findOne).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Delete", async () => {
      response = await request(app).delete(`/api/job/${id}`);
      expect(JobMonitoring.destroy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Delete - Error", async () => {
      response = await request(app).delete(`/api/job/badID`);
      expect(JobMonitoring.destroy).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Update Monitoring Active", async () => {
      response = await request(app).put(`/api/job/jobMonitoringStatus/${id}`);
      expect(JobMonitoring.findOne).toHaveBeenCalledTimes(1);
      expect(JobMonitoring.update).toHaveBeenCalledTimes(1);
      expect(JobScheduler.createJobMonitoringBreeJob).toHaveBeenCalledTimes(1);
      expect(JobScheduler.removeJobFromScheduler).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(200);
    });

    test("Update Monitoring Active - Error", async () => {
      response = await request(app).put(`/api/job/jobMonitoringStatus/badid`);
      expect(JobMonitoring.findOne).toHaveBeenCalledTimes(0);
      expect(JobMonitoring.update).toHaveBeenCalledTimes(0);
      expect(JobScheduler.createJobMonitoringBreeJob).toHaveBeenCalledTimes(0);
      expect(JobScheduler.removeJobFromScheduler).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });
  });
});
