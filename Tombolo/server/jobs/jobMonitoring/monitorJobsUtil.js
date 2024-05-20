// Local imports
const models = require("../../models");
const asrProducts = models.asr_products;
const asrDomains = models.asr_domains;

//Package(s)
const moment = require("moment");
const cronParser = require("cron-parser");
const { initial } = require("lodash");

// All possible intermediate states
const intermediateStates = [
  "unknown",
  "compiling",
  "compiled",
  "running",
  "aborting",
  "blocked",
  "submitted",
  "wait",
  "scheduled",
  "uploading_files",
  "debug_paused",
  "debug_running",
  "paused",
];

// Convert date to string in the format YYYYMMDD
const replaceDatePlaceholders = (formatWithWildcards) => {
  return formatWithWildcards.replace(/<DATE(,[^>]+)?>/g, (_, dateOptions) => {
    if (!dateOptions) {
      // No options, just replace with current date in YYYYMMDD format
      return moment().format("YYYYMMDD");
    }

    const [adjustment, dateFormat] = dateOptions.slice(1).split(",");

    // Adjust date as necessary
    let date = moment();
    if (adjustment) {
      const adjustmentNumber = Number(adjustment);
      if (!isNaN(adjustmentNumber)) {
        date = date.add(adjustmentNumber, "days");
      }
    }

    // Format date
    if (dateFormat) {
      const momentFormat = dateFormat
        .replace(/%Y/g, "YYYY")
        .replace(/%m/g, "MM")
        .replace(/%d/g, "DD")
        .replace(/%t/g, " ")
        .replace(/%y/g, "YY")
        .replace(/%B/g, "MMMM")
        .replace(/%b/g, "MMM")
        .replace(/%h/g, "MMM")
        .replace(/%e/g, "D")
        .replace(/%j/g, "DDDD");
      return date.format(momentFormat);
    } else {
      return date.format("YYYYMMDD");
    }
  });
};

// Match job name with job name format
const matchJobName = (jobNameFormat, jobName) => {
  // Replace wildcard with regex equivalent
  const formatWithWildcards = jobNameFormat.replace(/\*/g, ".*");

  // Handle date replacements
  const formatWithDates = replaceDatePlaceholders(formatWithWildcards);

  // Create regex and test against jobName
  const regex = new RegExp(`^${formatWithDates}$`);
  return regex.test(jobName);
};

// const ans = matchJobName( "Launch <DATE> Current ","Launch 20240515 Current ");
// const ans1 = matchJobName( "Launch <DATE,1,%Y_%m_%d> test ","Launch 2024_03_24 test ");
// const ans2 = matchJobName("Launch *", "Launch 20240323 test spray");
// const ans3 = matchJobName("* Launch *", "X Launch 20240323 test spray");
// const ans4 = matchJobName("* <DATE,1,%Y%d> *", "Launch 202423 test spray");
// const ans5 = matchJobName("Launch <DATE,1,%y%B> Current Carrier", "Launch 24March Current Carrier");
const ans6 = matchJobName("covid cases <DATE>", "covid cases 20240515");

// console.log("0 -", ans);
// console.log("1 -", ans1);
// console.log("2 -", ans2);
// console.log("3 -", ans3);
// console.log("4 -", ans4);
// console.log('5 -', ans5);
console.log('6 -', ans6)


// Find start and end time of a work unit since js communication library does not give that
function findStartAndEndTimes(data) {
    let minDate = Infinity;
    let maxDate = -Infinity;

    data.forEach(item => {
        const date = new Date(item.When).getTime();
        if (date < minDate) {
            minDate = date;
        }
        if (date > maxDate) {
            maxDate = date;
        }
    });
    
    const timeTaken = maxDate - minDate;

    return {
      startTime: new Date(minDate).toISOString(),
      endTime: new Date(maxDate).toISOString(),
      timeTaken: timeTaken,
    };
}

// Takes last scan time , which is recorded in UTC and adjusts to the local time of the cluster
function wuStartTimeWhenLastScanAvailable(scanTime, offSet) {
    const originalTimeStamp = new Date(scanTime).getTime();
    let adjustedTimeStamp = originalTimeStamp + offSet * 60 * 1000;
    adjustedTimeStamp = new Date(adjustedTimeStamp);
    return adjustedTimeStamp;
}

// Takes current UTC time, adjust to local and back date to x minutes
function wuStartTimeWhenLastScanUnavailable(currentTime, offSet, backDateMinutes) {
    const originalTimeStamp = new Date(currentTime).getTime();
    let adjustedTimeStamp = originalTimeStamp + offSet * 60 * 1000;
    adjustedTimeStamp = new Date(adjustedTimeStamp - backDateMinutes * 60 * 1000);
    return adjustedTimeStamp;
}

// Assume the system running below code is in UTC. Given timezone offset in minutes, calculate date and time. 
function findLocalDateTimeAtCluster(timeZoneOffset) {
    const newDate = new Date();
    const localTime = new Date(newDate.getTime() + (timeZoneOffset * 60 * 1000));
    return localTime;
}

// set time to a date
function setTimeToDate(date, time) {
  const newDate = new Date(date.getTime());
  const [hours, minutes] = time.split(":");
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

//Calculate start and end time given local time at cluster , run window, expected start and completion time
function calculateStartAndEndDateTime({localDateTimeAtCluster, runWindow, expectedStartTime, expectedCompletionTime}) {
  let startAndEnd;
  if (runWindow === "overnight") {
    startAndEnd = {
      start: setTimeToDate(previousDay, expectedStartTime || "12:00"),
      end: setTimeToDate(localDateTimeAtCluster, expectedCompletionTime || "12:00"),
    };
  } else if (runWindow === "morning") {
    startAndEnd = {
      start: setTimeToDate( localDateTimeAtCluster, expectedStartTime || "00:00"),
      end: setTimeToDate(localDateTimeAtCluster,expectedCompletionTime || "11:59"),
  };
  } else if (runWindow === "afternoon") {
    startAndEnd = {
      start: setTimeToDate(localDateTimeAtCluster,expectedStartTime || "12:00"),
      end: setTimeToDate(localDateTimeAtCluster, expectedCompletionTime || "23:59"),
  };
  }else if(runWindow === "daily"){
    startAndEnd = {
      start: setTimeToDate(localDateTimeAtCluster, expectedStartTime || "00:00"),
      end: setTimeToDate(localDateTimeAtCluster,expectedCompletionTime || "23:59"),
  };
  }
  else {
    startAndEnd = {
      start: setTimeToDate(localDateTimeAtCluster, expectedStartTime || "00:00" ),
      end: setTimeToDate(localDateTimeAtCluster,expectedCompletionTime || "23:59"),
    };
  }
  return startAndEnd;
}

// Daily jobs
function calculateRunOrCompleteByTimeForDailyJobs({schedule, expectedStartTime, expectedCompletionTime, timezone_offset}) {
  const {runWindow} = schedule;

  const localDateTimeAtCluster = findLocalDateTimeAtCluster(timezone_offset);

 let window = {frequency: "daily", currentTime: localDateTimeAtCluster};

  const startAndEnd = calculateStartAndEndDateTime({
    localDateTimeAtCluster,
    runWindow,
    expectedStartTime,
    expectedCompletionTime,
  });
  return {...window, ...startAndEnd};
}

// Weekly jobs
function calculateRunOrCompleteByTimeForWeeklyJobs({schedule, expectedStartTime, expectedCompletionTime, timezone_offset}) {
  const  {days, runWindow } = schedule;

  // Find current day at the cluster given timezone offset and this system  in utc
  const localDateTimeAtCluster = findLocalDateTimeAtCluster(timezone_offset);
  const day = localDateTimeAtCluster.getDay();
  const runDay = days.find(d => d === day.toString());

  let window = null;
  if(!runDay) {
    return window;
  }
  window= {frequency: "weekly", currentTime: localDateTimeAtCluster};

  const startAndEnd = calculateStartAndEndDateTime({
    localDateTimeAtCluster,
    runWindow,
    expectedStartTime,
    expectedCompletionTime,
  });

  return {...window, ...startAndEnd};
}

// Monthly jobs
function calculateRunOrCompleteByTimeForMonthlyJobs({schedule, expectedStartTime, expectedCompletionTime, timezone_offset}) {
  // Determine if schedule is by date or week and weekday
  const { scheduleBy } = schedule[0];
  const localDateTimeAtCluster = findLocalDateTimeAtCluster(timezone_offset);

  let window = {
    currentTime: localDateTimeAtCluster,
    frequency: "monthly",
  };

  if (scheduleBy === "dates") {
    const { dates, runWindow } = schedule[0]; // by date has only one element in an array
    const dateAtCluster = localDateTimeAtCluster.getDate();

    // check if date in schedule matches the current date at the cluster
    const runDate = dates.find((d) => d === dateAtCluster);

    // If no to above, return null
    if (!runDate) {
      return null;
    }

    // Add schedule by to the window object
    window.scheduleBy = "dates";

    // Calculate start and end time
    const startAndEnd = calculateStartAndEndDateTime({
      localDateTimeAtCluster,
      runWindow,
      expectedStartTime,
      expectedCompletionTime,
    });

    // return object with start and end time etc
    return { ...window, ...startAndEnd };
  }

  if(scheduleBy === "weeks-day"){
    const dayAtCluster = localDateTimeAtCluster.getDay();
    const day = schedule.find(s => s.day === dayAtCluster.toString());

    // no matching day
    if (!day) {
      return null;
    }

    // week of month
    let momentDate = moment(localDateTimeAtCluster); 

    let thisWeek =momentDate.week() - moment(momentDate).startOf("month").week() + 1;
    console.log("Week of month ---", thisWeek);

    // All weeks for matching day
    let  weeks = [];
    schedule.forEach(s => {
      weeks = [...weeks, ...s.weeks];
    });

    // if current week is not in the list of weeks
    if(!weeks.includes(thisWeek)) {
      return null
    }

    // Add schedule by to the window object
    window.scheduleBy = "weeks-day";

    // Calculate start and end time
    const startAndEnd = calculateStartAndEndDateTime({
      localDateTimeAtCluster,
      runWindow: day.runWindow,
      expectedStartTime,
      expectedCompletionTime,
    });

    // return object with start and end time etc
    console.log('----- Monthly - week - day  ---------------');
    console.log({ ...window, ...startAndEnd });
    console.log('------------------------------------------');
    return { ...window, ...startAndEnd };
  }
}

// Yearly jobs
function calculateRunOrCompleteByTimeForYearlyJobs({schedule, expectedStartTime, expectedCompletionTime, timezone_offset}) {
  const {scheduleBy} = schedule[0];

  // Local date time at cluster
  const localDateTimeAtCluster = findLocalDateTimeAtCluster(timezone_offset);
  // Current month at the cluster
  const monthAtCluster = localDateTimeAtCluster.getMonth();
  const months = schedule.map((s) => s.month);

  // Not scheduled to run in the current month - so return null
  if (!months.includes(monthAtCluster.toString())) {
    return null;
  }

  // basic window object
  let window = {
    frequency: "yearly",
    currentTime: localDateTimeAtCluster,
  };

  if(scheduleBy === "month-date"){
    // current date at the cluster
    const dateAtCluster = localDateTimeAtCluster.getDate();
    const dates = [];
    schedule.forEach(s => {
      dates.push(s.date);
    });
    
    // Not scheduled to run on the current date
    if(!dates.includes(dateAtCluster)){
      return null;
    }

    // Add schedule by to the window object
    window.scheduleBy = "month-date";

    // Calculate start and end time
    const startAndEnd = calculateStartAndEndDateTime({
      localDateTimeAtCluster,
      runWindow: schedule[0].runWindow,
      expectedStartTime,
      expectedCompletionTime,
    });

    // return object with start and end time etc
    return {
      ...window,
      ...startAndEnd,
    };
    }  
  
  if(scheduleBy === "week-day-month"){
    const dayAtCluster = localDateTimeAtCluster.getDay();

    // Days 
    const days = schedule.map(s => s.day);
    const day = dayAtCluster.toString();
    const scheduleDayMatch = days.includes(day);

    // if today in not in list of days
    if (!scheduleDayMatch) {
      return null;
    }

    // week of month
    let momentDate = moment(localDateTimeAtCluster); 
    let thisWeek =momentDate.week() - moment(momentDate).startOf("month").week() + 1;
    const weeks = schedule.map(s => s.week);
    const scheduleWeekMatch = weeks.includes(thisWeek);

    // if current week is not in the list of weeks
    if (!scheduleWeekMatch) {
      return null;
    }

    // Add schedule by to the window object
    window.scheduleBy = "week-day-month";

    // Calculate start and end time
    const startAndEnd = calculateStartAndEndDateTime({
      localDateTimeAtCluster,
      runWindow: day.runWindow,
      expectedStartTime,
      expectedCompletionTime,
    });

    // return object with start and end time etc
    return { ...window, ...startAndEnd };
  }
};

// Cron jobs
function calculateRunOrCompleteByTimeForCronJobs({
  schedule,
  expectedStartTime,
  expectedCompletionTime,
  timezone_offset,
}) {
  const cron = schedule[0].cron;

  // Local date time at cluster
  const localDateTimeAtCluster = findLocalDateTimeAtCluster(timezone_offset);

  // Get the previous and next dates the cron job was supposed to run
  const interval = cronParser.parseExpression(cron, {
    currentDate: localDateTimeAtCluster,
  });

  // Prev and next dates
  const prevDate = interval.prev().toDate();
  const nextDate = interval.next().toDate();

  // Calculate start and end time
  const prevStartDateTime = setTimeToDate(prevDate, expectedStartTime);
  const prevEndDateTime = setTimeToDate(prevDate, expectedCompletionTime);

  const nextStartDateTime = setTimeToDate(nextDate, expectedStartTime);
  const nextEndDateTime = setTimeToDate(nextDate, expectedCompletionTime);

  // Check if startAnd end time falls within prevStartDateTime and prevEndDateTime or nextStartDateTime and nextEndDateTime

  let withInWindow = false;

  if(prevStartDateTime <= localDateTimeAtCluster && localDateTimeAtCluster <= prevEndDateTime) {
    withInWindow = true;
  }
  if(nextStartDateTime <= localDateTimeAtCluster && localDateTimeAtCluster <= nextEndDateTime) {
    withInWindow = true;
  }

  if(!withInWindow) {
    return null;
  }
  return {
    frequency: "cron",
    start: setTimeToDate(localDateTimeAtCluster, expectedStartTime),
    end: setTimeToDate(localDateTimeAtCluster, expectedCompletionTime),
    currentTime: localDateTimeAtCluster,
  };

}

// check if current time is before, within or after the run window
function checkIfCurrentTimeIsWithinRunWindow({start, end, currentTime}) {
  if (currentTime > start && currentTime < end) {
    return "within";
  } else if (currentTime < start) {
    return "before";
  } else {
    return "after";
  }
}

// Calculate run and complete by time for a job on cluster's local time
function calculateRunOrCompleteByTimes({schedule, timezone_offset, expectedStartTime, expectedCompletionTime}) {
  // determine frequency
  frequency = schedule[0].frequency;

  switch (frequency) {
    case "daily":
      return calculateRunOrCompleteByTimeForDailyJobs({schedule: schedule[0],expectedStartTime, expectedCompletionTime, timezone_offset});
    case "weekly":
      return calculateRunOrCompleteByTimeForWeeklyJobs({schedule: schedule[0], expectedStartTime, expectedCompletionTime, timezone_offset});
    case "monthly":
      return calculateRunOrCompleteByTimeForMonthlyJobs({schedule, expectedStartTime, expectedCompletionTime, timezone_offset});
    case "yearly":
      return calculateRunOrCompleteByTimeForYearlyJobs({schedule, expectedStartTime, expectedCompletionTime, timezone_offset});
    case "cron":
      return calculateRunOrCompleteByTimeForCronJobs({schedule, expectedStartTime, expectedCompletionTime, timezone_offset});
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
}

// Function to get productCategory when productCategoryId is provided
async function getProductCategory(productCategoryId) {
  const product = await asrProducts.findOne({
    where: { id: productCategoryId },
  });
  return product;
}

//Function  to get domain when domain ID is provided
async function getDomain(domainId) {
  const domain = await asrDomains.findOne({
    where: { id: domainId },
  });
  return domain;
}

// Determine what template to use based on the monitoring metaData
async function determineNotificationTemplateAndNotificationPrefix(metaData) {
  const { asrSpecificMetaData = {}} = metaData;
  const asr = Object.keys(asrSpecificMetaData).length > 0;
  if (asr) {
    const {shortCode} = await getProductCategory(asrSpecificMetaData.productCategory);
    return {
      templateName: "jobMonitoring_asr",
      prefix: shortCode || "JM",
    }; 
  }else{
    return {
      templateName: "jobMonitoring",
      prefix: "JM",
    };
  }
}

// Generate a human readable notification ID in the format of <TEXT>_YYYYMMDD_HHMMSS_MS
const generateNotificationId = ({notificationPrefix, timezoneOffset}) => {
  // Get current date and time in UTC
  let now = new Date();

  // Adjust for the timezone offset
  now.setMinutes(now.getMinutes() + timezoneOffset);

  // Get date components
  let year = now.getUTCFullYear();
  let month = String(now.getUTCMonth() + 1).padStart(2, "0"); // Months are 0-based
  let day = String(now.getUTCDate()).padStart(2, "0");

  // Get time components
  let hours = String(now.getUTCHours()).padStart(2, "0");
  let minutes = String(now.getUTCMinutes()).padStart(2, "0");
  let seconds = String(now.getUTCSeconds()).padStart(2, "0");
  let milliseconds = String(now.getUTCMilliseconds()).padStart(3, "0"); // Milliseconds can be 3 digits

  // Construct the unique ID
  let uniqueId = `${notificationPrefix}_${year}${month}${day}_${hours}${minutes}${seconds}_${milliseconds}`;

  return uniqueId;
};

// Generate notification payload
async function createNotificationPayload({
  wu,
  cluster,
  type,
}) {

  let templateName = "jobMonitoring";
  let prefix = "JM";

  const asrRelatedNotificationPayload = {};

  if(type === "msTeams"){
    console.log("Teams ----- does it have asr stuff ", wu.asrSpecificMetaData)
  }

  if (wu.asrSpecificMetaData) {
    const { name, shortCode } = await getProductCategory(
      wu.asrSpecificMetaData.productCategory
    );

    templateName = "jobMonitoring_asr";
    prefix = shortCode;
    asrRelatedNotificationPayload.product = name;
    
    const domain = await getDomain(wu.asrSpecificMetaData.domain);
    asrRelatedNotificationPayload.businessUnit = domain.name;

    asrRelatedNotificationPayload.severity = wu.asrSpecificMetaData.severity;
    asrRelatedNotificationPayload.region = "USA" // TODO - this should come from somewhere not hard coded

    asrRelatedNotificationPayload.remedy = {
      instruction: 'Please contact one of the following to facilitate issue resolution',
      primaryContact: wu.primaryContacts[0],
      secondaryContact: wu.secondaryContacts[0],
    };

  }
  
   const notificationId = generateNotificationId({
     notificationPrefix: prefix,
     timezoneOffset: cluster.timezone_offset,
   });
  const payload = {
    notificationOrigin: "Job Monitoring",
    originationId: wu.jobMonitoringId,
    type: type,
    deliveryType: "immediate",
    templateName,
    metaData: {
      ...asrRelatedNotificationPayload,
      ...wu,
      notificationId,
      requireComplete: wu.requireComplete ? "Yes" : "No",
      Jobname: wu.Jobname,
      Wuid: wu.Wuid,
      expectedStart: new Date(wu.expectedStartTime).toLocaleString(),
      expectedCompletion: new Date(wu.expectedCompletionTime).toLocaleString(),
      discoveredAt: findLocalDateTimeAtCluster(
        cluster.timezone_offset
      ).toLocaleString(),
      host: cluster.thor_host,
      subject: `Tombolo Job Monitoring Alert`,
      mainRecipients: [
        ...wu.primaryContacts,
        ...(wu.secondaryContacts || []),
        ...(wu.notifyContacts || []),
      ],
      cc: [],
    },
    wuId: wu.Wuid,
  };

  return payload;
}

module.exports = {
  matchJobName,
  findStartAndEndTimes,
  calculateRunOrCompleteByTimes,
  wuStartTimeWhenLastScanAvailable,
  wuStartTimeWhenLastScanUnavailable,
  findLocalDateTimeAtCluster,
  checkIfCurrentTimeIsWithinRunWindow,
  determineNotificationTemplateAndNotificationPrefix,
  intermediateStates,
  generateNotificationId,
  createNotificationPayload,
};
