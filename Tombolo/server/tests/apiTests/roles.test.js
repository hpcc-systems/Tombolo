const request = require("supertest");
const { app } = require("../test_server");

describe("Role Types", () => {
  it("should get all role types", async () => {
    const res = await request(app).get("/api/roles");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
