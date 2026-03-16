import { DatePicker, Radio, Space } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export type TimePreset = 'today' | '7d' | '30d' | '90d' | 'custom';

interface TimeRangeSelectorProps {
  preset: TimePreset;
  startDate: Dayjs;
  endDate: Dayjs;
  onPresetChange: (preset: TimePreset) => void;
  onRangeChange: (start: Dayjs, end: Dayjs) => void;
}

export default function TimeRangeSelector({
  preset,
  startDate,
  endDate,
  onPresetChange,
  onRangeChange,
}: TimeRangeSelectorProps) {
  const handlePreset = (val: TimePreset) => {
    onPresetChange(val);
    const now = dayjs();
    switch (val) {
      case 'today':
        onRangeChange(now.startOf('day'), now.endOf('day'));
        break;
      case '7d':
        onRangeChange(now.subtract(6, 'day').startOf('day'), now.endOf('day'));
        break;
      case '30d':
        onRangeChange(now.subtract(29, 'day').startOf('day'), now.endOf('day'));
        break;
      case '90d':
        onRangeChange(now.subtract(89, 'day').startOf('day'), now.endOf('day'));
        break;
      default:
        break;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CalendarOutlined style={{ color: '#9ca3af', fontSize: 16 }} />
        <span style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>Time Range</span>
      </div>
      <Radio.Group
        value={preset}
        onChange={e => handlePreset(e.target.value as TimePreset)}
        optionType="button"
        buttonStyle="solid"
        size="small">
        <Radio.Button value="today">Today</Radio.Button>
        <Radio.Button value="7d">7 Days</Radio.Button>
        <Radio.Button value="30d">30 Days</Radio.Button>
        <Radio.Button value="90d">90 Days</Radio.Button>
        <Radio.Button value="custom">Custom</Radio.Button>
      </Radio.Group>
      {preset === 'custom' && (
        <Space>
          <RangePicker
            value={[startDate, endDate]}
            onChange={dates => {
              if (dates && dates[0] && dates[1]) {
                onRangeChange(dates[0], dates[1]);
              }
            }}
            size="small"
            style={{ maxWidth: 280 }}
            allowClear={false}
          />
        </Space>
      )}
      <span style={{ color: '#9ca3af', fontSize: 11, marginLeft: 'auto' }}>
        {startDate.format('MMM D, YYYY')} &ndash; {endDate.format('MMM D, YYYY')}
      </span>
    </div>
  );
}
