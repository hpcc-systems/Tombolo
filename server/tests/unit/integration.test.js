//dependencies to start app.js and make calls
const express = require("express");
const request = require("supertest");
const app = express();
app.use(express.json());

//import model and spy functions that will be called
const models = require("../../models");
const integrations = models.integrations;
integrations.findOne = jest.fn();
integrations.update = jest.fn();

//bring in standard testing data
const mockData = require("../mock-data/global.json");

//route and models imported for testing
const integration = require("../../routes/integration/read");
app.use("/api/integration", integration);

//write tests
describe("Integration Tests", () => {
  //globals needed for multiple tests
  const { application_id } = mockData;
  let response;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    response = null;
  });

  describe("Route Checks", () => {
    test("Get all", async () => {
      response = await request(app).get(
        `/api/apikeys/${application_id}/${name}/${key}/notifications`
      );
      expect(apiKey.findOne).toBeCalled();
    });

    test("Get All - parameter errors AppID", async () => {
      response = await request(app).get(
        `/api/apikeys/badApplicationID/${name}/${key}/notifications`
      );
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("Get All - parameter errors Key", async () => {
      response = await request(app).get(
        `/api/apikeys/${application_id}/${name}/badkey/notifications`
      );
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });
});
