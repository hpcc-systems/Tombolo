import { Job } from 'sidequest';
import db from '@tombolo/db';
import logger from '../config/logger.js';
const { Application } = db;

export class DbJob extends Job {
  async run() {
    const applications = await Application.findAll();
    logger.debug('Applications: ', applications[0]?.toJSON());
    // Your email sending logic here
    return { applications: applications, timestamp: new Date() };
  }
}
