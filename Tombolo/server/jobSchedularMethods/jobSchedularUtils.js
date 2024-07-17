/* Converts a given interval in minutes into an array of timestamps in HH:MM format,
 spanning from 00:00 to 23:59. */ 
function generateTimeSlotsForJobMonitoring({interval}) {
  const timeSlots = [];
  const roundedInterval = Math.ceil(interval); // round to closet upper integer
  const intervalsPerDay = Math.ceil((24 * 60) / roundedInterval);

  for (let i = 0; i < intervalsPerDay; i++) {
    const hour = Math.floor((i * roundedInterval) / 60);
    const minute = (i * roundedInterval) % 60;
    const formattedHour = hour.toString().padStart(2, "0");
    const formattedMinute = minute.toString().padStart(2, "0");
    timeSlots.push(`${formattedHour}:${formattedMinute}`);
  }

  if (!timeSlots.includes("23:59")) {
    timeSlots.push("23:59"); // final minute of the day to ensure all intervals are covered
  }

  return timeSlots;
}

/* Test : - 
const timeArray = generateTimeArray(180);
Result :
["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "23:59"]
*/

function generateTimeSlotsForMonitoringJobPunctuality({interval}){
  const timeSlots = [];
  const roundedInterval = Math.ceil(interval); // round to closet upper integer
  const intervalsPerDay = Math.ceil((24 * 60) / roundedInterval);

  for (let i = 0; i < intervalsPerDay; i++) {
    const hour = Math.floor((i * roundedInterval) / 60);
    const minute = (i * roundedInterval) % 60;
    const formattedHour = hour.toString().padStart(2, "0");
    const formattedMinute = minute.toString().padStart(2, "0");
    timeSlots.push(`${formattedHour}:${formattedMinute}`);
  }

    if (timeSlots.includes("00:00")) {
      const i = timeSlots.indexOf("00:00");
      timeSlots.splice(i, 1);
    }

  return timeSlots;

}


function generateIntervalString({timeSlots}) {
  let intervalString = "";
  timeSlots.forEach((time) => {
    intervalString += `at ${time} also `;
  });

  // Remove the trailing 'also'
  intervalString = intervalString.slice(0, -5);
  return `${intervalString}`;
}

/*Test 
const timeSlots = ["00:00", "03:00", "06:00"]
generateIntervalString({timeSlots})
Expected Result :
"at 00:00 also at 03:00 also at 06:00"
*/

module.exports = {
  generateTimeSlotsForJobMonitoring,
  generateIntervalString,
};
