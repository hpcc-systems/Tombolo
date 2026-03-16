import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface Props {
  width?: string | number;
  setSearchTerm: (s: string) => void;
  matchCount: number;
  searchTerm: string;
}

const NotificationsSearch: React.FC<Props> = ({ width, setSearchTerm, matchCount, searchTerm }) => {
  return (
    <Input
      placeholder="Search by Log ID or Modified by"
      prefix={<SearchOutlined />}
      suffix={
        searchTerm ? (
          <span style={{ color: matchCount > 0 ? 'var(--primary)' : 'var(--danger)' }}>
            {matchCount} match{matchCount > 1 ? 'es' : ''}{' '}
          </span>
        ) : (
          ''
        )
      }
      style={{ width }}
      onChange={e => {
        setSearchTerm(e.target.value.toLocaleLowerCase());
      }}
      allowClear
      disabled={false}
    />
  );
};

export default NotificationsSearch;
