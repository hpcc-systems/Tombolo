import { Alert, Descriptions, Space, Tag } from 'antd';
import React from 'react';

const SuperFileMeta = ({ superFileData }) => {
  if (superFileData.error) return <Alert message={superFileData.error} type="error" showIcon closable />;

  return (
    <Descriptions title="Super File metadata" bordered size={'small'} layout="vertical">
      <Descriptions.Item label="Record Count">
        <Tag color="green">{superFileData.recordCount}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="File Size" span={2}>
        <Tag color="green">{superFileData.fileSize}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="SubFiles" span={4}>
        <Space direction="vertical" style={{ maxHeight: '200px', width: '100%', overflow: 'auto' }}>
          {superFileData.subFiles.map((file) => {
            return (
              <Tag key={file} color="processing">
                {file}
              </Tag>
            );
          })}
        </Space>
      </Descriptions.Item>
    </Descriptions>
  );
};

export default SuperFileMeta;
