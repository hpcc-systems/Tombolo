const request = require("supertest");
const { app, db, startServer, closeServer } = require("./test_server");
const User = require("../models").user;
const bcrypt = require("bcryptjs");

const nonExistentID = "897acab7-f5c8-4435-9847-97de16adf663";

beforeAll(async () => {
  // Add initial users to the test database
  const users = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe121@example.com",
      hash: bcrypt.hashSync("Password123!", 10),
      registrationMethod: "traditional",
      verifiedUser: true,
      registrationStatus: "active",
    },
    {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe122@example.com",
      hash: bcrypt.hashSync("Password123!", 10),
      registrationMethod: "traditional",
      verifiedUser: true,
      registrationStatus: "active",
    },
  ];

  await User.bulkCreate(users);
});


describe("User Controller", () => {
  it("should get all users", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should get a user by ID", async () => {
    const user = await User.findOne({
      where: { email: "john.doe121@example.com" },
    });
    const res = await request(app).get(`/api/users/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("john.doe121@example.com");
  });

  it("should return 404 if user not found", async () => {
    // Generate random UUID
    const res = await request(app).get(`/api/users/api/user/${nonExistentID}`);
    expect(res.status).toBe(404);
  });

  it("should update user info", async () => {
    const user = await User.findOne({
      where: { email: "john.doe121@example.com" },
    });
    const res = await request(app)
      .patch(`/api/users/${user.id}`)
      .send({ firstName: "Johnny" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.firstName).toBe("Johnny");
  });

  it("should return 404 if user to update not found", async () => {
    const res = await request(app)
      .patch(`/api/users/${nonExistentID}`)
      .send({ firstName: "Johnny" });
    expect(res.status).toBe(404);
  });

  it("should delete a user by ID", async () => {
    const user = await User.findOne({
      where: { email: "john.doe121@example.com" },
    });
    const res = await request(app).delete(`/api/users/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User deleted successfully");
  });

  it("should return 404 if user to delete not found", async () => {
    const res = await request(app).delete(`/api/users/${nonExistentID}`);
    expect(res.status).toBe(404);
  });

  it("should change user password", async () => {
    const user = await User.findOne({
      where: { email: "jane.doe122@example.com" },
    });
    const res = await request(app)
      .patch(`/api/users/change-password/${user.id}`)
      .send({
        currentPassword: "Password123!",
        newPassword: "NewPassword123!",
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Password updated successfully");
  });

  it("should return 400 if current password is incorrect", async () => {
    const user = await User.findOne({
      where: { email: "jane.doe122@example.com" },
    });
    const res = await request(app)
      .patch(`/api/users/change-password/${user.id}`)
      .send({
        currentPassword: "WrongPassword",
        newPassword: "NewPassword123!",
      });
    expect(res.status).toBe(400);
  });

  it("should bulk update users", async () => {
    const users = await User.findAll();
    const updates = users.map((user) => ({
      id: user.id,
      firstName: `Updated${user.firstName}`,
    }));
    const res = await request(app)
      .patch("/api/users/bulk-update")
      .send({ users: updates });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Users updated successfully");
  });

  it("should bulk delete users", async () => {
    const users = await User.findAll();
    const ids = users.map((user) => user.id);
    const res = await request(app)
      .delete("/api/users/bulk-delete")
      .send({ ids });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("Users deleted successfully");
  });
});
