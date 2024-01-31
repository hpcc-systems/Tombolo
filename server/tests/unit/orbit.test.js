//dependencies to start app.js and make calls
const express = require("express");
const request = require("supertest");
const app = express();
app.use(express.json());
const sql = require("mssql");

//bring in standard testing data
const mockData = require("../mock-data/global.json");
const mockOrbitMonitoringData = require("../mock-data/orbitMonitoring.json");
const mockOrbitMonitoringDataBadID = require("../mock-data/orbitMonitoringBad.json");
const mockSqlReturnData = require("../mock-data/sqlData.json");

//import model and spy functions that will be called
const models = require("../../models");
const jobScheduler = require("../../job-scheduler");
const orbitBuild = models.orbitBuilds;
const orbitMonitoring = models.orbitMonitoring;
const monitoring_notifications = models.monitoring_notifications;

//orbit Builds mocks
orbitBuild.findOne = jest.fn();
orbitBuild.findAll = jest.fn();
orbitBuild.update = jest.fn();
orbitBuild.create = jest.fn();
orbitBuild.destroy = jest.fn();

//orbit Monitoring mocks
orbitMonitoring.findOne = jest.fn(() => {
  return mockOrbitMonitoringData;
});
orbitMonitoring.findAll = jest.fn(() => {
  return mockOrbitMonitoringData;
});
orbitMonitoring.update = jest.fn();
orbitMonitoring.create = jest.fn(() => {
  return mockOrbitMonitoringData;
});
orbitMonitoring.destroy = jest.fn();

//monitoring notifications mocks
monitoring_notifications.bulkCreate = jest.fn();

//job scheduler mocks
jobScheduler.createOrbitMonitoringJob = jest.fn();
jobScheduler.removeJobFromScheduler = jest.fn();
jobScheduler.getAllJobs = jest.fn();

//sql mocks
sql.connect = jest.fn();
sql.query = jest.fn(() => {
  return mockSqlReturnData;
});

//route and models imported for testing
const orbit = require("../../routes/orbit/read");
const orbitbuilds = require("../../models/orbitbuilds");
app.use("/api/orbit", orbit);

describe("Integration Tests", () => {
  //globals needed for multiple tests
  const { application_id, badApplicationId, name, keyword, id } = mockData;
  let response;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    response = null;
  });

  describe("Route Checks", () => {
    test("Create One", async () => {
      response = await request(app)
        .post(`/api/orbit/`)
        .send(mockOrbitMonitoringData)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");

      expect(orbitMonitoring.create).toHaveBeenCalledTimes(1);
      expect(sql.query).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(201);
    });

    test("Create One - Bad App ID", async () => {
      response = await request(app)
        .post(`/api/orbit/`)
        .send(mockOrbitMonitoringDataBadID)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("Get All Monitorings", async () => {
      response = await request(app).get(
        `/api/orbit/allMonitorings/${application_id}`
      );
      expect(orbitMonitoring.findAll).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Get All Monitorings - Bad Data", async () => {
      response = await request(app).get(
        `/api/orbit/allMonitorings/${badApplicationId}`
      );
      expect(orbitMonitoring.findAll).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("Get All Builds", async () => {
      response = await request(app).get(
        `/api/orbit/allMonitorings/${application_id}`
      );
      expect(orbitMonitoring.findAll).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Get All Builds - Bad Data", async () => {
      response = await request(app).get(
        `/api/orbit/allMonitorings/${badApplicationId}`
      );
      expect(orbitMonitoring.findAll).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("Get Searched Results", async () => {
      response = await request(app).get(
        `/api/orbit/search/${application_id}/${keyword}`
      );
      expect(sql.query).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Get Searched Results - Bad Data", async () => {
      response = await request(app).get(
        `/api/orbit/search/${badApplicationId}/${keyword}`
      );
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("Get Build Details from SQL", async () => {
      response = await request(app).get(
        `/api/orbit/getOrbitBuildDetails/${name}`
      );
      expect(sql.query).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Get Build Details from SQL", async () => {
      response = await request(app).get(
        `/api/orbit/getOrbitBuildDetails/${"&"}`
      );
      expect(sql.query).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("Update Monitoring", async () => {
      response = await request(app)
        .put(`/api/orbit/`)
        .send(mockOrbitMonitoringData)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");

      expect(orbitMonitoring.findOne).toHaveBeenCalledTimes(1);
      expect(orbitMonitoring.update).toHaveBeenCalledTimes(1);
      expect(sql.connect).toHaveBeenCalledTimes(1);
      expect(sql.query).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Update Monitoring", async () => {
      response = await request(app)
        .put(`/api/orbit/`)
        .send(mockOrbitMonitoringDataBadID)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");

      expect(orbitMonitoring.findOne).toHaveBeenCalledTimes(0);
      expect(orbitMonitoring.update).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("toggle status", async () => {
      response = await request(app).put(
        `/api/orbit/togglestatus/${application_id}`
      );
      expect(orbitMonitoring.findOne).toHaveBeenCalledTimes(1);
      expect(orbitMonitoring.update).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("toggle status - bad id", async () => {
      response = await request(app).put(
        `/api/orbit/togglestatus/${badApplicationId}`
      );
      expect(orbitMonitoring.findOne).toHaveBeenCalledTimes(0);
      expect(orbitMonitoring.update).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("Delete", async () => {
      response = await request(app).delete(
        `/api/orbit/delete/${application_id}/${name}`
      );
      expect(orbitMonitoring.destroy).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Delete", async () => {
      response = await request(app).delete(
        `/api/orbit/delete/${badApplicationId}/${name}`
      );
      expect(orbitMonitoring.destroy).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("Get one", async () => {
      response = await request(app).get(
        `/api/orbit/getOne/${application_id}/${id}`
      );
      expect(orbitMonitoring.findOne).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Get one - Bad ID", async () => {
      response = await request(app).get(
        `/api/orbit/getOne/${badApplicationId}/${id}`
      );
      expect(orbitMonitoring.findOne).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("Get WorkUnits", async () => {
      response = await request(app).get(
        `/api/orbit/getWorkunits/${application_id}`
      );
      expect(orbitMonitoring.findAll).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Get WorkUnits - Bad ID", async () => {
      response = await request(app).get(
        `/api/orbit/getWorkunits/${badApplicationId}`
      );
      expect(orbitMonitoring.findAll).toHaveBeenCalledTimes(0);
      expect(orbitBuild.findAll).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("Update List", async () => {
      response = await request(app).post(
        `/api/orbit/updateList/${application_id}`
      );

      expect(sql.connect).toHaveBeenCalledTimes(1);
      expect(sql.query).toHaveBeenCalledTimes(1);

      expect(response.status).toBe(200);
    });

    test("Update List - Bad ID", async () => {
      response = await request(app).post(
        `/api/orbit/updateList/${badApplicationId}`
      );

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });
});
