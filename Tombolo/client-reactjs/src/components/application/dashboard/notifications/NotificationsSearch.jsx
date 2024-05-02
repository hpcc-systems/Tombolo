// Packages
import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

// JSX
function NotificationsSearch({ width, setSearchTerm, matchCount, searchTerm }) {
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
      onChange={(e) => {
        setSearchTerm(e.target.value.toLocaleLowerCase());
      }}
      allowClear
    />
  );
}

export default NotificationsSearch;
