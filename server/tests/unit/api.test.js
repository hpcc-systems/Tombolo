//dependencies to start app.js and make calls
const express = require("express");
const request = require("supertest");
const app = express();
app.use(express.json());

//import model and spy functions that will be called
const models = require("../../models");
const apiKey = models.api_key;
apiKey.findOne = jest.fn();
apiKey.update = jest.fn();

// //bring in standard testing data
// const mockData = require("../mock-data/api.json");
// //this example shows how to return example data
// apiKey.findOne = jest.fn(() => {
//     return mockData
// })

//route and models imported for testing
const api = require("../../routes/api/read");
app.use("/api/apikeys", api);

//write tests
describe("API Tests", () => {
  //globals needed for multiple tests
  const application_id = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc001";
  const key = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc001";
  const name = "test";
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
