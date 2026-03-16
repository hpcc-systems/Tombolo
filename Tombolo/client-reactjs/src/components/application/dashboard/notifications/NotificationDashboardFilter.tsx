import React, { useState } from 'react';
import { DatePicker, Button, Slider, Modal } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface DashboardFilter {
  days: number;
  range: any;
  filterLabel: string;
  filterBy?: string;
}

interface Props {
  dashBoardFilter: DashboardFilter;
  setDashBoardFilter: (updater: (prev: DashboardFilter) => DashboardFilter) => void;
}

const NotificationDashboardFilter: React.FC<Props> = ({ dashBoardFilter, setDashBoardFilter }) => {
  const [visible, setVisible] = useState(false);
  const past60Days = dayjs().subtract(60, 'days');

  const handleNumberChange = (value: number) => {
    setDashBoardFilter(prev => ({
      ...prev,
      days: value,
      filterBy: 'days',
      filterLabel: `Last ${value === 1 ? '24 hours' : `${value} days`}`,
    }));
  };

  const handleDateChange = (dates: any) => {
    if (!dates) return;
    const startDate = dates[0].format('MM/DD/YY');
    const endDate = dates[1].format('MM/DD/YY');
    setDashBoardFilter(prev => ({
      ...prev,
      range: dates,
      filterBy: 'range',
      filterLabel: `${startDate} - ${endDate}`,
    }));
  };

  return (
    <>
      <Button
        type="primary"
        ghost
        icon={<FilterOutlined />}
        onClick={() => {
          setVisible(true);
        }}>
        {dashBoardFilter.filterLabel}
      </Button>
      {visible && (
        <Modal
          open={visible}
          mask={false}
          maskClosable={true}
          footer={null}
          closable={false}
          onCancel={() => setVisible(false)}
          style={{ top: '100px', right: '20px', position: 'absolute' }}>
          <>
            <div style={{ fontWeight: 'bold' }}>Days</div>
            <Slider
              defaultValue={dashBoardFilter.days}
              min={1}
              max={60}
              keyboard={true}
              autoFocus={true}
              onChange={handleNumberChange}
              tooltip={{ open: visible && dashBoardFilter.filterBy === 'days', formatter: value => `${value}` }}
            />
          </>
          <>
            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}> Range </div>
            <DatePicker.RangePicker
              defaultValue={dashBoardFilter.range}
              onChange={handleDateChange}
              disabledDate={current =>
                !current || current.isBefore(past60Days) || current.isAfter(dayjs().endOf('day'))
              }
              style={{ width: '100%' }}
            />
          </>
        </Modal>
      )}
    </>
  );
};

export default NotificationDashboardFilter;
