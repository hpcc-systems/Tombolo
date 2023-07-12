//dependencies to start app.js and make calls
const express = require("express");
const request = require("supertest");
const app = express();
app.use(express.json());

//import model and spy functions that will be called
const models = require("../../models");
const SuperFileMonitoring = models.filemonitoring_superfiles;
const jobScheduler = require("../../job-scheduler");

//route and models imported for testing
const Superfile = require("../../routes/superfilemonitoring/read");
app.use("/api/superfile", Superfile);

//bring in standard testing data
const mockData = require("../mock-data/superfile.json");
SuperFileMonitoring.create = jest.fn(async () => {
  return mockData;
});
SuperFileMonitoring.findOne = jest.fn(async () => {
  return mockData;
});
SuperFileMonitoring.findAll = jest.fn();
SuperFileMonitoring.destroy = jest.fn();
SuperFileMonitoring.update = jest.fn(async () => {
  return mockData;
});

jobScheduler.scheduleFileMonitoringBreeJob = jest.fn();
jobScheduler.removeJobFromScheduler = jest.fn();

//write tests
describe("Superfile Tests", () => {
  //globals needed for multiple tests
  const application_id = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc001";
  const id = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc003";
  let response;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    response = null;
  });

  describe("Route Checks", () => {
    test("Create Superfile", async () => {
      response = await request(app)
        .post(`/api/superfile/`)
        .send(mockData)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");

      expect(SuperFileMonitoring.create).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(201);
      expect(response.body).toStrictEqual(mockData);
    });

    test("Create Superfile - No Data Error", async () => {
      response = await request(app).post(`/api/superfile/`);
      expect(SuperFileMonitoring.create).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Get All ", async () => {
      response = await request(app).get(`/api/superfile/all/${application_id}`);
      expect(SuperFileMonitoring.findAll).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Get All - No Data Error", async () => {
      response = await request(app).get(`/api/superfile/all/badapplicationid`);
      expect(SuperFileMonitoring.findAll).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Delete", async () => {
      response = await request(app).delete(
        `/api/superfile/${id}/${application_id}`
      );
      expect(SuperFileMonitoring.destroy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Delete - Error", async () => {
      response = await request(app).delete(
        `/api/superfile/badID/${application_id}`
      );
      expect(SuperFileMonitoring.destroy).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Update Monitoring Active", async () => {
      response = await request(app).put(
        `/api/superfile//superfileMonitoringStatus/${id}`
      );
      expect(SuperFileMonitoring.findOne).toHaveBeenCalledTimes(1);
      expect(SuperFileMonitoring.update).toHaveBeenCalledTimes(1);
      expect(jobScheduler.scheduleFileMonitoringBreeJob).toHaveBeenCalledTimes(
        1
      );
      expect(jobScheduler.removeJobFromScheduler).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(200);
    });

    test("Update Monitoring Active - Error", async () => {
      response = await request(app).put(
        `/api/superfile//superfileMonitoringStatus/badid`
      );
      expect(SuperFileMonitoring.findOne).toHaveBeenCalledTimes(0);
      expect(SuperFileMonitoring.update).toHaveBeenCalledTimes(0);
      expect(jobScheduler.scheduleFileMonitoringBreeJob).toHaveBeenCalledTimes(
        0
      );
      expect(jobScheduler.removeJobFromScheduler).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Get One", async () => {
      response = await request(app).get(`/api/superfile/${id}`);
      expect(SuperFileMonitoring.findOne).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual(mockData);
    });

    test("Get One - Error", async () => {
      response = await request(app).get(`/api/superfile/badId`);
      expect(SuperFileMonitoring.findOne).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });
  });
});
