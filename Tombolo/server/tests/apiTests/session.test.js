const request = require("supertest");
const { app } = require("../test_server");
const RefreshTokens = require("../../models").RefreshTokens;
const User = require("../../models").user;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const invalidUuId = "897acab7-f5c8-4435-9847-97de16adf66";

let user, session;

beforeAll(async () => {
  // Create a user for testing
  user = await User.create({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe456@example.com",
    hash: bcrypt.hashSync("Password123!", 10),
    registrationMethod: "traditional",
    verifiedUser: true,
    registrationStatus: "active",
  });

  // Generate a refresh token
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  // Create session token for testing
  session = await RefreshTokens.create({
    id: "4d3b5fb9-d3a4-4894-bc42-3f7e1c5c27d3",
    userId: user.id,
    token: refreshToken,
    deviceInfo: { os: "Windows", browser: "Chrome" },
    iat: new Date(),
    exp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
  });
});

describe("Session Controller", () => {
  it("should get all active sessions for a user", async () => {
    const res = await request(app).get(
      `/api/session/getActiveSessions/${user.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe(session.id);
  });

  it("should return 400 for invalid user ID", async () => {
    const res = await request(app).get( `/api/session/getActiveSessions/${invalidUuId}`);
    expect(res.status).toBe(400);
  });


  it("should destroy a single active session", async () => {
    const res = await request(app).delete(
      `/api/session/destroyActiveSession/${session.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("1 sessions destroyed");
  });



  it("should return 400 for invalid session ID", async () => {
    const res = await request(app).delete(
      `/api/session/destroyActiveSession/${invalidUuId}`
    );
    expect(res.status).toBe(400);
  });

  it("should destroy all active sessions for a user", async () => {
    // Create a second session for the same user
     await RefreshTokens.create({
      id: "4d3b5fb9-d3a4-4894-bc42-3f7e1c5c27d4",
      userId: user.id,
      token: jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
      }),
      deviceInfo: { os: "Mac", browser: "Safari" },
      iat: new Date(),
      exp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const res = await request(app).delete(
      `/api/session/destroyActivateSessions/all/${user.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

});
