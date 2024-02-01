//dependencies to start app.js
const express = require("express");
const request = require("supertest");

//need express to mock calls
const app = express();

// create Database for Mocking
// const { sequelize: dbConnection } = require("../../models");

//routes imported for testing
const notifications = require("../../routes/notifications/read");

// necessary to parse request body as JSON
app.use(express.json());
app.use("/api/notifications/read", notifications);

describe("Notifications Tests", () => {
  const application_id = "11bf5b37-e0b8-42e0-8dcf-dc8c4aefc001";
  let response;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    response = null;
  });

  describe("Notifications Endpoint Check", () => {
    test("Get all", async () => {
      response = await request(app).get(
        `/api/notifications/read/${application_id}`
      );

      expect(response.status).toBe(200);
    });

    // test("Get all - Bad Application ID", async () => {
    //   response = await request(app).get(
    //     `/api/notifications/read/badapplicationid`
    //   );
    //   expect(response.status).toBe(422);
    //   expect(response.body.success).toBe(false);
    // });

    test("Get CSV File", async () => {
      response = await request(app).get(
        `/api/notifications/read/${application_id}/file/CSV`
      );

      expect(response.status).toBe(200);
      expect(response.text).toBe(
        "id,monitoringId,Channel,Reason,Status,Created,Deleted"
      );
      expect(response.headers["content-disposition"]).toBe(
        'attachment; filename="Tombolo-Notifications.CSV"'
      );
    });

    test("Get JSON File", async () => {
      response = await request(app).get(
        `/api/notifications/read/${application_id}/file/JSON`
      );

      expect(response.status).toBe(200);
      expect(response.text).toBe("[]");
      expect(response.headers["content-disposition"]).toBe(
        'attachment; filename="Tombolo-Notifications.JSON"'
      );
    });

    test("Get File - Bad Type", async () => {
      response = await request(app).get(
        `/api/notifications/read/${application_id}/file/XML`
      );
      expect(response.status).toBe(500);
    });
  });
});
