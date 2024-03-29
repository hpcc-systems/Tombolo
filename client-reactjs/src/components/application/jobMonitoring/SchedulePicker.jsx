/* eslint-disable unused-imports/no-unused-imports */
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Radio, Space, Checkbox, Select, Tag, Input, Tooltip } from 'antd';
import cronstrue from 'cronstrue';

// Daily schedule options
const dailyRunWindowAndIntervals = [
  { label: 'Daily (00:00 - 23:59)', value: 'daily' },
  { label: 'Every Morning (00:00 - 11:59)', value: 'morning' },
  { label: 'Every Afternoon (12:00 - 23:59)', value: 'afternoon' },
  { label: 'Overnight (Previous Day 12:00 - Current Day 12:00)', value: 'overnight' },
  { label: 'Every 2 Days', value: 'every2Days' },
];

import {
  daysOfWeek,
  weeks,
  months,
  daysOfMonth,
  getDayLabel,
  getMonthLabel,
  getDateLabel,
  getWeekLabel,
} from '../../common/scheduleOptions.js';
import './jobMonitoring.css';

const parseCron = (cron) => {
  if (!cron) return null;
  try {
    // Try to parse the cron string and generate a human-readable explanation
    const explanation = cronstrue.toString(cron);
    return { valid: true, message: explanation };
  } catch (err) {
    // If the cron string is invalid, return a payload with type 'cronExplainer'
    return { valid: false, message: err };
  }
};

function SchedulePicker({
  intermittentScheduling,
  setIntermittentScheduling,
  completeSchedule,
  setCompleteSchedule,
  cron,
  setCron,
  cronMessage,
  setCronMessage,
}) {
  const [yearlyRadio, setYearlyRadio] = useState(null);
  const [monthlyRadio, setMonthlyRadio] = useState(null);
  const [individualValues, setIndividualValues] = useState({}); // Individual input fields such as month, year, day

  //useEffect to parse cron expression
  useEffect(() => {
    const parsedCron = parseCron(cron);
    setCronMessage(parsedCron);
  }, [cron]);

  // When next or add more is clicked button is clicked
  const addSchedule = () => {
    intermittentScheduling.id = uuidv4();
    setCompleteSchedule((prev) => [...prev, { ...intermittentScheduling }]);
    if (intermittentScheduling.scheduleBy === 'month-date' && intermittentScheduling.frequency === 'yearly') {
      setIndividualValues((prev) => ({ ...prev, radio1_month: null, radio1_date: null }));
      setIntermittentScheduling((prev) => ({
        frequency: prev.frequency,
        scheduleBy: 'month-date',
      }));
    }
    if (intermittentScheduling.scheduleBy === 'week-day-month' && intermittentScheduling.frequency === 'yearly') {
      setIndividualValues((prev) => ({ ...prev, radio2_month: null, radio2_day: null, radio2_week: null }));
      setIntermittentScheduling((prev) => ({
        frequency: prev.frequency,
        scheduleBy: 'week-day-month',
      }));
    }
    if (intermittentScheduling.scheduleBy === 'weeks-day' && intermittentScheduling.frequency === 'monthly') {
      setIndividualValues((prev) => ({ ...prev, weeks: [], day: null }));
      setIntermittentScheduling((prev) => ({ frequency: prev.frequency, scheduleBy: 'weeks-day' }));
    }
  };

  // When schedule option  changes - Daily/weekly/monthly/yearly etc.
  const handlingSchedulingOptionChange = (e) => {
    const selected = e.target.value;
    setYearlyRadio(null);
    setMonthlyRadio(null);
    setCompleteSchedule([]);
    setIndividualValues({});
    if (selected === 'daily') {
      setIntermittentScheduling({ frequency: selected, runWindow: 'daily' });
    } else {
      setIntermittentScheduling({ frequency: selected });
    }
  };

  // Daily Break down - When daily option is selected
  const dailyBreakDown = (
    <div>
      <Radio checked>Daily run window/interval</Radio>
      <div style={{ margin: '5px 0 0 20px', color: 'var(--secondary)', width: '100%' }}>
        <Select
          style={{ width: '100%' }}
          defaultValue={intermittentScheduling?.runWindow}
          onChange={(value) => setIntermittentScheduling((prev) => ({ ...prev, runWindow: value }))}>
          {dailyRunWindowAndIntervals.map((option) => (
            <Select.Option value={option.value} key={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      </div>
      {/* <div style={{ margin: '5px 0 0 20px', color: 'var(--secondary)' }}>
        <RangePicker
          format="h:mm a"
          allowClear
          onChange={(value, _valueString) => {
            setIntermittentScheduling((prev) => ({ ...prev, range: value }));
          }}
          defaultValue={[dayjs('00:00', 'HH:mm'), dayjs('12:00', 'HH:mm')]}
        />
      </div>
      <div style={{ margin: '5px 0 0 20px', color: 'var(--secondary)' }}>
        <RangePicker
          format="HH:mm"
          defaultValue={[dayjs('11:05', 'HH:mm'), dayjs('11:09', 'HH:mm')]}
          onChange={(value) => {
            const timeRange = value.map((v) => v.format('HH:mm'));
            console.log(timeRange); // ["11:05", "11:09"]
            setIntermittentScheduling((prev) => ({ ...prev, timeRange }));
          }}
        />
      </div> */}
      <div style={{ margin: '0px 0 0 20px', color: 'var(--secondary)' }}>
        Note: For weekends / weekdays select Weekly option
      </div>
    </div>
  );

  // Weekly breakdown - When weekly option is selected
  const weeklyBreakDown = (
    <div>
      <div style={{ marginBottom: '8px' }}>Runs every week on :</div>
      <Checkbox.Group
        options={daysOfWeek}
        value={intermittentScheduling.days}
        onChange={(checkedValues) => {
          setIntermittentScheduling((prev) => ({ ...prev, days: checkedValues }));
        }}
      />
    </div>
  );

  // Monthly breakdown - When monthly option is selected
  const monthlyBreakDown = (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div>Runs every month</div>
        <span style={{ marginTop: '5px' }}>
          <Radio
            value="1"
            checked={monthlyRadio === '1'}
            onChange={() => {
              setMonthlyRadio('1');
              setIndividualValues({});
              setIntermittentScheduling((prev) => ({ frequency: prev.frequency, scheduleBy: 'dates' }));
              setCompleteSchedule([]);
            }}>
            On{' '}
          </Radio>
          <Select
            options={daysOfMonth}
            style={{ minWidth: '140px', maxWidth: '430px' }}
            disabled={monthlyRadio !== '1'}
            size="small"
            placeholder="date(s)"
            maxTagCount={5}
            maxTagPlaceholder={(omittedValues) => <span> + {omittedValues.length} more</span>}
            mode="multiple"
            value={individualValues?.dates}
            onChange={(values) => {
              setIndividualValues((prev) => ({ ...prev, dates: values }));
              setIntermittentScheduling((prev) => ({ ...prev, dates: values }));
            }}></Select>
        </span>
        <span style={{ marginTop: '10px' }}>
          <Radio
            value="2"
            checked={monthlyRadio === '2'}
            onChange={() => {
              setMonthlyRadio('2');
              setIndividualValues({ dates: [], weeks: [], day: null });
              setIntermittentScheduling((prev) => ({ frequency: prev.frequency, scheduleBy: 'weeks-day' }));
              setCompleteSchedule([]);
            }}>
            On
          </Radio>
          <Select
            size="small"
            mode="multiple"
            disabled={monthlyRadio !== '2'}
            maxTagCount={2}
            maxTagPlaceholder={(omittedValues) => <span> + {omittedValues.length} more</span>}
            options={weeks}
            placeholder="week(s)"
            style={{ minWidth: '140px', maxWidth: '240px' }}
            value={individualValues?.weeks}
            onChange={(values) => {
              setIndividualValues((prev) => ({ ...prev, weeks: values }));
              setIntermittentScheduling((prev) => ({ ...prev, weeks: values }));
            }}></Select>
          <Select
            style={{ minWidth: '100px', marginLeft: '5px' }}
            size="small"
            disabled={monthlyRadio !== '2'}
            options={daysOfWeek}
            placeholder="day"
            value={individualValues?.day}
            onChange={(value) => {
              setIndividualValues((prev) => ({ ...prev, day: value }));
              setIntermittentScheduling((prev) => ({ ...prev, day: value }));
            }}></Select>
          {individualValues?.weeks?.length > 0 && individualValues?.day ? (
            <span className="schedularSelector__addMoreBtn" onClick={addSchedule}>
              Add more
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );

  // Yearly breakdown - when yearly option is selected
  const yearlyBreakDown = (
    <div>
      <div>Runs every year</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span>
          <Radio
            style={{ marginTop: '5px' }}
            value="1"
            checked={yearlyRadio === '1'}
            onChange={() => {
              setYearlyRadio('1');
              setIndividualValues({});
              setIntermittentScheduling((prev) => ({ frequency: prev.frequency, scheduleBy: 'month-date' }));
              setCompleteSchedule([]);
            }}>
            On
          </Radio>
          <Select
            options={months}
            placeholder="month"
            style={{ width: '100px' }}
            value={individualValues.radio1_month}
            size="small"
            disabled={yearlyRadio !== '1'}
            onChange={(_value, option) => {
              setIndividualValues((prev) => ({ ...prev, radio1_month: option.value }));
              setIntermittentScheduling((prev) => ({ ...prev, month: option.value }));
            }}
          />{' '}
          <Select
            size="small"
            options={daysOfMonth}
            style={{ width: '70px', marginLeft: '10px' }}
            placeholder="date"
            value={individualValues.radio1_date}
            disabled={yearlyRadio !== '1'}
            onChange={(_value, option) => {
              setIndividualValues((prev) => ({ ...prev, radio1_date: option.value }));
              setIntermittentScheduling((prev) => ({ ...prev, date: option.value }));
            }}
          />
          {individualValues.radio1_month && individualValues.radio1_date ? (
            <span className="schedularSelector__addMoreBtn" onClick={addSchedule}>
              Add more
            </span>
          ) : null}
        </span>
        <span>
          <Radio
            style={{ marginTop: '5px' }}
            value="1"
            checked={yearlyRadio === '2'}
            onChange={() => {
              setYearlyRadio('2');
              setIndividualValues({});
              setIntermittentScheduling((prev) => ({
                frequency: prev.frequency,
                scheduleBy: 'week-day-month',
              }));

              setCompleteSchedule([]);
            }}>
            On
          </Radio>
          <Select
            options={weeks}
            placeholder="week"
            popupMatchSelectWidth={true}
            size="small"
            disabled={yearlyRadio !== '2'}
            style={{ width: '100px' }}
            value={individualValues.radio2_week}
            onChange={(_value, option) => {
              setIndividualValues((prev) => ({ ...prev, radio2_week: option.value }));
              setIntermittentScheduling((prev) => ({ ...prev, week: option.value }));
            }}
          />
          <Select
            options={daysOfWeek}
            placeholder="day"
            popupMatchSelectWidth={true}
            size="small"
            disabled={yearlyRadio !== '2'}
            style={{ marginLeft: '10px', width: '110px' }}
            value={individualValues.radio2_day}
            onChange={(_value, option) => {
              setIndividualValues((prev) => ({ ...prev, radio2_day: option.value }));
              setIntermittentScheduling((prev) => ({ ...prev, day: option.value }));
            }}
          />{' '}
          of
          <Select
            options={months}
            placeholder="month"
            popupMatchSelectWidth={true}
            size="small"
            disabled={yearlyRadio !== '2'}
            style={{ marginLeft: '10px', width: '110px' }}
            value={individualValues.radio2_month}
            onChange={(_value, option) => {
              setIndividualValues((prev) => ({ ...prev, radio2_month: option.value }));
              setIntermittentScheduling((prev) => ({
                ...prev,
                month: option.value,
              }));
            }}
          />
          {individualValues.radio2_month && individualValues.radio2_day && individualValues.radio2_week ? (
            <span className="schedularSelector__addMoreBtn" onClick={addSchedule}>
              Add more
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
  // handle corn input change
  const handleCronInputChange = (e) => {
    const v = e.target.value;
    setCron(v);
    setIntermittentScheduling((prev) => ({ frequency: prev.frequency, cron: v }));
  };

  //Cron Input and validation
  const cronInputAndValidation = (
    <>
      <Input placeholder="*/5 * * * *" onChange={(e) => handleCronInputChange(e)} allowClear />
      {cronMessage == null ? (
        <div>
          Click{' '}
          <a href="https://crontab.cronhub.io/" style={{ textDecoration: 'underline' }}>
            Here
          </a>{' '}
          to create cron expression
        </div>
      ) : null}
      {cronMessage && cronMessage?.valid ? (
        <div style={{ color: 'var(--primary' }}>Runs {cronMessage.message.toLowerCase()} </div>
      ) : null}
      {cronMessage && !cronMessage?.valid ? <div style={{ color: 'var(--danger' }}>{cronMessage.message} </div> : null}
    </>
  );

  //Schedule options
  const schedulingOptions = [
    { label: 'Daily', value: 'daily', component: dailyBreakDown },
    { label: 'Weekly', value: 'weekly', component: weeklyBreakDown },
    { label: 'Monthly', value: 'monthly', component: monthlyBreakDown },
    { label: 'Yearly', value: 'yearly', component: yearlyBreakDown },
    { label: 'Cron', value: 'cron', component: cronInputAndValidation },
  ];

  const selectedComponent = schedulingOptions.find(
    (option) => option.value === intermittentScheduling.frequency
  )?.component;

  // Weeks and day tag content
  const weeksAndDayTagContent = (weeks, day) => {
    const weeksLabel = weeks.map((week) => getWeekLabel(week)).join(', ');
    return `${weeksLabel} ${getDayLabel(day)}`;
  };

  // Remove schedule from selected schedule details when tag is closed
  const removeSchedule = (scheduleId) => {
    setCompleteSchedule((prev) => prev.filter((schedule) => schedule.id !== scheduleId));
  };

  return (
    <>
      <div className="schedule-selector">
        <div className="schedule-options">
          <Radio.Group
            onChange={(e) => handlingSchedulingOptionChange(e)}
            value={intermittentScheduling.frequency}
            defaultValue={intermittentScheduling.frequency}>
            <Space direction="vertical">
              {schedulingOptions.map((schedule) => (
                <Radio key={schedule.value} value={schedule.value}>
                  {schedule.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>
        <div className="selected-component">
          {selectedComponent}

          {completeSchedule.length > 0 ? (
            <div style={{ marginTop: '10px', borderTop: '1px solid  #dadada', paddingTop: '10px' }}>
              {completeSchedule.map((schedule) => (
                <Tag
                  color="blue"
                  key={uuidv4()}
                  closable
                  style={{ marginBottom: '2px' }}
                  onClose={() => removeSchedule(schedule.id)}>
                  {schedule.scheduleBy === 'month-date'
                    ? `${getMonthLabel(schedule.month)} - ${getDateLabel(schedule.date)} `
                    : null}
                  {schedule.scheduleBy === 'week-day-month'
                    ? `${getWeekLabel(schedule.week)} ${getDayLabel(schedule.day)} of ${getMonthLabel(schedule.month)}`
                    : null}
                  {schedule.scheduleBy === 'weeks-day' ? weeksAndDayTagContent(schedule.weeks, schedule.day) : null}
                </Tag>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default SchedulePicker;
