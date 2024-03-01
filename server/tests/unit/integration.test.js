const request = require("supertest");
const app = require("../../app"); // Assuming this is your main app file
const express = require("express");
const models = require("../../models");

jest.mock("../../models", () => ({
  Integration: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  IntegrationMapping: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

const { application_id, id } = mockData;

describe("Integration Routes", () => {
  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    response = null;
  });

  it("should return all integrations", async () => {
    const response = await request(app).get("/getAll");
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  it("should return all integration_mappings with application_id", async () => {
    const response = await request(app).get(`/getAll/${application_id}`);
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  it("should return one integration_mapping entry with application_id and integration_id", async () => {
    const response = await request(app).get(
      `/getOne/${application_id}/${integrationId}`
    );
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  it("should create an entry into integration_mapping table with application_id parameter", async () => {
    const data = {
      application_id: application_id,
      integration_id: integration_id,
      metaData: {},
    };
    const response = await request(app).post("/create").send(data);
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  it("should delete integration_mapping entry with application_id and integration_id parameter", async () => {
    const data = {
      application_id: application_id,
      integration_id: integration_id,
    };
    const response = await request(app).delete("/delete").send(data);
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  it("should update integration_mapping entry with application_id and integration_id parameter", async () => {
    const data = {
      application_id: application_id,
      integration_id: id,
      metaData: {},
    };
    const response = await request(app).put("/update").send(data);
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });
});
