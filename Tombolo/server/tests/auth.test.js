const request = require("supertest");
const { app, db, startServer, closeServer } = require("./test_server");

// User payload
const payload = {
  registrationMethod: "traditional",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  password: "Password123!",
  deviceInfo: {
    os: "macOS",
    browser: "chrome",
  },
};

describe("Register and Login", () => {
  // Test end to end basic user registration
  it("Should register a new user on /api/auth/registerBasicUser", async () => {

    const response = await request(app)
      .post("/api/auth/registerBasicUser")
      .send(payload);

    // Check the response
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("User created successfully");
  });

  // Test end to end basic user login
  it("Should log in a user on /api/auth/loginBasicUser", async () => {

    const response = await request(app)
      .post("/api/auth/loginBasicUser")
      .send(payload);

    // Check the response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("User logged in successfully");
    expect(response.body.data.token).toBeDefined();
  });
});
