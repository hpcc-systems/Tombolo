import React from 'react';

const CronGuide: React.FC = () => {
  /*
    Guide content for Cron expressions. Keep headings consistent and use
    paragraph/grouping rather than <br/> for line breaks.
  */
  return (
    <div className="guide">
      <h2>Cron guide</h2>
      <h3>General</h3>
      <p>
        Cron enables users to schedule tasks to run periodically at a specified date/time. It's a great tool for
        automating processes that would otherwise require human intervention.
      </p>
      <h3>Structure</h3>
      <p>Cron expressions consist of five fields:</p>
      <p>
        <span>{'<minute> <hour> <day-of-month> <month> <day-of-week>'}</span>.
      </p>
      <p>Each field accepts values or special characters to describe the interval.</p>
      <h3>Field Values</h3>
      <ul>
        <li>
          <strong>* (all):</strong> specifies every value for that unit (e.g., '*' in <em>minute</em> means every
          minute).
        </li>
        <li>
          <strong>? (any):</strong> used in <em>day-of-month</em> or <em>day-of-week</em> to denote an arbitrary value.
        </li>
        <li>
          <strong>- (range):</strong> specifies a range of values (e.g., '10-11' in <em>hour</em> means 10 and 11).
        </li>
        <li>
          <strong>, (values):</strong> lists multiple values (e.g., 'MON,WED,FRI').
        </li>
        <li>
          <strong>/ (increments):</strong> specifies increments (e.g., '5/15' in <em>minute</em> means 5,20,35,50).
        </li>
        <li>
          <strong>L (last):</strong> has field-specific meanings (e.g., last day of month in <em>day-of-month</em>).
        </li>
        <li>
          <strong>W (weekday):</strong> nearest weekday to a given day (e.g., '10W' — nearest weekday to 10th).
        </li>
        <li>
          <strong># (nth):</strong> specifies the nth occurrence of a weekday (e.g., '6#3' = third Friday).
        </li>
      </ul>
      <h3>Examples</h3>
      <ul>
        <li>
          At noon every day: <strong>0 12 * * ?</strong>
        </li>
        <li>
          At 9:30 a.m. every weekday: <strong>30 9 ? * MON-FRI</strong>
        </li>
        <li>
          At 6 p.m. on the last day of every month: <strong>0 18 L * ?</strong>
        </li>
        <li>
          Every minute from 1:00pm to 1:05pm daily: <strong>0-5 13 * * ?</strong>
        </li>
      </ul>
    </div>
  );
};

export default CronGuide;
