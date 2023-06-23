//dependencies to start app.js and make calls
const express = require("express");
const request = require("supertest");
const app = express();
app.use(express.json());

//import model and spy functions that will be called
const models = require("../../models");
const FileMonitoring = models.fileMonitoring;
const jobScheduler = require("../../job-scheduler");

//route and models imported for testing
const filemonitoring = require("../../routes/filemonitoring/read");
app.use("/api/file", filemonitoring);

//bring in standard testing data
const mockData = require("../mock-data/file.json");
FileMonitoring.create = jest.fn(async () => {
  return mockData;
});
FileMonitoring.findOne = jest.fn(async () => {
  return mockData;
});
FileMonitoring.findAll = jest.fn();
FileMonitoring.destroy = jest.fn();
FileMonitoring.update = jest.fn(async () => {
  return mockData;
});

jobScheduler.scheduleFileMonitoringBreeJob = jest.fn();
jobScheduler.removeJobFromScheduler = jest.fn();

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
    test("Create file", async () => {
      response = await request(app)
        .post(`/api/file/`)
        .send(mockData)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");

      expect(FileMonitoring.create).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(201);
      expect(response.body).toStrictEqual(mockData);
    });
    test("Create File - No Data Error", async () => {
      response = await request(app).post(`/api/file/`);
      expect(FileMonitoring.create).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Get All - No Data Error", async () => {
      response = await request(app).get(`/api/file/all/${application_id}`);
      expect(FileMonitoring.findAll).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Get All", async () => {
      response = await request(app).get(`/api/file/all/badapplicationid`);
      expect(FileMonitoring.findAll).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Get One", async () => {
      response = await request(app).get(`/api/file/${id}`);
      expect(FileMonitoring.findOne).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual(mockData);
    });

    test("Get One - Error", async () => {
      response = await request(app).get(`/api/file/badId`);
      expect(FileMonitoring.findOne).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Delete", async () => {
      response = await request(app).delete(`/api/file/${id}/${application_id}`);
      expect(FileMonitoring.destroy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Delete - Error", async () => {
      response = await request(app).delete(`/api/file/badID/${application_id}`);
      expect(FileMonitoring.destroy).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Update Monitoring Active", async () => {
      response = await request(app).put(
        `/api/file//fileMonitoringStatus/${id}`
      );
      expect(FileMonitoring.findOne).toHaveBeenCalledTimes(1);
      expect(FileMonitoring.update).toHaveBeenCalledTimes(1);
      expect(jobScheduler.scheduleFileMonitoringBreeJob).toHaveBeenCalledTimes(
        1
      );
      expect(jobScheduler.removeJobFromScheduler).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(200);
    });

    test("Update Monitoring Active - Error", async () => {
      response = await request(app).put(`/api/file/fileMonitoringStatus/badid`);
      expect(FileMonitoring.findOne).toHaveBeenCalledTimes(0);
      expect(FileMonitoring.update).toHaveBeenCalledTimes(0);
      expect(jobScheduler.scheduleFileMonitoringBreeJob).toHaveBeenCalledTimes(
        0
      );
      expect(jobScheduler.removeJobFromScheduler).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });
  });
});
