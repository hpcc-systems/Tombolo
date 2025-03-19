// Local imports
const models = require("../../models");
const asrProducts = models.asr_products;
const asrDomains = models.asr_domains;
const notificationQueue = models.notification_queue;

//Package(s)
const moment = require("moment");
const cronParser = require("cron-parser");
const logger = require("../../config/logger");

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
const replaceDatePlaceholders = ({ formatWithWildcards, timezone_offset }) => {
  return formatWithWildcards.replace(/<DATE(,[^>]+)?>/g, (_, dateOptions) => {
    if (!dateOptions) {
      // No options, just replace with current date in YYYYMMDD format
      return moment().format("YYYYMMDD");
    }

    const [adjustment, dateFormat] = dateOptions.slice(1).split(",");

    // Adjust date as necessary
    let date = moment().utcOffset(timezone_offset);
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
const matchJobName = ({ jobNameFormat, jobName, timezone_offset }) => {
  // Replace wildcard * with regex equivalent .* and  ? with .
  const formatWithWildcards = jobNameFormat
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");

  // Handle date replacements
  const formatWithDates = replaceDatePlaceholders({
    formatWithWildcards,
    timezone_offset,
  });

  // Create regex and test against jobName
  const regex = new RegExp(`^${formatWithDates}$`);
  return regex.test(jobName);
};

// Find start and end time of a work unit since js communication library does not give that
function findStartAndEndTimes(data) {
  let minDate = Infinity;
  let maxDate = -Infinity;

  data.forEach((item) => {
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
function wuStartTimeWhenLastScanUnavailable(
  currentTime,
  offSet,
  backDateMinutes
) {
  const originalTimeStamp = new Date(currentTime).getTime();
  let adjustedTimeStamp = originalTimeStamp + offSet * 60 * 1000;
  adjustedTimeStamp = new Date(adjustedTimeStamp - backDateMinutes * 60 * 1000);
  return adjustedTimeStamp;
}

// Assume the system running below code is in UTC. Given timezone offset in minutes, calculate date and time.
function findLocalDateTimeAtCluster(timeZoneOffset) {
  const newDate = new Date();
  const localTime = new Date(newDate.getTime() + timeZoneOffset * 60 * 1000);
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
function calculateStartAndEndDateTime({
  localDateTimeAtCluster,
  runWindow,
  expectedStartTime,
  expectedCompletionTime,
}) {
  let startAndEnd;
  const previousDay = new Date(localDateTimeAtCluster.getTime() - 86400000);
  if (runWindow === "overnight") {
    startAndEnd = {
      start: setTimeToDate(previousDay, expectedStartTime || "12:00"),
      end: setTimeToDate(
        localDateTimeAtCluster,
        expectedCompletionTime || "12:00"
      ),
    };
  } else if (runWindow === "morning") {
    startAndEnd = {
      start: setTimeToDate(
        localDateTimeAtCluster,
        expectedStartTime || "00:00"
      ),
      end: setTimeToDate(
        localDateTimeAtCluster,
        expectedCompletionTime || "11:59"
      ),
    };
  } else if (runWindow === "afternoon") {
    startAndEnd = {
      start: setTimeToDate(
        localDateTimeAtCluster,
        expectedStartTime || "12:00"
      ),
      end: setTimeToDate(
        localDateTimeAtCluster,
        expectedCompletionTime || "23:59"
      ),
    };
  } else if (runWindow === "daily") {
    startAndEnd = {
      start: setTimeToDate(
        localDateTimeAtCluster,
        expectedStartTime || "00:00"
      ),
      end: setTimeToDate(
        localDateTimeAtCluster,
        expectedCompletionTime || "23:59"
      ),
    };
  } else {
    startAndEnd = {
      start: setTimeToDate(
        localDateTimeAtCluster,
        expectedStartTime || "00:00"
      ),
      end: setTimeToDate(
        localDateTimeAtCluster,
        expectedCompletionTime || "23:59"
      ),
    };
  }
  return startAndEnd;
}

// Daily jobs
function calculateRunOrCompleteByTimeForDailyJobs({
  schedule,
  expectedStartTime,
  expectedCompletionTime,
  timezone_offset,
  backDateInMs = 0,
}) {
  const { runWindow } = schedule;

  const localDateTimeAtCluster = findLocalDateTimeAtCluster(timezone_offset);
  const adjustedLocalTimeAtCluster = new Date(
    localDateTimeAtCluster.getTime() - backDateInMs
  );

  let window = { frequency: "daily", currentTime: localDateTimeAtCluster };

  const startAndEnd = calculateStartAndEndDateTime({
    localDateTimeAtCluster: adjustedLocalTimeAtCluster,
    runWindow,
    expectedStartTime,
    expectedCompletionTime,
  });
  return { ...window, ...startAndEnd };
}

// Weekly jobs
function calculateRunOrCompleteByTimeForWeeklyJobs({
  schedule,
  expectedStartTime,
  expectedCompletionTime,
  timezone_offset,
  backDateInMs = 0,
}) {
  const { days, runWindow } = schedule;

  // Find current day at the cluster given timezone offset and this system  in utc
  const localDateTimeAtCluster = findLocalDateTimeAtCluster(timezone_offset);
  const adjustedLocalTimeAtCluster = new Date(
    localDateTimeAtCluster.getTime() - backDateInMs
  );
  const day = adjustedLocalTimeAtCluster.getDay();
  const runDay = days.find((d) => d === day.toString());

  let window = null;
  if (!runDay) {
    return window;
  }
  window = { frequency: "weekly", currentTime: localDateTimeAtCluster };

  const startAndEnd = calculateStartAndEndDateTime({
    localDateTimeAtCluster: adjustedLocalTimeAtCluster,
    runWindow,
    expectedStartTime,
    expectedCompletionTime,
  });

  return { ...window, ...startAndEnd };
}

// Monthly jobs
function calculateRunOrCompleteByTimeForMonthlyJobs({
  schedule,
  expectedStartTime,
  expectedCompletionTime,
  timezone_offset,
  backDateInMs = 0,
}) {
  // Determine if schedule is by date or week and weekday
  const { scheduleBy } = schedule[0];
  const localDateTimeAtCluster = findLocalDateTimeAtCluster(timezone_offset);
  const adjustedLocalTimeAtCluster = new Date(
    localDateTimeAtCluster.getTime() - backDateInMs
  );

  let window = {
    currentTime: localDateTimeAtCluster,
    frequency: "monthly",
  };

  if (scheduleBy === "dates") {
    const { dates, runWindow } = schedule[0]; // by date has only one element in an array
    const dateAtCluster = adjustedLocalTimeAtCluster.getDate();

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
      localDateTimeAtCluster: adjustedLocalTimeAtCluster,
      runWindow,
      expectedStartTime,
      expectedCompletionTime,
    });

    // return object with start and end time etc
    return { ...window, ...startAndEnd };
  }

  if (scheduleBy === "weeks-day") {
    const dayAtCluster = adjustedLocalTimeAtCluster.getDay();
    const day = schedule.find((s) => s.day === dayAtCluster.toString());

    // no matching day
    if (!day) {
      return null;
    }

    // week of month
    let momentDate = moment(adjustedLocalTimeAtCluster);

    let thisWeek =
      momentDate.week() - moment(momentDate).startOf("month").week() + 1;

    // All weeks for matching day
    let weeks = [];
    schedule.forEach((s) => {
      weeks = [...weeks, ...s.weeks];
    });

    // if current week is not in the list of weeks
    if (!weeks.includes(thisWeek)) {
      return null;
    }

    // Add schedule by to the window object
    window.scheduleBy = "weeks-day";

    // Calculate start and end time
    const startAndEnd = calculateStartAndEndDateTime({
      localDateTimeAtCluster: adjustedLocalTimeAtCluster,
      runWindow: day.runWindow,
      expectedStartTime,
      expectedCompletionTime,
    });

    // return object with start and end time etc
    return { ...window, ...startAndEnd };
  }
}

// Yearly jobs
function calculateRunOrCompleteByTimeForYearlyJobs({
  schedule,
  expectedStartTime,
  expectedCompletionTime,
  timezone_offset,
  backDateInMs = 0,
}) {
  const { scheduleBy } = schedule[0];

  // Local date time at cluster
  const localDateTimeAtCluster = findLocalDateTimeAtCluster(timezone_offset);
  const adjustedLocalDateTimeAtCluster = new Date(
    localDateTimeAtCluster.getTime() - backDateInMs
  );

  // Current month at the cluster
  const monthAtCluster = adjustedLocalDateTimeAtCluster.getMonth();
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

  if (scheduleBy === "month-date") {
    // current date at the cluster
    const dateAtCluster = adjustedLocalDateTimeAtCluster.getDate();
    const dates = [];
    schedule.forEach((s) => {
      dates.push(s.date);
    });

    // Not scheduled to run on the current date
    if (!dates.includes(dateAtCluster)) {
      return null;
    }

    // Add schedule by to the window object
    window.scheduleBy = "month-date";

    // Calculate start and end time
    const startAndEnd = calculateStartAndEndDateTime({
      localDateTimeAtCluster: adjustedLocalDateTimeAtCluster,
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

  if (scheduleBy === "week-day-month") {
    const dayAtCluster = adjustedLocalDateTimeAtCluster.getDay();

    // Days
    const days = schedule.map((s) => s.day);
    const day = dayAtCluster.toString();
    const scheduleDayMatch = days.includes(day);

    // if today in not in list of days
    if (!scheduleDayMatch) {
      return null;
    }

    // week of month
    let momentDate = moment(adjustedLocalDateTimeAtCluster);
    let thisWeek =
      momentDate.week() - moment(momentDate).startOf("month").week() + 1;
    const weeks = schedule.map((s) => s.week);
    const scheduleWeekMatch = weeks.includes(thisWeek);

    // if current week is not in the list of weeks
    if (!scheduleWeekMatch) {
      return null;
    }

    // Add schedule by to the window object
    window.scheduleBy = "week-day-month";

    // Calculate start and end time
    const startAndEnd = calculateStartAndEndDateTime({
      localDateTimeAtCluster: adjustedLocalDateTimeAtCluster,
      runWindow: day.runWindow,
      expectedStartTime,
      expectedCompletionTime,
    });

    // return object with start and end time etc
    return { ...window, ...startAndEnd };
  }
}

// Cron jobs
function calculateRunOrCompleteByTimeForCronJobs({
  schedule,
  expectedStartTime,
  expectedCompletionTime,
  timezone_offset,
  backDateInMs = 0,
}) {
  const cron = schedule[0].cron;

  // Local date time at cluster
  const localDateTimeAtCluster = findLocalDateTimeAtCluster(timezone_offset);
  const adjustedLocalDateTimeAtCluster = new Date(
    localDateTimeAtCluster.getTime() - backDateInMs
  );

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

  if (
    prevStartDateTime <= adjustedLocalDateTimeAtCluster &&
    adjustedLocalDateTimeAtCluster <= prevEndDateTime
  ) {
    withInWindow = true;
  }
  if (
    nextStartDateTime <= adjustedLocalDateTimeAtCluster &&
    adjustedLocalDateTimeAtCluster <= nextEndDateTime
  ) {
    withInWindow = true;
  }

  if (!withInWindow) {
    return null;
  }
  return {
    frequency: "cron",
    start: setTimeToDate(adjustedLocalDateTimeAtCluster, expectedStartTime),
    end: setTimeToDate(adjustedLocalDateTimeAtCluster, expectedCompletionTime),
    currentTime: localDateTimeAtCluster,
  };
}

function checkIfCurrentTimeIsWithinRunWindow({ start, end, currentTime }) {
  // Ensure currentTime is a Date object
  if (!(currentTime instanceof Date)) {
    throw new Error("Invalid input: currentTime must be a Date object");
  }

  // Extract the date part from currentTime
  const currentDate = currentTime.toISOString().split("T")[0]; // Get the date part of currentTime

  // Combine the date part with the start and end times to create Date objects
  start = new Date(`${currentDate}T${start}:00.000Z`);
  end = new Date(`${currentDate}T${end}:00.000Z`);

  // Validate input parameters
  if (
    !(start instanceof Date) ||
    !(end instanceof Date) ||
    !(currentTime instanceof Date)
  ) {
    throw new Error(
      "Invalid input: start, end, and currentTime must be Date objects"
    );
  }

  // Adjust conditions to include start and end in the "within" range
  if (currentTime >= start && currentTime <= end) {
    return "within";
  } else if (currentTime < start) {
    return "before";
  } else {
    return "after";
  }
}

// Calculate run and complete by time for a job on cluster's local time
function calculateRunOrCompleteByTimes({
  schedule,
  timezone_offset,
  expectedStartTime,
  expectedCompletionTime,
  backDateInMs = 0,
}) {
  // determine frequency
  frequency = schedule[0].frequency;

  switch (frequency) {
    case "daily":
      return calculateRunOrCompleteByTimeForDailyJobs({
        schedule: schedule[0],
        expectedStartTime,
        expectedCompletionTime,
        timezone_offset,
        backDateInMs,
      });
    case "weekly":
      return calculateRunOrCompleteByTimeForWeeklyJobs({
        schedule: schedule[0],
        expectedStartTime,
        expectedCompletionTime,
        timezone_offset,
        backDateInMs,
      });
    case "monthly":
      return calculateRunOrCompleteByTimeForMonthlyJobs({
        schedule,
        expectedStartTime,
        expectedCompletionTime,
        timezone_offset,
        backDateInMs,
      });
    case "yearly":
      return calculateRunOrCompleteByTimeForYearlyJobs({
        schedule,
        expectedStartTime,
        expectedCompletionTime,
        timezone_offset,
        backDateInMs,
      });
    case "cron":
      return calculateRunOrCompleteByTimeForCronJobs({
        schedule,
        expectedStartTime,
        expectedCompletionTime,
        timezone_offset,
        backDateInMs,
      });
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

// Generate a human readable notification ID in the format of <TEXT>_YYYYMMDD_HHMMSS_MS
const generateNotificationId = ({ notificationPrefix, timezoneOffset }) => {
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
const createNotificationPayload = ({
  type,
  templateName,
  originationId,
  applicationId,
  subject,
  recipients,
  notificationId,
  asrSpecificMetaData = {}, // region: "USA",  product: "Telematics",  domain: "Insurance", severity: 3,
  wuId,
  issue,
  firstLogged,
  lastLogged,
  notificationDescription,
}) => {
  const payload = {
    type,
    templateName,
    notificationOrigin: "Job Monitoring",
    originationId,
    deliveryType: "immediate",
    metaData: {
      notificationOrigin: "Job Monitoring",
      applicationId,
      subject,
      mainRecipients: recipients.primaryContacts || [],
      cc: [...recipients.secondaryContacts, ...recipients.notifyContacts],
      notificationDescription,
      notificationId,
      ...asrSpecificMetaData,
      issue,
      firstLogged,
      lastLogged,
      wuId,
      remedy: {
        Instruction:
          "Please contact one of the following to facilitate issue resolution:",
        "Primary Contact": recipients.primaryContacts,
        "Secondary Contact": [
          ...recipients.secondaryContacts,
          ...recipients.notifyContacts,
        ],
      },
    },
  };

  return payload;
};

function extractDateSubstring(inputString) {
  // Regular expression to match '<DATE ... >'
  const regex = /<DATE[^>]*>/;

  // Use match to find the substring
  const match = inputString.match(regex);

  // Return the matched substring or null if no match found
  return match ? match[0] : "";
}

// Return replacement object for date
function getDateReplacements(date) {
  const replacements = {
    "%Y": date.getFullYear(),
    "%m": (date.getMonth() + 1).toString().padStart(2, "0"),
    "%d": date.getDate().toString().padStart(2, "0"),
    "%t": " ",
    "%y": date.getFullYear().toString().slice(-2),
    "%B": date.toLocaleString("en-US", { month: "long" }),
    "%b": date.toLocaleString("en-US", { month: "short" }),
    "%h": date.toLocaleString("en-US", { month: "short" }),
    "%e": date.getDate().toString().padStart(2, "0"),
    "%j": Math.ceil((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
      .toString()
      .padStart(3, "0"),
  };
  return replacements;
}

// Generate job name from job pattern
function generateJobName({ pattern, timezone_offset = 0, backDateInDays = 0 }) {
  let patternCopy = pattern;
  if (!patternCopy) return "";

  if (!patternCopy.includes("<DATE")) {
    return patternCopy;
  }

  // Extract date string from patternCopy
  const dateSubstring = extractDateSubstring(patternCopy);

  // No pattern, no adjustments
  if (dateSubstring === "<DATE>") {
    let date = new Date(Date.now() + timezone_offset * 1000);
    // adjust backdate
    date = new Date(date.getTime() - backDateInDays * 86400000);
    const replacements = getDateReplacements(date);
    const translatedDate =
      replacements["%Y"] + replacements["%m"] + replacements["%d"];
    patternCopy = patternCopy.replace(dateSubstring, translatedDate);
  }

  // If pattern has adjustments
  else if (dateSubstring.includes("<DATE,")) {
    const strings = dateSubstring.split(",");
    let adjustment = 0;
    const parsedAdjustment = parseInt(strings[1]);
    if (!isNaN(parsedAdjustment)) {
      adjustment = parsedAdjustment;
      strings.splice(1, 1);
      const newDateSubstring = strings.join("");
      patternCopy = patternCopy.replace(dateSubstring, newDateSubstring);
      patternCopy = patternCopy.replace("<DATE", "");
      patternCopy = patternCopy.replace(">", "");

      const date = new Date(
        Date.now() + timezone_offset * 60000 + adjustment * 86400000
      );
      const replacements = getDateReplacements(date);

      for (const key in replacements) {
        patternCopy = patternCopy.replace(key, replacements[key]);
      }
    }
  }
  return patternCopy;
}

// Test cases
// console.log( generateJobName({pattern: "Launch <DATE> Current",timezone_offset: 0}));
// console.log(generateJobName({ pattern: "Launch*Alirts Despray", timezone_offset: 0 }));
// console.log( generateJobName({pattern: "Launch <DATE>*Alirts Despray",timezone_offset: 0}));
// console.log(generateJobName({ pattern: "Launch <DATE,-1,%Y-%m-%d> Build*", timezone_offset: 0}));
// console.log( generateJobName({pattern: "<DATE,0,%y/%m/%d>* Test",timezone_offset: 0}));
// console.log(generateJobName({ pattern: "Launch <DATE,0,%Y_%m_%d>"}));

const nocAlertDescription = `[SEV TICKET REQUEST]   
                             The following issue has been identified via automation.   
                            Please open a sev ticket if this issue is not yet in the process of being addressed. Bridgeline not currently required.`;

// Given 2 times in HH:MM format, calculate the difference in milliseconds
function differenceInMs({ startTime, endTime, daysDifference }) {
  const [hours1, minutes1] = startTime.split(":").map(Number);
  const [hours2, minutes2] = endTime.split(":").map(Number);

  const startDate = new Date();
  const endDate = new Date();

  startDate.setHours(hours1, minutes1, 0, 0);
  endDate.setHours(hours2, minutes2, 0, 0);

  startDate.setDate(startDate.getDate() - daysDifference);

  const difference = endDate - startDate; // Convert milliseconds to minutes
  return Math.abs(difference);
}

const WUInfoOptions = (Wuid) => {
  return {
    Wuid: Wuid,
    TruncateEclTo64k: true,
    IncludeExceptions: true,
    IncludeGraphs: true,
    IncludeSourceFiles: true,
    IncludeResults: true,
    IncludeResultsViewNames: true,
    IncludeVariables: true,
    IncludeTimers: true,
    IncludeDebugValues: true,
    IncludeApplicationValues: true,
    IncludeWorkflows: true,
    IncludeXmlSchemas: false,
    IncludeResourceURLs: true,
    IncludeECL: true,
    IncludeHelpers: true,
    IncludeAllowedClusters: true,
    IncludeTotalClusterTime: true,
    IncludeServiceNames: true,
    SuppressResultSchemas: true,
  };
};

const convertTotalClusterTimeToSeconds = (totalClusterTime) => {
  if (!totalClusterTime) {
    return 0;
  }
  //take off the milliseconds
  const cleanedTime = totalClusterTime.split(".")[0];
  //split on colon
  const timeParts = cleanedTime.split(":");

  const multipliers = [1, 60, 3600, 86400]; //seconds, minutes, hours, days

  //reverse order of timeParts so seconds are first
  timeParts.reverse();

  let total = 0;

  timeParts.forEach((part, index) => {
    total += parseInt(part) * multipliers[index];
  });

  return total;
};

const WUAlertDataPoints = () => {
  return [
    "Wuid",
    "WarningCount",
    "ErrorCount",
    "GraphCount",
    "SourceFileCount",
    "ResultCount",
    "TotalClusterTime",
    "FileAccessCost",
    "CompileCost",
    "ExecuteCost",
  ];
};

module.exports = {
  matchJobName,
  findStartAndEndTimes,
  calculateRunOrCompleteByTimes,
  wuStartTimeWhenLastScanAvailable,
  wuStartTimeWhenLastScanUnavailable,
  findLocalDateTimeAtCluster,
  checkIfCurrentTimeIsWithinRunWindow,
  generateNotificationId,
  createNotificationPayload,
  generateJobName,
  intermediateStates,
  getProductCategory,
  getDomain,
  nocAlertDescription,
  differenceInMs,
  WUInfoOptions,
  convertTotalClusterTimeToSeconds,
  WUAlertDataPoints,
};
