//dependencies to start app.js and make calls
const express = require("express");
const request = require("supertest");
const app = express();
app.use(express.json());

//import model and spy functions that will be called
const models = require("../../models");
const apiKey = models.api_key;
apiKey.create = jest.fn(() => {
  return { apiKey: null };
});
apiKey.destroy = jest.fn();

//route and models imported for testing
const key = require("../../routes/key/read");
app.use("/api/key", key);

//bring in standard testing data
const mockData = require("../mock-data/key.json");

//write tests
describe("Keys Tests", () => {
  //globals needed for multiple tests
  const application_id = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc001";
  const id = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc001";
  let response;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    response = null;
  });

  describe("Route Checks", () => {
    test("Get All", async () => {
      response = await request(app).get(`/api/key/all/${application_id}`);
      expect(response.status).toBe(200);
    });

    test("Get All - Error Check", async () => {
      response = await request(app).get(`/api/key/all/badapplicationid`);
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("New Key", async () => {
      response = await request(app)
        .post(`/api/key/newKey/${application_id}`)
        .send(mockData);
      expect(apiKey.create).toBeCalled();
    });

    test("New Key - Bad Application ID", async () => {
      response = await request(app)
        .post(`/api/key/newKey/badapplicationid`)
        .send(mockData);
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    test("Delete Key", async () => {
      response = await request(app).delete(`/api/key/${id}`);
      expect(response.status).toBe(200);
    });

    test("Delete Key - Bad ID", async () => {
      response = await request(app).delete(`/api/key/badid`);
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });
});
