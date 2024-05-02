//dependencies to start app.js and make calls
const express = require("express");
const request = require("supertest");
const app = express();
app.use(express.json());

//import model and spy functions that will be called
const models = require("../../models");
const JobScheduler = require("../../job-scheduler");
const logger = require("../../config/logger");

const DirectoryMonitoring = models.directoryMonitoring;

//route and models imported for testing
const directoryMonitoring = require("../../routes/directorymonitoring/read");
app.use("/api/DirectoryMonitoring", directoryMonitoring);

//bring in standard testing data
const mockData = require("../mock-data/directoryMonitoring.json");
DirectoryMonitoring.create = jest.fn(async () => {
  return mockData;
});
DirectoryMonitoring.findAll = jest.fn();
DirectoryMonitoring.findByPk = jest.fn(async () => {
  return DirectoryMonitoring;
});
DirectoryMonitoring.destroy = jest.fn();
DirectoryMonitoring.update = jest.fn(async () => {
  return mockData;
});
JobScheduler.createDirectoryMonitoringBreeJob = jest.fn();
JobScheduler.removeJobFromScheduler = jest.fn();

//write tests
describe("Directory Monitoring Tests", () => {
  //globals needed for multiple tests
  const application_id = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc001";
  const id = "b3468a23-27e8-4915-88ea-cd7a75c40760";
  let response;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    response = null;
  });

  describe("Route Checks", () => {
    test("Create Directory Monitoring", async () => {
      response = await request(app)
        .post(`/api/DirectoryMonitoring/`)
        .send(mockData)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");

      expect(DirectoryMonitoring.create).toHaveBeenCalledTimes(1);

      expect(response.body).toStrictEqual(mockData);
      expect(response.status).toBe(201);
    });

    test("Create Directory Monitoring - No Data Error", async () => {
      response = await request(app).post(`/api/DirectoryMonitoring/`);
      expect(DirectoryMonitoring.create).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Get All", async () => {
      response = await request(app).get(
        `/api/DirectoryMonitoring/all/${application_id}`
      );
      expect(DirectoryMonitoring.findAll).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Get All - error", async () => {
      response = await request(app).get(
        `/api/DirectoryMonitoring/all/badapplicationid`
      );
      expect(DirectoryMonitoring.findAll).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Get One", async () => {
      response = await request(app).get(`/api/DirectoryMonitoring/${id}`);
      expect(DirectoryMonitoring.findByPk).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Get One - error", async () => {
      response = await request(app).get(
        `/api/DirectoryMonitoring/badapplicationid`
      );
      expect(DirectoryMonitoring.findByPk).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Delete", async () => {
      response = await request(app).delete(`/api/DirectoryMonitoring/${id}`);
      expect(DirectoryMonitoring.findByPk).toHaveBeenCalledTimes(1);
      expect(DirectoryMonitoring.destroy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(204);
    });

    test("Delete - Error", async () => {
      response = await request(app).delete(`/api/DirectoryMonitoring/badID`);
      expect(DirectoryMonitoring.destroy).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Update Monitoring", async () => {
      response = await request(app)
        .put(`/api/DirectoryMonitoring/${id}/update`)
        .send(mockData)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");
      expect(DirectoryMonitoring.findByPk).toHaveBeenCalledTimes(1);
      expect(DirectoryMonitoring.update).toHaveBeenCalledTimes(1);
      //will need these when job scheduler is implemented
      //   expect(
      //     JobScheduler.createDirectoryMonitoringBreeJob
      //   ).toHaveBeenCalledTimes(1);
      //   expect(JobScheduler.removeJobFromScheduler).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(200);
    });

    test("Update Monitoring - Error", async () => {
      response = await request(app).put(
        `/api/DirectoryMonitoring/badid/update`
      );
      expect(DirectoryMonitoring.findByPk).toHaveBeenCalledTimes(0);
      expect(DirectoryMonitoring.update).toHaveBeenCalledTimes(0);
      //will need these when job scheduler is implemented
      //   expect(
      //     JobScheduler.createDirectoryMonitoringBreeJob
      //   ).toHaveBeenCalledTimes(0);
      //   expect(JobScheduler.removeJobFromScheduler).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Approve Monitoring", async () => {
      response = await request(app)
        .put(`/api/DirectoryMonitoring/${id}/approve`)
        .send(mockData)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");
      expect(response.status).toBe(200);
      expect(DirectoryMonitoring.findByPk).toHaveBeenCalledTimes(1);
      expect(DirectoryMonitoring.update).toHaveBeenCalledTimes(1);
      //will need these when job scheduler is implemented
      //   expect(
      //     JobScheduler.createDirectoryMonitoringBreeJob
      //   ).toHaveBeenCalledTimes(1);
      //   expect(JobScheduler.removeJobFromScheduler).toHaveBeenCalledTimes(0);
    });

    test("Approve Monitoring - Error", async () => {
      response = await request(app)
        .put(`/api/DirectoryMonitoring/badid/approve`)
        .send(mockData)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");
      expect(DirectoryMonitoring.findByPk).toHaveBeenCalledTimes(0);
      expect(DirectoryMonitoring.update).toHaveBeenCalledTimes(0);
      //will need these when job scheduler is implemented
      //   expect(
      //     JobScheduler.createDirectoryMonitoringBreeJob
      //   ).toHaveBeenCalledTimes(0);
      //   expect(JobScheduler.removeJobFromScheduler).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });

    test("Flip Active Monitoring", async () => {
      response = await request(app)
        .put(`/api/DirectoryMonitoring/${id}/active`)
        .send(mockData)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");
      expect(DirectoryMonitoring.findByPk).toHaveBeenCalledTimes(1);
      expect(DirectoryMonitoring.update).toHaveBeenCalledTimes(1);
      //will need these when job scheduler is implemented
      //   expect(
      //     JobScheduler.createDirectoryMonitoringBreeJob
      //   ).toHaveBeenCalledTimes(1);
      //   expect(JobScheduler.removeJobFromScheduler).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(200);
    });

    test("Flip Active Monitoring - Error", async () => {
      response = await request(app)
        .put(`/api/DirectoryMonitoring/badid/active`)
        .send(mockData)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");
      expect(DirectoryMonitoring.findByPk).toHaveBeenCalledTimes(0);
      expect(DirectoryMonitoring.update).toHaveBeenCalledTimes(0);
      //will need these when job scheduler is implemented
      //   expect(
      //     JobScheduler.createDirectoryMonitoringBreeJob
      //   ).toHaveBeenCalledTimes(0);
      //   expect(JobScheduler.removeJobFromScheduler).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
    });
  });
});
