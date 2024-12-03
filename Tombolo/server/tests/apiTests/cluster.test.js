const request = require("supertest");
const { app } = require("../test_server");
const Cluster  = require("../../models").cluster;

describe("Cluster Routes", () => {
  let clusterId;

  beforeAll(async () => {
    // Create a cluster to use in tests
    const newCluster = await Cluster.create({
      name: "Test",
      thor_host: "http://localhost",
      thor_port: "18010",
      roxie_host: "http://localhost",
      roxie_port: "18010",
      defaultEngine: "hthor",
      timezone_offset: -240,
      adminEmails: ["john.doe@test.com"],
      createdBy: {
        name: "John Doe",
        email: "john.doe@test.com",
      },
      metaData: {},
    });
    clusterId = newCluster.id;
  });

  it("should get all clusters", async () => {
    const res = await request(app).get("/api/cluster");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should get a cluster by ID", async () => {
    const res = await request(app).get(`/api/cluster/${clusterId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(clusterId);
  });

  it("Should not crate cluster if not in whitelist", async () => {
    const res = await request(app)
      .post("/api/clusters")
      .send({
        name: "Not whitelisted Cluster",
        thor_host: "http://localhost",
        thor_port: "18010",
        roxie_host: "http://localhost",
        roxie_port: "18010",
        defaultEngine: "hthor",
        timezone_offset: -240,
        createdBy: { name: "John Doe", email: "john.doe@test.com" },
        metaData: {},
      });
    expect(res.status).toBe(404);
  });

  it("should update a cluster by ID", async () => {
    const res = await request(app)
      .patch(`/api/cluster/${clusterId}`)
      .send({
        username: "UpdatedUsername",
        updatedBy: { name: "Admin", email: "admin@example.com" },
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe("UpdatedUsername");
  });

  it("should get the cluster whitelist", async () => {
    const res = await request(app).get("/api/cluster/whiteList");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should delete a cluster by ID", async () => {
    const res = await request(app).delete(`/api/cluster/${clusterId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
