import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Select, Space, message } from 'antd';
import { threeColformItemLayout } from '../../common/CommonUtil.js';
import Text, { i18n } from '../../common/Text.jsx';

const monthMap = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
};
const monthAbbrMap = {
  JAN: 'January',
  FEB: 'February',
  MAR: 'March',
  APR: 'April',
  MAY: 'May',
  JUN: 'June',
  JUL: 'July',
  AUG: 'August',
  SEP: 'September',
  OCT: 'October',
  NOV: 'November',
  DEC: 'December',
};
const dayMap = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};
const dayAbbrMap = {
  SUN: 'Sunday',
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
};
const _minutes = [...Array(60).keys()]; // [1,2,3...59]
const _hours = [...Array(24).keys()]; // [1,2,3...23]
const _dayOfMonth = [...Array(32).keys()]; // [1,2,3...31]

let scheduleCronParts = { minute: [], hour: [], 'day-of-month': [], month: [], 'day-of-week': [] };

let cronExamples = [];

const ScheduleTab = ({ nodes, selectedAsset, addToSchedule, readOnly, editingAllowed }) => {
  const [options, setOptions] = useState({
    loading: false,
    enableEdit: false,
    scheduleMinute: '*',
    scheduleHour: '*',
    scheduleDayMonth: '*',
    scheduleMonth: '*',
    scheduleDayWeek: '*',
    type: '', // Time | Predecessor | Template | ''
    dependsOn: [], // assetId[]
    predecessors: [], // all nodes[]
  });

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
            return e(schedule, generateDate(utcFullYear, utcMonth - 1, utcDate, utcHour, utcMinute + 1), ++counter);
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

    if (term.startsWith('*/0')) return '';

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
      // eslint-disable-next-line no-constant-condition
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
        // eslint-disable-next-line no-case-declarations
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
      type: options.type, // Predecessor | Time | Template | ""
      cron: options.type === 'Time' ? cronExpression : '', // string
      dependsOn: options.dependsOn, // [assetId] | [] - cant be job | template
    };

    const defaultExpression = '* * * * *';

    try {
      if (schedule.type === 'Time' && schedule.cron === defaultExpression)
        throw new Error('Please provide cron expression');
      if (schedule.type === 'Predecessor' && schedule.dependsOn?.length === 0)
        throw new Error('Please select a job to run after');
      if (schedule.type === 'Template' && schedule.dependsOn?.length === 0)
        throw new Error('Please select a File Monitoring Template to run after');

      addToSchedule(schedule); // will trigger method to update node view on a graph
      await new Promise((r) => setTimeout(r, 1000)); // sometime graph takes time to update nodes, we will wait extra second to let it finish;
      setOptions((prev) => ({ ...prev, enableEdit: false, loading: false }));
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
    return allPredecessors.filter((predecessor) => {
      if (selectedPredecessor.includes(predecessor.jobId)) return true;
      if (selectedPredecessor.includes(predecessor.templateId)) return true;
      return false;
    });
  };

  const handleChangeInput = (event) => {
    event.persist();
    setOptions((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleEdit = () => {
    setOptions((prev) => ({ ...prev, enableEdit: true }));
  };

  const handleScheduleTypeSelect = (type) => {
    setOptions((prev) => ({ ...prev, type, dependsOn: [] }));
  };

  useEffect(() => {
    const schedule = selectedAsset.schedule; // This value comes from node.data.schedule
    const cronParts = schedule?.cron?.split(' ') || [];

    const predecessors = nodes.reduce((acc, node) => {
      if (node.type === 'Job' && node.title !== selectedAsset?.title) {
        acc.push({ id: node.id, jobId: node.assetId, name: node.title });
      }

      // eslint-disable-next-line no-prototype-builtins
      if (node.type === 'FileTemplate' && node.title !== selectedAsset?.title && node.hasOwnProperty('isStencil')) {
        acc.push({ id: node.id, templateId: node.assetId, name: node.title });
      }

      return acc;
    }, []);

    setOptions((prev) => ({
      ...prev,
      predecessors,
      type: schedule?.type || '',
      dependsOn: schedule?.dependsOn || [],
      scheduleMinute: cronParts?.[0] || '*',
      scheduleHour: cronParts?.[1] || '*',
      scheduleDayMonth: cronParts?.[2] || '*',
      scheduleMonth: cronParts?.[3] || '*',
      scheduleDayWeek: cronParts?.[4] || '*',
    }));
  }, []);

  if (!editingAllowed) readOnly = true;

  return (
    <Form component="div" {...threeColformItemLayout}>
      {options.type.length > 0 || options.enableEdit ? (
        <Form.Item label={<Text text="Type" />}>
          {!options.enableEdit ? (
            <Input className="read-only-input" disabled value={options.type ? options.type : null} />
          ) : (
            <Select
              id="scheduleType"
              disabled={!selectedAsset.isAssociated}
              placeholder={i18n('Select a schedule type')}
              allowClear
              onClear={() => handleScheduleTypeSelect('')}
              onSelect={(value) => {
                handleScheduleTypeSelect(value);
              }}
              value={options.type ? options.type : null}>
              <Select.Option value="Time">{<Text text="Timer based (run at specific interval)" />}</Select.Option>
              <Select.Option value="Predecessor">
                {<Text text="Job based (run after another job completes)" />}
              </Select.Option>
              <Select.Option value="Template">
                {<Text text="Template Based (Run when a file that matches a template arrives)" />}
              </Select.Option>
            </Select>
          )}
        </Form.Item>
      ) : (
        <div style={{ textAlign: 'center', paddingTop: '100px', paddingBottom: '10px' }}>
          {<Text text="Please press Edit button to configure scheduling for this job" />}
        </div>
      )}
      {options.type === 'Time' ? (
        <>
          <Form.Item label={<Text text="Run Every" />}>
            <Space>
              <Input
                style={{ width: '40px', padding: '2px 6px' }}
                name="scheduleMinute"
                onChange={handleChangeInput}
                value={options.scheduleMinute}
                className={options.enableEdit ? null : 'read-only-input'}
              />
              {<Text text="Minute" />},
              <Input
                style={{ width: '40px', padding: '2px 6px' }}
                name="scheduleHour"
                onChange={handleChangeInput}
                value={options.scheduleHour}
                className={options.enableEdit ? null : 'read-only-input'}
              />
              {<Text text="Hour" />},
              <Input
                style={{ width: '40px', padding: '2px 6px' }}
                name="scheduleDayMonth"
                onChange={handleChangeInput}
                value={options.scheduleDayMonth}
                className={options.enableEdit ? null : 'read-only-input'}
              />
              {<Text text="Day of Month" />},
              <Input
                style={{ width: '40px', padding: '2px 6px' }}
                name="scheduleMonth"
                onChange={handleChangeInput}
                value={options.scheduleMonth}
                className={options.enableEdit ? null : 'read-only-input'}
              />
              {<Text text="Month" />},
              <Input
                style={{ width: '40px', padding: '2px 6px' }}
                name="scheduleDayWeek"
                onChange={handleChangeInput}
                value={options.scheduleDayWeek}
                className={options.enableEdit ? null : 'read-only-input'}
              />
              {<Text text="Day of Week" />}
            </Space>
          </Form.Item>
          <Form.Item label={<Text text="Explained" />}>{generateCronExplainer()}</Form.Item>
          <Form.Item label={<Text text="Would run at" />}>
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
                <span>{<Text text="and so on..." />}</span>
              </>
            ) : null}
          </Form.Item>
        </>
      ) : null}
      {options.type === 'Predecessor' ? (
        <Form.Item label={<Text text="Run After" />}>
          {!options.enableEdit ? (
            scheduledPredecessors(options.predecessors, options.dependsOn).map((item, index) =>
              index > 0 ? ', ' + item.name : item.name
            )
          ) : (
            <Select
              id="dependsOn"
              mode="single"
              placeholder={i18n('Select Job(s) that will trigger execution')}
              onSelect={(value) => {
                let predecessors = [];
                predecessors.push(value);
                setOptions((prev) => ({ ...prev, dependsOn: predecessors }));
              }}
              value={options.dependsOn}>
              {options.predecessors
                .filter((asset) => asset.jobId)
                .map((job) => {
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
      {options.type === 'Template' ? (
        <Form.Item label={<Text text="Template" />}>
          {!options.enableEdit ? (
            scheduledPredecessors(options.predecessors, options.dependsOn).map((item, index) =>
              index > 0 ? ', ' + item.name : item.name
            )
          ) : (
            <Select
              mode="single"
              placeholder={i18n('Select a template')}
              onSelect={(value) => {
                let predecessors = [];
                predecessors.push(value);
                setOptions((prev) => ({ ...prev, dependsOn: predecessors }));
              }}
              value={options.dependsOn}>
              {options.predecessors
                .filter((assets) => assets.templateId)
                .map((template) => {
                  return (
                    <Select.Option key={template.name} value={template.templateId}>
                      {template.name}
                    </Select.Option>
                  );
                })}
            </Select>
          )}
        </Form.Item>
      ) : null}

      {readOnly ? null : (
        <Form.Item wrapperCol={{ offset: 12, span: 4 }}>
          {!options.enableEdit ? (
            <Button onClick={handleEdit} type="primary" block>
              {<Text text="Edit Schedule" />}
            </Button>
          ) : (
            <Button onClick={handleSchedule} loading={options.loading} type="primary" block>
              {<Text text="Save schedule" />}
            </Button>
          )}
        </Form.Item>
      )}
    </Form>
  );
};

export default ScheduleTab;
