const express = require("express");
const request = require("supertest");
const app = express();
app.use(express.json());
const integrationAPI = require("../../routes/integrations/read");
app.use("/api/integrations", integrationAPI);

//import model and spy functions that will be called
const models = require("../../models");
const integrations = models.integrations;
const integration_mapping = models.integration_mapping;

//mock all of the sequelize functions from integration model
integrations.findOne = jest.fn();
integrations.findAll = jest.fn();
integrations.create = jest.fn();
integrations.update = jest.fn();
integrations.destroy = jest.fn();

//mock all of the sequelize functions from integration_mappings model
integration_mapping.findOne = jest.fn();
integration_mapping.findAll = jest.fn();
integration_mapping.create = jest.fn();
integration_mapping.update = jest.fn();
integration_mapping.destroy = jest.fn();

const mockData = require("../mock-data/global.json");
const { token } = require("morgan");
const { application_id, id, metaData } = mockData;

describe("integration Routes", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  //test getAll
  it("should return all integrations", async () => {
    // Mock the response from the integration model
    const res = await request(app).get("/api/integrations/getAll");
    expect(res.statusCode).toEqual(200);
  });

  it("should return all integration_mappings with application_id", async () => {
    const res = await request(app).get(
      `/api/integrations/getAll/${application_id}`
    );
    expect(res.statusCode).toEqual(200);
    expect(integration_mapping.findAll).toBeCalled();
  });

  it("should return one integration_mapping entry with application_id and integration_id", async () => {
    const res = await request(app).get(
      `/api/integrations/getOne/${application_id}/${id}`
    );
    expect(res.statusCode).toEqual(200);
    expect(integration_mapping.findOne).toBeCalled();
  });

  it("should create an entry into integration_mapping table with application_id", async () => {
    const data = {
      application_id: application_id,
      integration_id: id,
      metaData: metaData,
    };
    const res = await request(app).post("/api/integrations/create").send(data);
    expect(res.statusCode).toEqual(200);
    expect(integration_mapping.create).toBeCalled();
  });

  it("should delete integration_mapping entry with application_id and integration_id", async () => {
    const data = {
      application_id: application_id,
      integration_id: id,
    };
    const res = await request(app)
      .delete("/api/integrations/delete")
      .send(data);
    expect(res.statusCode).toEqual(200);
    expect(integration_mapping.destroy).toBeCalled();
  });

  it("should update integration_mapping entry with application_id and integration_id", async () => {
    const data = {
      application_id: application_id,
      integration_id: id,
      metaData: metaData,
    };
    const res = await request(app).put("/api/integrations/update").send(data);
    expect(res.statusCode).toEqual(200);
    expect(integration_mapping.update).toBeCalled();
  });

  //test error messages for these routes when bad data is sent
  it("should return error message for bad application_id", async () => {
    const res = await request(app).get(
      "/api/integrations/getAll/badapplicationid"
    );
    expect(res.statusCode).toEqual(422);
  });

  it("should return error message for bad application_id and integration_id", async () => {
    const res = await request(app).get(
      "/api/integrations/getOne/badapplicationid/badintegrationid"
    );
    expect(res.statusCode).toEqual(422);
  });

  it("should return error message for bad application_id and integration_id", async () => {
    const data = {
      application_id: "badapplicationid",
      integration_id: "badintegrationid",
    };
    const res = await request(app)
      .delete("/api/integrations/delete")
      .send(data);
    expect(res.statusCode).toEqual(422);
  });

  it("should return error message for bad application_id and integration_id", async () => {
    const data = {
      application_id: "badapplicationid",
      integration_id: "badintegrationid",
      metaData: metaData,
    };
    const res = await request(app).put("/api/integrations/update").send(data);
    expect(res.statusCode).toEqual(422);
  });
});
