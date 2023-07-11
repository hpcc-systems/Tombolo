import React from 'react';

const CronGuide = () => {
  /*
        Following the structure below will assist in keeping guide structure consistent throughout the project.
        <span> tags are utilized to bold key phrases to make content more easily scannable and emphasize important pieces of information
        Always follow a proper heading structure with <h3> as the top level heading (h2 is the title of the info drawer), and <h4> for subheadings
        All heading tags are automatically bolded, so no <span> tag is necessary
        Avoid use of <br/> tags, instead group text into a new <p> tag to achieve a break line for consistency. 
    */
  return (
    <div className="guide">
      <h2>Cron guide</h2>
      <h3>General</h3>
      <p>
        {' '}
        Cron enables users to schedule tasks to run periodically at a specified date/time. And its naturally a great
        tool for automating lots of process runs, which otherwise would require human intervention.
      </p>
      <h3>Structure</h3>
      <p>Cron expressions consist of five fields:</p>
      <p>
        <span>{'<minute> <hour> <day-of-month> <month> <day-of-week>'}</span>.
      </p>
      <p>Each field will take a value or special characters to describe the interval.</p>
      <h3>Field Values</h3>
      <ul>
        <li>
          <span>{`* (all)`}</span>
          {` specifies that event should happen for every time unit. For example, “*” in the <minute> field means “for every minute.”`}
        </li>
        <li>
          <span>{`? (any)`}</span>
          {` is utilized in the <day-of-month> and <day-of -week> fields to denote the arbitrary value and thus neglect the field value. For example, if we want to fire a script at “5th of every month” irrespective of what day of the week falls on that date, we specify a “?” in the <day-of-week> field.
`}
        </li>
        <li>
          <span>{`– (range)`}</span>

          {` determines the value range. For example, “10-11” in the <hour> field means “10th and 11th hours.”`}
        </li>
        <li>
          <span>{`, (values)`}</span>
          {` specifies multiple values. For example, “MON, WED, FRI“ in <day-of-week> field means on the days “Monday, Wednesday and Friday.”`}
        </li>
        <li>
          <span>{`/ (increments)`}</span>
          {` specifies the incremental values. For example, a “5/15” in the <minute> field means at “5, 20, 35 and 50 minutes of an hour.”
`}
        </li>
        <li>
          <span>{`L (last)`}</span>
          {` has different meanings when used in various fields. For example, if it's applied in the <day-of-month> field, it means last day of the month, i.e. “31st of January” and so on as per the calendar month. It can be used with an offset value, like “L-3”, which denotes the “third to last day of the calendar month.” In <day-of-week>, it specifies the “last day of a week.” It can also be used with another value in <day-of-week>, like “6L”, which denotes the “last Friday.”
`}
        </li>
        <li>
          <span>{`W (weekday)`}</span>
          {` determines the weekday (Monday to Friday) nearest to a given day of the month. For example, if we specify “10W” in the <day-of-month> field, it means the “weekday near to 10th of that month.” So if “10th” is a Saturday, the job will be triggered on “9th,” and if “10th” is a Sunday, it will trigger on “11th.” If we specify “1W” in <day-of-month> and if “1st” is Saturday, the job will be triggered on “3rd,” which is Monday, and it will not jump back to the previous month.
`}
        </li>
        <li>
          <span>{`#`}</span>
          {` specifies the “N-th” occurrence of a weekday of the month, for example, “third Friday of the month” can be indicated as “6#3”.`}
        </li>
      </ul>
      <h3>Examples</h3>
      <ul>
        <li>
          <p>
            At noon every day: <span>0 12 * * ?</span>
          </p>
        </li>
        <li>
          {' '}
          <p>
            At 9:30 a.m. every Monday, Tuesday, Wednesday, Thursday and Friday: <span>30 9 ? * MON-FRI</span>
          </p>
        </li>
        <li>
          {' '}
          <p>
            At 6 p.m. on the last day of every month: <span>0 18 L * ?</span>
          </p>
        </li>
        <li>
          {' '}
          <p>
            Every minute starting at 1 p.m. and ending at 1:05 p.m., every day: <span>0-5 13 * * ?</span>
          </p>
        </li>
      </ul>
    </div>
  );
};

export default CronGuide;
