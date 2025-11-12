import { Job } from "sidequest";
import db from "@tombolo/db";

const { Application } = db;

export class DbJob extends Job {
  async run(to: string, subject: string, body: string) {
    const applications = await Application.findAll();
    console.log("Applications: ", applications[0]?.toJSON());
    // Your email sending logic here
    return { applications: applications, timestamp: new Date() };
  }
}
