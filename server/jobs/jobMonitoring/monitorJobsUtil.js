//Package(s)
const moment = require("moment");


/** ----------------------------------------------------------------------------------------
 * This functions  match job names based on a format string.
 * The format string can include wildcards (*) and date placeholders (<DATE>).
 *
 * The replaceDatePlaceholders function replaces date placeholders in the format string.
 * A date placeholder can include options for date adjustment and date format.
 * If no options are provided, the current date in YYYYMMDD format is used.
 * If options are provided, they should be in the format <DATE,adjustment,format>.
 * The adjustment is a number of days to add to the current date.
 * The format is a strftime-style format string (%Y for year, %m for month, %d for day).
 *
 * The matchJobName function matches a job name against a format string.
 * The format string can include wildcards (*) and date placeholders (<DATE>).
 * A wildcard matches any sequence of characters.
 * A date placeholder matches a date, with optional adjustment and format options.
 * The function returns true if the job name matches the format string, false otherwise.
 */

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

const matchJobName = (jobNameFormat, jobName) => {
  // Replace wildcard with regex equivalent
  const formatWithWildcards = jobNameFormat.replace(/\*/g, ".*");

  // Handle date replacements
  const formatWithDates = replaceDatePlaceholders(formatWithWildcards);

  // Create regex and test against jobName
  const regex = new RegExp(`^${formatWithDates}$`);
  return regex.test(jobName);
};

/* Tests
const ans = matchJobName( "Launch <DATE> Current ","Launch 20240322 Current Carrier");
const ans1 = matchJobName( "Launch <DATE,1,%Y_%m_%d> test ","Launch 2024_03_24 test ");
const ans2 = matchJobName("Launch *", "Launch 20240323 test spray");
const ans3 = matchJobName("* Launch *", "X Launch 20240323 test spray");
const ans4 = matchJobName("* <DATE,1,%Y%d> *", "Launch 202423 test spray");
const ans5 = matchJobName("Launch <DATE,1,%y%B> Current Carrier", "Launch 24March Current Carrier");

console.log("0 -", ans);
console.log("1 -", ans1);
console.log("2 -", ans2);
console.log("3 -", ans3);
console.log("4 -", ans4);
console.log('5 -', ans5);
---------------------------------------------------------------------------------------------------------------- */
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

// -----------------------------------------------------------------------------------
function calculateRunOrCompleteByTimes(schedule) {
    return schedule.map(job => {
        const { schedulingType, frequency, expectedRunCompletionTime } = job;
        const [hours, minutes] = expectedRunCompletionTime.split(':').map(Number);
        let runOrCompleteBy = new Date();

        switch (schedulingType) {
            case 'daily':
                runOrCompleteBy.setHours(hours, minutes, 0, 0);
                break;
            case 'every2Days':
                runOrCompleteBy.setDate(runOrCompleteBy.getDate() - 1);
                runOrCompleteBy.setHours(hours, minutes, 0, 0);
                break;
            case 'overNight':
                if (runOrCompleteBy.getHours() < 12) {
                    runOrCompleteBy.setDate(runOrCompleteBy.getDate() - 1);
                }
                runOrCompleteBy.setHours(hours, minutes, 0, 0);
                break;
            case 'afternoon':
                runOrCompleteBy.setHours(hours < 12 ? hours + 12 : hours, minutes, 0, 0);
                break;
            case 'morning':
                runOrCompleteBy.setHours(hours < 12 ? hours : hours - 12, minutes, 0, 0);
                break;
            default:
                throw new Error(`Unknown scheduling type: ${schedulingType}`);
        }

        return {
            ...job,
            runOrCompleteBy: runOrCompleteBy.toISOString()
        };
    });
}


module.exports = {
  matchJobName,
  findStartAndEndTimes,
  calculateRunOrCompleteByTimes,
};
