import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Radio, Space, Checkbox, Select, Tag, Form } from 'antd';
import cronstrue from 'cronstrue';

import styles from './jobMonitoring.module.css';

import {
  daysOfWeek,
  weeks,
  months,
  daysOfMonth,
  getDayLabel,
  getMonthLabel,
  getDateLabel,
  getWeekLabel,
} from '../../common/scheduleOptions';

const dailyRunWindowAndIntervals = [
  { label: 'All day (00:00 - 23:59)', value: 'daily' },
  { label: 'Morning (00:00 - 11:59)', value: 'morning' },
  { label: 'Afternoon (12:00 - 23:59)', value: 'afternoon' },
  { label: 'Overnight (Prev day 12:00 - Current day 12:00)', value: 'overnight' },
];

const weeklyRunWindow = [
  { label: 'Any time (00:00 - 23:59)', value: 'daily' },
  { label: 'Morning (00:00 - 11:59)', value: 'morning' },
  { label: 'Afternoon (12:00 - 23:59)', value: 'afternoon' },
  { label: 'Overnight (Prev  12:00 - Current Day 12:00)', value: 'overnight' },
];

const parseCron = (cron: string | null) => {
  if (!cron) return null;
  try {
    const explanation = cronstrue.toString(cron);
    return { valid: true, message: explanation };
  } catch (err) {
    return { valid: false, message: err };
  }
};

interface Props {
  intermittentScheduling: any;
  setIntermittentScheduling: (v: any) => void;
  completeSchedule: any[];
  setCompleteSchedule: (v: any[] | ((p: any[]) => any[])) => void;
  cron?: string | null;
  setCronMessage: (v: any) => void;
  isEditing?: boolean;
}

const SchedulePicker: React.FC<Props> = ({
  intermittentScheduling,
  setIntermittentScheduling,
  completeSchedule,
  setCompleteSchedule,
  cron,
  setCronMessage,
  isEditing,
}) => {
  const [yearlyRadio, setYearlyRadio] = useState<string | null>(null);
  const [monthlyRadio, setMonthlyRadio] = useState<string | null>(null);
  const [individualValues, setIndividualValues] = useState<any>({});

  useEffect(() => {
    if (isEditing) {
      if (!completeSchedule || completeSchedule.length < 1) return;
      const existingSchedule = completeSchedule[0];

      if (existingSchedule.scheduleBy === 'dates') {
        setIndividualValues((prev: any) => ({ ...prev, dates: existingSchedule.dates }));
        setMonthlyRadio('1');
      } else if (existingSchedule.scheduleBy === 'weeks-day') {
        setMonthlyRadio('2');
      } else if (existingSchedule.scheduleBy === 'month-date') {
        setYearlyRadio('1');
      } else if (existingSchedule.scheduleBy === 'week-day-month') {
        setYearlyRadio('2');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  useEffect(() => {
    return () => {
      setYearlyRadio(null);
      setMonthlyRadio(null);
    };
  }, []);

  useEffect(() => {
    const parsedCron = parseCron(cron || null);
    setCronMessage(parsedCron);
  }, [cron, setCronMessage]);

  const addSchedule = () => {
    intermittentScheduling.id = uuidv4();
    setCompleteSchedule((prev: any[]) => [...prev, { ...intermittentScheduling }]);
    if (intermittentScheduling.scheduleBy === 'month-date' && intermittentScheduling.frequency === 'yearly') {
      setIndividualValues((prev: any) => ({ ...prev, radio1_month: null, radio1_date: null }));
      setIntermittentScheduling((prev: any) => ({ frequency: prev.frequency, scheduleBy: 'month-date' }));
    }
    if (intermittentScheduling.scheduleBy === 'week-day-month' && intermittentScheduling.frequency === 'yearly') {
      setIndividualValues((prev: any) => ({ ...prev, radio2_month: null, radio2_day: null, radio2_week: null }));
      setIntermittentScheduling((prev: any) => ({ frequency: prev.frequency, scheduleBy: 'week-day-month' }));
    }
    if (intermittentScheduling.scheduleBy === 'weeks-day' && intermittentScheduling.frequency === 'monthly') {
      setIndividualValues((prev: any) => ({ ...prev, weeks: [], day: null }));
      setIntermittentScheduling((prev: any) => ({ frequency: prev.frequency, scheduleBy: 'weeks-day' }));
    }
  };

  const handlingSchedulingOptionChange = (e: any) => {
    const selected = e.target.value;
    setYearlyRadio(null);
    setMonthlyRadio(null);
    setCompleteSchedule([]);
    setIndividualValues({});
    if (selected === 'cron') {
      setIntermittentScheduling({ frequency: selected });
    } else if (selected === 'anytime') {
      setIntermittentScheduling({ frequency: selected, runWindow: null });
    } else {
      setIntermittentScheduling({ frequency: selected, runWindow: 'daily' });
    }
  };

  const anytime = (
    <div style={{ margin: '0px 0 0 20px', color: 'var(--secondary)' }}>
      This job does not have a fixed schedule and can run at any time.{' '}
    </div>
  );

  const dailyBreakDown = (
    <div>
      <Radio checked>Daily run window</Radio>
      <div style={{ margin: '5px 0 0 20px', color: 'var(--secondary)', width: '100%' }}>
        <Select
          size="small"
          style={{ width: '100%' }}
          value={intermittentScheduling?.runWindow}
          onChange={value => setIntermittentScheduling((prev: any) => ({ ...prev, runWindow: value }))}>
          {dailyRunWindowAndIntervals.map(option => (
            <Select.Option value={option.value} key={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      </div>
      <div style={{ margin: '0px 0 0 20px', color: 'var(--secondary)' }}>
        Note: For weekends / weekdays select Weekly option
      </div>
    </div>
  );

  const weeklyBreakDown = (
    <div>
      <Form.Item label="Runs every week on" required></Form.Item>
      <div style={{ margin: '-10px 0 0 10px' }}>
        <Checkbox.Group
          options={daysOfWeek.map(day => ({ label: day.shortLabel, value: day.value }))}
          value={intermittentScheduling.days}
          onChange={checkedValues => {
            setIntermittentScheduling((prev: any) => ({ ...prev, days: checkedValues }));
          }}
        />
      </div>

      <Form.Item label="Run window" required></Form.Item>
      <div style={{ margin: '-10px 0 0 10px' }}>
        <Select
          size="small"
          style={{ width: '70%' }}
          value={intermittentScheduling?.runWindow || 'daily'}
          onChange={value => setIntermittentScheduling((prev: any) => ({ ...prev, runWindow: value }))}>
          {weeklyRunWindow.map(option => (
            <Select.Option value={option.value} key={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );

  const monthlyBreakDown = (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Form.Item label="Runs every month" required></Form.Item>
      <span style={{ marginTop: '-10px' }}>
        <Radio
          value="1"
          checked={monthlyRadio === '1'}
          onChange={() => {
            setMonthlyRadio('1');
            setIndividualValues({});
            setIntermittentScheduling((prev: any) => ({ frequency: prev.frequency, scheduleBy: 'dates' }));
            setCompleteSchedule([]);
          }}>
          On{' '}
        </Radio>
        <Select
          options={daysOfMonth}
          style={{ minWidth: '245px', maxWidth: '530px' }}
          disabled={monthlyRadio !== '1'}
          size="small"
          placeholder="date(s)"
          maxTagCount={5}
          maxTagPlaceholder={omittedValues => <span> + {omittedValues.length} more</span>}
          mode="multiple"
          value={individualValues?.dates}
          onChange={values => {
            setIndividualValues((prev: any) => ({ ...prev, dates: values }));
            setIntermittentScheduling((prev: any) => ({ ...prev, dates: values }));
          }}></Select>
      </span>
      <span style={{ marginTop: '10px' }}>
        <Radio
          value="2"
          checked={monthlyRadio === '2'}
          onChange={() => {
            setMonthlyRadio('2');
            setIndividualValues({ dates: [], weeks: [], day: null });
            setIntermittentScheduling((prev: any) => ({ frequency: prev.frequency, scheduleBy: 'weeks-day' }));
            setCompleteSchedule([]);
          }}>
          On
        </Radio>
        <Select
          size="small"
          mode="multiple"
          disabled={monthlyRadio !== '2'}
          maxTagCount={2}
          maxTagPlaceholder={omittedValues => <span> + {omittedValues.length} more</span>}
          options={weeks}
          placeholder="week(s)"
          style={{ minWidth: '140px', maxWidth: '440px' }}
          value={individualValues?.weeks}
          onChange={values => {
            setIndividualValues((prev: any) => ({ ...prev, weeks: values }));
            setIntermittentScheduling((prev: any) => ({ ...prev, weeks: values }));
          }}></Select>
        <Select
          style={{ minWidth: '100px', marginLeft: '5px' }}
          size="small"
          disabled={monthlyRadio !== '2'}
          options={daysOfWeek}
          placeholder="day"
          value={individualValues?.day}
          onChange={value => {
            setIndividualValues((prev: any) => ({ ...prev, day: value }));
            setIntermittentScheduling((prev: any) => ({ ...prev, day: value }));
          }}></Select>
        {individualValues?.weeks?.length > 0 && individualValues?.day ? (
          <span className={styles.schedularSelector__addMoreBtn} onClick={addSchedule}>
            Add more
          </span>
        ) : null}
      </span>
      <Form.Item label="Run window" required></Form.Item>
      <Select
        style={{ marginTop: '-10px' }}
        size="small"
        value={intermittentScheduling?.runWindow || 'daily'}
        onChange={value => setIntermittentScheduling((prev: any) => ({ ...prev, runWindow: value }))}>
        {weeklyRunWindow.map(option => (
          <Select.Option value={option.value} key={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
    </div>
  );

  const yearlyBreakDown = (
    <div>
      <Form.Item label="Runs every year" required></Form.Item>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '-15px' }}>
        <span>
          <Radio
            style={{ marginTop: '5px' }}
            value="1"
            checked={yearlyRadio === '1'}
            onChange={() => {
              setYearlyRadio('1');
              setIndividualValues({});
              setIntermittentScheduling((prev: any) => ({ frequency: prev.frequency, scheduleBy: 'month-date' }));
              setCompleteSchedule([]);
            }}>
            On
          </Radio>
          <Select
            options={months}
            placeholder="month"
            style={{ width: '180px' }}
            value={individualValues.radio1_month}
            size="small"
            disabled={yearlyRadio !== '1'}
            onChange={(_value, option: any) => {
              setIndividualValues((prev: any) => ({ ...prev, radio1_month: option.value }));
              setIntermittentScheduling((prev: any) => ({ ...prev, month: option.value }));
            }}
          />{' '}
          <Select
            size="small"
            options={daysOfMonth}
            style={{ width: '160px', marginLeft: '10px' }}
            placeholder="date"
            value={individualValues.radio1_date}
            disabled={yearlyRadio !== '1'}
            onChange={(_value, option: any) => {
              setIndividualValues((prev: any) => ({ ...prev, radio1_date: option.value }));
              setIntermittentScheduling((prev: any) => ({ ...prev, date: option.value }));
            }}
          />
          {individualValues.radio1_month && individualValues.radio1_date ? (
            <span className={styles.schedularSelector__addMoreBtn} onClick={addSchedule}>
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
              setIntermittentScheduling((prev: any) => ({ frequency: prev.frequency, scheduleBy: 'week-day-month' }));
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
            onChange={(_value, option: any) => {
              setIndividualValues((prev: any) => ({ ...prev, radio2_week: option.value }));
              setIntermittentScheduling((prev: any) => ({ ...prev, week: option.value }));
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
            onChange={(_value, option: any) => {
              setIndividualValues((prev: any) => ({ ...prev, radio2_day: option.value }));
              setIntermittentScheduling((prev: any) => ({ ...prev, day: option.value }));
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
            onChange={(_value, option: any) => {
              setIndividualValues((prev: any) => ({ ...prev, radio2_month: option.value }));
              setIntermittentScheduling((prev: any) => ({ ...prev, month: option.value }));
            }}
          />
          {individualValues.radio2_month && individualValues.radio2_day && individualValues.radio2_week ? (
            <span className={styles.schedularSelector__addMoreBtn} onClick={addSchedule}>
              Add more
            </span>
          ) : null}
        </span>

        <Form.Item label="Run window" required></Form.Item>
        <Select
          style={{ marginTop: '-10px' }}
          size="small"
          value={intermittentScheduling?.runWindow || 'daily'}
          onChange={value => setIntermittentScheduling((prev: any) => ({ ...prev, runWindow: value }))}>
          {weeklyRunWindow.map(option => (
            <Select.Option value={option.value} key={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );

  const schedulingOptions = [
    { label: 'Anytime', value: 'anytime', component: anytime },
    { label: 'Daily', value: 'daily', component: dailyBreakDown },
    { label: 'Weekly', value: 'weekly', component: weeklyBreakDown },
    { label: 'Monthly', value: 'monthly', component: monthlyBreakDown },
    { label: 'Yearly', value: 'yearly', component: yearlyBreakDown },
  ];

  const selectedComponent = schedulingOptions.find(
    option => option.value === intermittentScheduling.frequency
  )?.component;

  const weeksAndDayTagContent = (weeksParam: any[], day: any) => {
    const weeksLabel = weeksParam.map(week => getWeekLabel(week)).join(', ');
    return `${weeksLabel} ${getDayLabel(day)}`;
  };

  const removeSchedule = (scheduleId: any) => {
    setCompleteSchedule((prev: any[]) => prev.filter(schedule => schedule.id !== scheduleId));
  };

  return (
    <>
      <div className={styles.scheduleSelector}>
        <div>
          <Radio.Group
            onChange={e => handlingSchedulingOptionChange(e)}
            value={intermittentScheduling.frequency}
            defaultValue={intermittentScheduling.frequency}>
            <Space direction="vertical">
              {schedulingOptions.map(schedule => (
                <Radio key={schedule.value} value={schedule.value}>
                  {schedule.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>
        <div className={styles.selectedComponent}>
          {selectedComponent}

          {completeSchedule.length > 0 && completeSchedule[0].scheduleBy !== 'dates' ? (
            <div style={{ marginTop: '10px', borderTop: '1px solid  #dadada', paddingTop: '10px' }}>
              {completeSchedule.map(schedule => (
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
};

export default SchedulePicker;
