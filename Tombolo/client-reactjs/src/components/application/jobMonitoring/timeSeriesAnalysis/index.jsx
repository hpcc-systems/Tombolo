import React from 'react';
import { useState, useEffect } from 'react';
import { Table, Radio, Dropdown, Menu, Popover } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';

// Local imports
import { getJobMonitoringData } from '../jobMonitoringUtils';
import '../jobMonitoring.css';
import BreadCrumbs from '../../../common/BreadCrumbs';
import { performTimeSeriesAnalysis } from './timeSeriesFunc';

// Fixed right column
const averageColumn = [
  {
    title: (
      <div style={{ textAlign: 'center' }}>
        <div>Expected Value</div>
        <div style={{ fontSize: '0.8rem' }}>( Min & Max)</div>
      </div>
    ),
    key: 'expectedMinMax',
    dataIndex: 'expectedMinMax',
    fixed: 'left',
    width: 150,
    render: (text, record) => {
      return (
        <div style={{}}>
          <span>{record['Expected Value'].min}</span>
          <span> - </span>
          <span>{record['Expected Value'].max}</span>
        </div>
      );
    },
    onCell: () => ({
      style: { backgroundColor: 'var(--active)' },
    }),
  },
];

// Z index column
const zIndexColumn = [
  {
    title: 'Z-Index',
    dataIndex: 'Z-Index',
    key: 'Z-Index',
    fixed: 'left',
    width: 150,
  },
];

// Format date from sequence number
function formatSequenceDate(sequenceNumber) {
  // Convert to string and take first 12 characters (or all if less than 12)
  let str = sequenceNumber.toString().substring(0, 12);

  // If less than 12 digits, pad with zeros on the right
  str = str.padEnd(12, '0');

  // Extract parts
  const year = str.substring(0, 4);
  const month = str.substring(4, 6);
  const day = str.substring(6, 8);
  const hours = str.substring(8, 10);
  const minutes = str.substring(10, 12);

  // Format with hyphens, space, and colon
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

const TimeSeriesAnalysis = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('id'); // Extracts `id=122`

  // States
  const [wus, setWus] = useState([]);
  const [data, setData] = useState([]);
  const [middleColumns, setMiddleColumns] = useState([]);
  const [selectedLeftWuid, setSelectedLeftWuid] = useState(null);
  const [outlierColumns, setOutlierColumns] = useState([]);
  const [leftColumns, setLeftColumns] = useState([
    {
      title: 'Metrics',
      dataIndex: 'metric',
      key: 'metric',
      render: (text) => <span style={{ fontWeight: '600' }}>{metrics[text]}</span>,
      fixed: 'left',
      width: 150,
      onCell: () => ({
        style: { backgroundColor: 'var(--secondary-light)' },
      }),
    },
  ]);

  // Fetch data when component loads
  useEffect(() => {
    if (id) {
      (async () => {
        try {
          const data = await getJobMonitoringData({ id });

          setWus(data);
          // Set the initial selected left wuid to the first item
          if (data.length > 0 && !selectedLeftWuid) {
            setSelectedLeftWuid(data[0].Wuid);
          }
        } catch (e) {
          console.log(e);
        }
      })();
    }
  }, [id]);

  // Update columns and data when wus or selectedLeft Wuid changes
  useEffect(() => {
    if (wus.length > 0) {
      const leftData = wus[0];
      const rightData = wus.slice(1);
      const analysis1 = performTimeSeriesAnalysis({ leftData, rightData });
      const { delta, expectedMinMax, outliers, zIndex } = analysis1;
      setOutlierColumns(outliers);

      // existing wus and delta and expected value
      const allWus = [
        ...wus,
        { Wuid: 'Delta', ...delta },
        { Wuid: 'Expected Value', ...expectedMinMax },
        { Wuid: 'Z-Index', ...zIndex },
      ];

      // Transform data into rows for the table
      const tableData = metricsKeys.map((metric) => {
        const row = { metric };
        allWus.forEach((item) => {
          row[item.Wuid] = item[metric];
        });
        return row;
      });

      setData(tableData);
    }
  }, [wus]);

  useEffect(() => {
    // Bring the selected workunit to the left
    setWus((prev) => {
      const selected = prev.find((wu) => wu.Wuid === selectedLeftWuid);
      if (selected) {
        return [selected, ...prev.filter((wu) => wu.Wuid !== selectedLeftWuid)];
      }
      return prev;
    });

    // pop over content
    const workUnitHiddenInfo = (wu) => {
      return (
        <div>
          <div>
            <span style={{ fontWeight: 700 }}>Job Name : </span> {wu?.Jobname}
          </div>
          <div>
            <span style={{ fontWeight: 700 }}>Cluster : </span> {wu?.Cluster}
          </div>
          <div>
            <span style={{ fontWeight: 700 }}>State :</span> {wu?.State}
          </div>
          <div>
            <span style={{ fontWeight: 700 }}>Date :</span> {formatSequenceDate(wu?.sequenceNumber)}
          </div>
        </div>
      );
    };

    // Define all dynamic columns without checkboxes first
    const dynamicColumns = wus.map((item) => ({
      title: (
        <Popover content={workUnitHiddenInfo(item)}>
          <span style={{ textDecoration: 'underline', color: 'var(--hyperLinkBlue)' }}>{item.Wuid}</span>
        </Popover>
      ),
      dataIndex: item.Wuid,
      key: item.Wuid,
      width: 180,
    }));

    // Set the additional left column with a filter icon and radio button menu
    if (dynamicColumns.length > 0 && selectedLeftWuid) {
      const selectedColumn = dynamicColumns.find((col) => col.key === selectedLeftWuid) || dynamicColumns[0];
      const filterMenu = (
        <Menu>
          <Radio.Group
            value={selectedLeftWuid}
            onChange={(e) => setSelectedLeftWuid(e.target.value)}
            style={{ padding: 8, display: 'block' }}>
            {wus.map((item) => (
              <Radio key={item.Wuid} value={item.Wuid} style={{ display: 'block', marginBottom: 8 }}>
                {item.Wuid}
              </Radio>
            ))}
          </Radio.Group>
        </Menu>
      );

      const additionalLeftColumn = {
        ...selectedColumn,
        fixed: 'left',
        className: 'additional-left-column',
        title: (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Dropdown overlay={filterMenu} trigger={['click']}>
              <FilterOutlined style={{ marginRight: 8, cursor: 'pointer', color: 'var(--dark)' }} />
            </Dropdown>
            <span>{selectedColumn.title}</span>
          </div>
        ),
        onCell: () => ({
          style: { backgroundColor: 'var(--paused)' },
        }),
      };

      // Replace the additional left column (keep only METRICS + one wuid)
      setLeftColumns([leftColumns[0], additionalLeftColumn]);
    }

    // Define middle columns with checkboxes, excluding the selected left column
    const middleDynamicColumns = dynamicColumns
      .filter((col) => col.key !== selectedLeftWuid)
      .map((col) => ({
        ...col,
        title: (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginLeft: 8 }}>{col.title}</span>
          </div>
        ),
      }));
    setMiddleColumns(middleDynamicColumns);
  }, [selectedLeftWuid]);

  // Delta Column
  const deltaColumn = [
    {
      title: (
        <div style={{ textAlign: 'center' }}>
          <div>Delta</div>
        </div>
      ),
      dataIndex: 'Delta',
      key: 'Delta',
      fixed: 'left',
      width: 150,
      onCell: (record) => {
        if (record.metric && outlierColumns.includes(record.metric.toLowerCase())) {
          return {
            style: {
              backgroundColor: 'var(--paused)',
              boxShadow: '5px 0px 15px -5px rgba(0, 0, 0, 0.3)',
              borderRight: '1px solid #ccc',
            },
          };
        }
      },
    },
  ];

  // Define the metrics you want to display
  const metrics = {
    // State: 'State',
    WarningCount: 'Warning Count',
    ErrorCount: 'Error Count',
    GraphCount: 'Graph Count',
    SourceFileCount: 'Source File Count',
    ResultCount: 'Result Count',
    TotalClusterTime: 'Total Cluster Time',
    FileAccessCost: 'File Access Cost',
    CompileCost: 'Compile Cost',
    ExecuteCost: 'Execute Cost',
  };

  // metrics keys
  const metricsKeys = Object.keys(metrics);

  return (
    <div>
      <BreadCrumbs />
      <div className="jm_time_series_analysis">
        <div className="timeSeriesAnalysis_selectedWu_info">
          <div>
            <b> Job Name: </b>
            <span>{wus[0]?.Jobname}</span>
          </div>
          <div>
            <b>Cluster :</b> <span>{wus[0]?.Cluster}</span>
          </div>
          <div>
            <b>Owner : </b>
            <span>{wus[0]?.Owner}</span>
          </div>
          <div>
            <b>Created : </b>
            <span>{wus[0]?.sequenceNumber ? formatSequenceDate(wus[0]?.sequenceNumber) : ''}</span>
          </div>
        </div>
        <Table
          size="small"
          columns={[...leftColumns, ...averageColumn, ...deltaColumn, ...zIndexColumn, ...middleColumns]}
          dataSource={data}
          rowKey="metric"
          scroll={{ x: 1500 }}
          bordered
          pagination={false}
          className="time-series-analysis-table"
        />
      </div>
    </div>
  );
};

export default TimeSeriesAnalysis;
