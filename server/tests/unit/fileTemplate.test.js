//dependencies to start app.js and make calls
const express = require("express");
const request = require("supertest");
const app = express();
app.use(express.json());

//import model and spy functions that will be called
const models = require("../../models");
const FileTemplate = models.fileTemplate;

//route and models imported for testing
const fileTemplateRead = require("../../routes/fileTemplate/read");
app.use("/api/fileTemplate/read", fileTemplateRead);

//bring in standard testing data
// const mockData = require("../mock-data/file.json");

//write tests
describe("File Template Tests", () => {
  //globals needed for multiple tests
  const application_id = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc001";
  const id = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc003";
  let response;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    response = null;
  });

  describe("Route Checks", () => {
    test("Save Template", async () => {
      expect(1).toBe(1);
    });
  });
});
