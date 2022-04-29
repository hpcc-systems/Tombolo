import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Select, Space, message } from "antd";
import { authHeader } from '../../common/AuthHeader';
import { threeColformItemLayout } from "../../common/CommonUtil.js";

const monthMap = { 1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June', 7: 'July', 8: 'August', 9: 'September', 10: 'October', 11: 'November', 12: 'December', };
const monthAbbrMap = { JAN: 'January', FEB: 'February', MAR: 'March', APR: 'April', MAY: 'May', JUN: 'June', JUL: 'July', AUG: 'August', SEP: 'September', OCT: 'October', NOV: 'November', DEC: 'December', };
const dayMap = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday', };
const dayAbbrMap = { SUN: 'Sunday', MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', };
const _minutes = [...Array(60).keys()]; // [1,2,3...59]
const _hours = [...Array(24).keys()]; // [1,2,3...23]
const _dayOfMonth = [...Array(32).keys()]; // [1,2,3...31]

let scheduleCronParts = { minute: [], hour: [], 'day-of-month': [], month: [], 'day-of-week': [] };

let cronExamples = [];

const ScheduleTab = ({ nodes, dataflowId, applicationId, selectedAsset, scheduleNode, readOnly, editingAllowed }) => {
  const [options, setOptions] = useState({
    loading: false,
    enableEdit: false,
    selectedScheduleType: '',
    scheduleMinute: '*',
    scheduleHour: '*',
    scheduleDayMonth: '*',
    scheduleMonth: '*',
    scheduleDayWeek: '*',
    schedulePredecessor: [],
    predecessorJobs: [],
  });

  const handleScheduleTypeSelect = () => {
    const predecessors = nodes.reduce((acc, node) => {
      if (node.type === 'Job' && node.title !== selectedAsset?.title) {
        acc.push({ id: node.id, jobId: node.assetId, name: node.title });
      }
      return acc;
    }, []);

    setOptions((prev) => ({ ...prev, predecessorJobs: predecessors }));
  };

  const generateDate = (year, month, day, hour, minute) => new Date(year, month, day, hour, minute);

  const nextMinute = (date) => {
    var t,
      n,
      r = 0 !== (n = (t = date).getMilliseconds()) ? new Date(t.getTime() + (1e3 - n)) : t,
      o = r.getSeconds();
    return 0 !== o ? new Date(r.getTime() + 1e3 * (60 - o)) : r;
  };

  const nextDate = (schedule, date) => {
    return Object.keys(schedule).length &&
      schedule.month.length &&
      schedule['day-of-month'].length &&
      schedule['day-of-week'].length &&
      schedule.hour.length &&
      schedule.minute.length
      ? (function e(schedule, _date, counter) {
          if (127 < counter) {
            return null;
          }
          let utcMonth = _date.getMonth() + 1,
            utcFullYear = _date.getFullYear();
          if (!schedule.month.includes(utcMonth)) {
            return e(schedule, generateDate(utcFullYear, utcMonth + 1 - 1, 1, 0, 0), ++counter);
          }
          let utcDate = _date.getDate(),
            utcDay = _date.getDay(),
            s = schedule['day-of-month'].includes(utcDate),
            c = schedule['day-of-week'].includes(utcDay);
          if (!s || !c) {
            return e(schedule, generateDate(utcFullYear, utcMonth - 1, utcDate + 1, 0, 0), ++counter);
          }
          let utcHour = _date.getHours();
          if (!schedule.hour.includes(utcHour)) {
            return e(schedule, generateDate(utcFullYear, utcMonth - 1, utcDate, utcHour + 1, 0), ++counter);
          }
          let utcMinute = _date.getMinutes();
          if (schedule.minute.includes(utcMinute)) {
            return _date;
          } else {
            return e(
              schedule,
              generateDate(utcFullYear, utcMonth - 1, utcDate, utcHour, utcMinute + 1),
              ++counter
            );
          }
        })(schedule, nextMinute(date), 1)
      : null;
  };

  const generateCronExplainer = () => {
    let msg = '',
      // minMatches = [],
      // hrMatches = [],
      date = new Date();

    msg += generateCronTerm(options.scheduleMinute, 'minute');
    msg += generateCronTerm(options.scheduleHour, 'hour');
    msg += generateCronTerm(options.scheduleDayMonth, 'day-of-month');
    msg += generateCronTerm(options.scheduleDayWeek, 'day-of-week');
    msg += generateCronTerm(options.scheduleMonth, 'month');

    cronExamples = [];

    // let lastDate = date;

    for (let i = 0; i < 3; i++) {
      if (date) {
        date = nextDate(scheduleCronParts, new Date(date.getTime() + 1));
        cronExamples.push(date);
      }
    }

    return msg + (msg !== '' ? '.' : '');
  };

  const generateCronTerm = (term, type) => {
    let msg = '',
      matches = [];

    if (term.match(new RegExp(/^\*$/gm))) {
      msg += matchAsteriskCronTerm(type);
    } else if (
      (matches = term.match(
        new RegExp(/^JAN|FEB|MAR|APR|MAY|JU[NL]|AUG|SEP|OCT|NOV|DEC|MON|TUE|WED|THU|FRI|SAT|SUN$/gm)
      ))
    ) {
      if (matches.length > 0) {
        msg += matchAbbrCronTerm(matches, type);
      }
    } else if ((matches = term.match(new RegExp(/^\d+$/gm)))) {
      if (matches.length > 0) {
        msg += matchDigitsCronTerm(matches, type);
      }
    } else if ((matches = term.match(new RegExp(/^(\d+,)+\d+$/gm)))) {
      if (matches.length > 0) {
        msg += matchCommaCronTerm(matches, type);
      }
      // eslint-disable-next-line no-useless-escape
    } else if ((matches = term.match(new RegExp(/^\d+\-\d+/gm)))) {
      if (matches.length > 0) {
        msg += matchRangeCronTerm(matches, type);
      }
    } else if ((matches = [...term.matchAll(new RegExp(/^\*\s*\/\s*(\d+)/gm))])) {
      if (matches.length > 0) {
        msg += matchStepCronTerm(matches, type);
      }
    }

    return msg;
  };

  const matchAsteriskCronTerm = (type) => {
    switch (type) {
      case 'minute':
        scheduleCronParts['minute'] = _minutes;
        return 'Every minute';
      case 'hour':
        scheduleCronParts['hour'] = _hours;
        return '';
      case 'day-of-month':
        scheduleCronParts['day-of-month'] = _dayOfMonth;
        return '';
      case 'month':
        scheduleCronParts['month'] = Object.keys(monthMap).map((n) => Number(n));
        return '';
      case 'day-of-week':
        scheduleCronParts['day-of-week'] = Object.keys(dayMap)
          .filter((n) => n < 7)
          .map((n) => Number(n));
        return '';
      default:
        return;
    }
  };

  const matchDigitsCronTerm = (matches, type) => {
    switch (type) {
      case 'minute':
        scheduleCronParts['minute'] = [Number(matches[0])];
        return `At ${type} ${matches[0]}`;
      case 'hour':
        scheduleCronParts['hour'] = [Number(matches[0])];
        return ` past ${type} ${matches[0]}`;
      case 'day-of-month':
        scheduleCronParts['day-of-month'] = [Number(matches[0])];
        return ` on ${type} ${matches[0]}`;
      case 'month':
        scheduleCronParts['month'] = [Number(matches[0])];
        return ` in ${monthMap[matches[0]]}`;
      case 'day-of-week':
        scheduleCronParts['day-of-week'] = [Number(matches[0])];
        return ` on ${dayMap[matches[0]]}`;
      default:
        return;
    }
  };

  const matchCommaCronTerm = (matches, type) => {
    let values = matches[0].split(','),
      lastVal = values.pop();

    switch (type) {
      case 'minute':
        scheduleCronParts['minute'] = [...values, lastVal].map((n) => Number(n));
        return `At ${type} ${values.join(', ')}, and ${lastVal}`;
      case 'hour':
        scheduleCronParts['hour'] = [...values, lastVal].map((n) => Number(n));
        return ` past ${type} ${values.join(', ')}, and ${lastVal}`;
      case 'day-of-month':
        scheduleCronParts['day-of-month'] = [...values, lastVal].map((n) => Number(n));
        return ` on ${type} ${values.join(', ')}, and ${lastVal}`;
      case 'month':
        scheduleCronParts['month'] = [...values, lastVal].map((n) => Number(n));
        return ` in ${values.map((v) => monthMap[v]).join(', ')}, and ${monthMap[lastVal]}`;
      case 'day-of-week':
        scheduleCronParts['day-of-week'] = [...values, lastVal].map((n) => Number(n));
        return ` on ${values.map((v) => dayMap[v]).join(', ')}, and ${dayMap[lastVal]}`;
      default:
        return;
    }
  };

  const matchRangeCronTerm = (matches, type) => {
    let msg = '',
      values = matches[0].split('-');

    switch (type) {
      case 'minute':
        scheduleCronParts['minute'] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += 'At every ';
        break;
      case 'hour':
        scheduleCronParts['hour'] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += ' past every ';
        break;
      case 'day-of-month':
        scheduleCronParts['day-of-month'] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += ' on every ';
        break;
      case 'month':
        scheduleCronParts['month'] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += ' in every ';
        values = values.map((v) => monthMap[v]);
        break;
      case 'day-of-week':
        scheduleCronParts['day-of-week'] = (() => {
          let arr = [];
          for (let i = values[0]; i <= values[1]; i++) {
            arr.push(Number(i));
          }
          return arr;
        })();
        msg += ' on every ';
        values = values.map((v) => dayMap[v]);
        break;
      default:
        return;
    }

    msg += type + ' from ' + values.join(' through ');
    return msg;
  };

  const matchStepCronTerm = (matches, type) => {
    let msg = '',
      lastVal = matches[0][matches.length],
      lastValNum = parseInt(lastVal),
      steps = [],
      stepMax = 0;

    switch (type) {
      case 'minute':
        scheduleCronParts['minute'] = steps;
        stepMax = 59;
        msg += 'Every ';
        break;
      case 'hour':
        scheduleCronParts['hour'] = steps;
        stepMax = 23;
        msg += ' past every ';
        break;
      case 'day-of-month':
        scheduleCronParts['day-of-month'] = steps;
        stepMax = 31;
        let currentMonth = new Date().getMonth() + 1,
          currentYear = new Date().getFullYear();
        if (currentMonth % 2 === 0) {
          stepMax = 30;
        } else if (currentMonth === 2) {
          if (currentYear % 4 === 0) {
            stepMax = 29;
          } else {
            stepMax = 28;
          }
        }
        msg += ' on every ';
        break;
      case 'month':
        scheduleCronParts['month'] = steps;
        stepMax = 11;
        msg += ' in every ';
        break;
      case 'day-of-week':
        scheduleCronParts['day-of-week'] = steps;
        stepMax = 6;
        msg += ' on every ';
        break;
      default:
        return;
    }

    for (let i = 0, j = lastValNum, k = stepMax; i <= k; i += j) {
      steps.push(i);
    }

    switch (20 < lastValNum ? lastValNum % 10 : lastValNum) {
      case 1:
        msg += lastVal + 'st ';
        break;
      case 2:
        msg += lastVal + 'nd ';
        break;
      case 3:
        msg += lastVal + 'rd ';
        break;
      default:
        msg += lastVal + 'th ';
    }
    msg += type;
    return msg;
  };

  const matchAbbrCronTerm = (matches, type) => {
    const settings = {
      month: ` in ${monthAbbrMap[matches[0]]}`,
      'day-of-week': `${options.scheduleDayMonth !== '*' ? ' and ' : ''} on ${dayAbbrMap[matches[0]]}`,
    };
    return settings[type] || '';
  };

  const joinCronTerms = () => ({
    minute: options.scheduleMinute,
    hour: options.scheduleHour,
    dayMonth: options.scheduleDayMonth,
    month: options.scheduleMonth,
    dayWeek: options.scheduleDayWeek,
  });

  const handleSchedule = async () => {
    setOptions((prev) => ({ ...prev, loading: true }));
    const { minute, hour, dayMonth, month, dayWeek } = joinCronTerms();
    const cronExpression = `${minute} ${hour} ${dayMonth} ${month} ${dayWeek}`;

    const schedule = {
      type: options.selectedScheduleType, // Predecessor | Time | ""
      cron: options.selectedScheduleType === 'Time' ? cronExpression : '', // string |
      dependsOnJob: options.schedulePredecessor, // [jobId] - can be many jobs ?
    };

    const defaultExpression = '* * * * *';

    try {
      if (schedule.type === 'Time' && schedule.cron === defaultExpression)
        throw new Error('Please provide cron expression');
      if (schedule.type === 'Predecessor' && schedule.dependsOnJob?.length === 0)
        throw new Error('Please select a job to run after');
      // /schedule_job
      const payload = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          jobId: selectedAsset.id,
          dataflowId,
          application_id: applicationId,
          schedule: schedule,
        }),
      };
      const response = await fetch('/api/job/schedule_job', payload);

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message);
      }

      const result = await response.json();
      scheduleNode(result.schedule); // will trigger method to update node view on a graph
      await new Promise(r => setTimeout(r,1000)); // sometime graph takes time to update nodes, we will wait extra second to let it finish;
      setOptions((prev) => ({ ...prev, enableEdit: false, loading: false, }));
      message.success('Job schedule saved');
    } catch (error) {
      console.log('-error-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
      setOptions((prev) => ({ ...prev, loading: false }));
      message.error(error.message);
    }
  };

  const scheduledPredecessors = (allPredecessors, selectedPredecessor) => {
    return allPredecessors.filter((predecessor) => selectedPredecessor.includes(predecessor.jobId));
  };

  const handleChangeInput = (event) => {
    event.persist();
    setOptions((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleEdit = () => {
    setOptions((prev) => ({ ...prev, enableEdit: true }));
  };

  useEffect(() => {
    const schedule = selectedAsset.schedule;
    if (schedule) {
      const cronParts = schedule?.cron?.split(' ') || [];
      setOptions((prev) => ({
        ...prev,
        selectedScheduleType: schedule?.type || '',
        schedulePredecessor: schedule?.dependsOnJob || [],
        scheduleMinute: cronParts?.[0] || '*',
        scheduleHour: cronParts?.[1] || '*',
        scheduleDayMonth: cronParts?.[2] || '*',
        scheduleMonth: cronParts?.[3] || '*',
        scheduleDayWeek: cronParts?.[4] || '*',
      }));
      if (schedule?.type) handleScheduleTypeSelect();
    }
  }, []);

  if (!editingAllowed) readOnly = true;

  return (
    <Form component="div" {...threeColformItemLayout}>
      {options.selectedScheduleType.length > 0 || options.enableEdit ? (
        <Form.Item label="Type">
          {!options.enableEdit ? (
            <Input
              className="read-only-input"
              disabled
              value={options.selectedScheduleType ? options.selectedScheduleType : null}
            />
          ) : (
            <Select
              id="scheduleType"
              disabled={!selectedAsset.isAssociated}
              placeholder="Select a schedule type"
              allowClear
              onClear={() => setOptions((prev) => ({ ...prev, selectedScheduleType: '' }))}
              onSelect={(value) => {
                handleScheduleTypeSelect(value);
                setOptions((prev) => ({ ...prev, selectedScheduleType: value }));
              }}
              value={options.selectedScheduleType ? options.selectedScheduleType : null}>
              <Select.Option value="Time">Timer based (run at specific interval)</Select.Option>
              <Select.Option value="Predecessor">Job based (run after another job completes)</Select.Option>
              <Select.Option value="Message">
                Run on External Message (run when a message is received in a Kafka topic)
              </Select.Option>
            </Select>
          )}
        </Form.Item>
      ) : (
        <div style={{ textAlign: 'center', paddingTop: '100px', paddingBottom: '10px' }}>
          Please press <b>Edit</b> button to configure scheduling for this job
        </div>
      )}
      {options.selectedScheduleType === 'Time' ? (
        <>
          <Form.Item label="Run Every">
            <Space>
              <Input
                style={{ width: '40px', padding: '2px 6px' }}
                name="scheduleMinute"
                onChange={handleChangeInput}
                value={options.scheduleMinute}
                className={options.enableEdit ? null : 'read-only-input'}
              />
              Minute,
              <Input
                style={{ width: '40px', padding: '2px 6px' }}
                name="scheduleHour"
                onChange={handleChangeInput}
                value={options.scheduleHour}
                className={options.enableEdit ? null : 'read-only-input'}
              />
              Hour,
              <Input
                style={{ width: '40px', padding: '2px 6px' }}
                name="scheduleDayMonth"
                onChange={handleChangeInput}
                value={options.scheduleDayMonth}
                className={options.enableEdit ? null : 'read-only-input'}
              />
              Day of Month,
              <Input
                style={{ width: '40px', padding: '2px 6px' }}
                name="scheduleMonth"
                onChange={handleChangeInput}
                value={options.scheduleMonth}
                className={options.enableEdit ? null : 'read-only-input'}
              />
              Month,
              <Input
                style={{ width: '40px', padding: '2px 6px' }}
                name="scheduleDayWeek"
                onChange={handleChangeInput}
                value={options.scheduleDayWeek}
                className={options.enableEdit ? null : 'read-only-input'}
              />
              Day of Week
            </Space>
          </Form.Item>
          <Form.Item label="Explained">{generateCronExplainer()}</Form.Item>
          <Form.Item label="Would run at">
            {cronExamples.length > 0 ? (
              <>
                {cronExamples.map((d, index) => {
                  return (
                    <span key={index}>
                      <span>{d ? d.toLocaleString('en-US') : ''}</span>
                      <br />
                    </span>
                  );
                })}
                <span>and so on...</span>
              </>
            ) : null}
          </Form.Item>
        </>
      ) : null}
      {options.selectedScheduleType === 'Predecessor' ? (
        <Form.Item label="Run After">
          {!options.enableEdit ? (
            scheduledPredecessors(options.predecessorJobs, options.schedulePredecessor).map((item, index) =>
              index > 0 ? ', ' + item.name : item.name
            )
          ) : (
            <Select
              id="schedulePredecessor"
              mode="single"
              placeholder="Select Job(s) that will trigger execution"
              onSelect={(value) => {
                let predecessors = [];
                predecessors.push(value);
                setOptions((prev) => ({ ...prev, schedulePredecessor: predecessors }));
              }}
              value={options.schedulePredecessor}>
              {options.predecessorJobs.map((job) => {
                return (
                  <Select.Option key={job.name} value={job.jobId}>
                    {job.name}
                  </Select.Option>
                );
              })}
            </Select>
          )}
        </Form.Item>
      ) : null}
      {readOnly ? null :
      <Form.Item wrapperCol={{ offset: 12, span: 4 }}>
        {!options.enableEdit ? (
          <Button onClick={handleEdit} type="primary" block>
            Edit schedule
          </Button>
        ) : (
          <Button onClick={handleSchedule} loading={options.loading} type="primary" block>
            Save schedule
          </Button>
        )}
      </Form.Item>
      }
    </Form>
  );
};

export default ScheduleTab;
