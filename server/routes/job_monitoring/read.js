const router = express.Router();

// Modal
const jobMonitoring = {
  id: "",
  name: "",
  cron: "",
  isActive: "",
  cluster_id: "",
  application_id: "",
  metaData: {
    last_monitored: "",
    notifications: [
      { channel: "email", recipients: ["test@gmail.com", "test2@gmail.com"] },
      { channel: "msTeams", recipients: ["www.teams.com", "www.teams2.com"] },
    ],
  },
};

// Route to create job monitoring
// Route to delete job monitoring
// Route to update job monitoring
// Route to pause and start job monitoring

// Bree
// Job Schedular
    // Create and start bree job [ ]
// Job Schedular actual code
    // Looks for all jobs in particular state
    // Notify via email and ms teams


// For test
// add a job with random name and cron to the schedular
// make schedular start on server load
// hard code cluster, job state on job monitoring
// when monitoring runs using js comms make a call and get jobs that are in specified state
// Check if you can get jobs based on parameter

