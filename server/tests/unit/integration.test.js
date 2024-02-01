//dependencies to start app.js and make calls
const express = require("express");
const request = require("supertest");
const app = express();
app.use(express.json());

//import model and spy functions that will be called
const models = require("../../models");
const integrations = models.integrations;
integrations.findOne = jest.fn(() => {
  return mockIntegrationData;
});
integrations.findAll = jest.fn();
integrations.update = jest.fn();

//bring in standard testing data
const mockData = require("../mock-data/global.json");
const mockIntegrationData = require("../mock-data/integration.json");

//route and models imported for testing
const integration = require("../../routes/integrations/read");
app.use("/api/integration", integration);

//write tests
describe("Integration Tests", () => {
  //globals needed for multiple tests
  const { application_id, badApplicationId, name } = mockData;
  let response;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    response = null;
  });

  describe("Route Checks", () => {
    test("Get all", async () => {
      response = await request(app).get(
        `/api/integration/get/${application_id}`
      );
      expect(integrations.findAll).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("Get all - Bad App ID", async () => {
      response = await request(app).get(
        `/api/integration/get/${badApplicationId}`
      );
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("toggle active", async () => {
      response = await request(app).put(
        `/api/integration/toggle/${application_id}/${name}`
      );
      expect(response.status).toBe(200);
      expect(integrations.findOne).toHaveBeenCalledTimes(1);
      expect(integrations.update).toHaveBeenCalledTimes(1);
    });

    test("toggle active - Bad App ID", async () => {
      response = await request(app).put(
        `/api/integration/toggle/${badApplicationId}/${name}`
      );
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("update ", async () => {
      response = await request(app).put(
        `/api/integration/update/${application_id}/${name}`
      );
      expect(integrations.findOne).toHaveBeenCalledTimes(1);
      expect(integrations.update).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test("update - Bad App ID", async () => {
      response = await request(app).put(
        `/api/integration/update/${badApplicationId}/${name}`
      );
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });
});
