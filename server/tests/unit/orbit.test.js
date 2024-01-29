//dependencies to start app.js and make calls
const express = require("express");
const request = require("supertest");
const app = express();
app.use(express.json());
const sql = require("mssql");

//bring in standard testing data
const mockData = require("../mock-data/global.json");
const mockOrbitMonitoringData = require("../mock-data/orbitMonitoring.json");
const mockSqlReturnData = require("../mock-data/sqlData.json");

//import model and spy functions that will be called
const models = require("../../models");
const orbitBuild = models.orbitBuilds;
const orbitMonitoring = models.orbitMonitoring;

//orbit Builds mocks
orbitBuild.findOne = jest.fn();
orbitBuild.findAll = jest.fn();
orbitBuild.update = jest.fn();

//orbit Monitoring mocks
orbitMonitoring.findOne = jest.fn(() => {
  return mockOrbitMonitoringDate;
});
orbitMonitoring.findAll = jest.fn(() => {
  return mockOrbitMonitoringData;
});
orbitMonitoring.update = jest.fn();
orbitMonitoring.create = jest.fn(() => {
  return mockOrbitMonitoringData;
});

//sql mocks
sql.connect = jest.fn();
sql.query = jest.fn(() => {
  return mockSqlReturnData;
});

//route and models imported for testing
const orbit = require("../../routes/orbit/read");
app.use("/api/orbit", orbit);

describe("Integration Tests", () => {
  //globals needed for multiple tests
  const { application_id, badApplicationId, name } = mockData;
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
      const mockOrbitMonitoringDataBadApplicaitonId = mockOrbitMonitoringData;
      mockOrbitMonitoringDataBadApplicaitonId.application_id = badApplicationId;

      response = await request(app)
        .post(`/api/orbit/`)
        .send(mockOrbitMonitoringDataBadApplicaitonId)
        .set("Content-Type", "application/json")
        .set("Accept", "application/json");

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });
});
