import React, { useMemo } from 'react';
import { Card, Empty, Table, Tabs, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { WorkUnitFileEntry } from '@tombolo/shared';

interface Props {
  inputFiles: WorkUnitFileEntry[];
  outputFiles: WorkUnitFileEntry[];
}

type FileRow = WorkUnitFileEntry & { key: string };

const buildRows = (files: WorkUnitFileEntry[], prefix: string): FileRow[] =>
  files.map((file, index) => ({
    ...file,
    key: `${prefix}-${index}-${file.fileName}`,
  }));

const columns: ColumnsType<FileRow> = [
  {
    title: 'File Name',
    dataIndex: 'fileName',
    key: 'fileName',
    ellipsis: true,
  },
  {
    title: 'Is Super File',
    dataIndex: 'isSuperFile',
    key: 'isSuperFile',
    width: 140,
    render: (value: boolean) => (value ? <Tag color="blue">Yes</Tag> : <Tag>No</Tag>),
  },
];

const FilesPanel: React.FC<Props> = ({ inputFiles, outputFiles }) => {
  const inputRows = useMemo(() => buildRows(inputFiles, 'input'), [inputFiles]);
  const outputRows = useMemo(() => buildRows(outputFiles, 'output'), [outputFiles]);

  const renderTable = (rows: FileRow[], emptyMessage: string) =>
    rows.length > 0 ? (
      <Table<FileRow> size="small" columns={columns} dataSource={rows} pagination={false} scroll={{ y: 360 }} />
    ) : (
      <Empty description={emptyMessage} image={Empty.PRESENTED_IMAGE_SIMPLE} />
    );

  return (
    <Card size="small">
      <Tabs
        size="small"
        defaultActiveKey="input"
        items={[
          {
            key: 'input',
            label: `Input files (${inputRows.length})`,
            children: renderTable(inputRows, 'No input files found for this workunit'),
          },
          {
            key: 'output',
            label: `Output files (${outputRows.length})`,
            children: renderTable(outputRows, 'No output files found for this workunit'),
          },
        ]}
      />
    </Card>
  );
};

export default FilesPanel;
