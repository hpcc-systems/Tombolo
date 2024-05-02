const moment = require('moment');

function calculateExpectedRunCompletionTime(runWindow, expectedRunCompletionTime) {
    const currentTime = moment();
    let completionDateTime;

    switch (runWindow) {
        case 'daily':
            completionDateTime = currentTime.clone().utc().format('YYYY-MM-DD') + ' ' + expectedRunCompletionTime;
            break;
        case 'every2Days':
            completionDateTime = currentTime.clone().subtract(1, 'days').utc().format('YYYY-MM-DD') + ' ' + expectedRunCompletionTime;
            break;
        case 'overnight':
            completionDateTime = currentTime.hour() < 12 ? currentTime.clone().subtract(1, 'days').hour(12).utc().format('YYYY-MM-DD') : currentTime.hour(12).utc().format('YYYY-MM-DD');
            completionDateTime += ' ' + expectedRunCompletionTime;
            break;
        case 'morning':
            completionDateTime = currentTime.clone().startOf('day').utc().format('YYYY-MM-DD') + ' ' + expectedRunCompletionTime;
            break;
        case 'afternoon':
            completionDateTime = currentTime.clone().hour(12).utc().format('YYYY-MM-DD') + ' ' + expectedRunCompletionTime;
            break;
        default:
            throw new Error(`Unknown run window: ${runWindow}`);
    }
    return completionDateTime;
}

function calculateExpectedRunCompletionTimes(schedule, expectedRunCompletionTime) {
    return schedule.map(job => {
        const expectedRunCompletionDateAndTime = calculateExpectedRunCompletionTime(job.runWindow, expectedRunCompletionTime);
        return {
            ...job,
            expectedRunCompletionDateAndTime
        };
    });
}





// Example usage
const data = {
  schedule: [
    {
      id: "ec077985-0ebf-4039-b331-aa3b2a100812",
      frequency: "daily",
      runWindow: "overnight",
    },
  ],
  asrSpecificMetaData: {
    domain: "64b34ec3-a1ad-43a9-8d25-3ce0e8329e4c",
    severity: 1,
    productCategory: "a625b999-43f6-44f3-95e7-8eebee99da33",
    requireComplete: true,
  },
  notificationMetaData: {
    teamsHooks: ["087a1400-4e7e-4b52-abd9-7a01303c08f9"],
    primaryContacts: ["yadhap.dahal@yahoo.com"],
    notificationCondition: ["Failed", "Aborted", "Unknown", "NotStarted"],
  },
  expectedRunCompletionTime: "02:03",
};

// Usage:
const schedule = data.schedule;
const expectedRunCompletionTime = "12:44";
const result = calculateExpectedRunCompletionTimes(schedule, expectedRunCompletionTime);
console.log(result);
