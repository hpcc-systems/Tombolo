import React, { useState, useEffect } from 'react';
import { Table, Spin } from 'antd';

import { deviceInfoStringBuilder } from './utils';
import { handleSuccess } from '../../common/handleResponse';
import sessionService from '@/services/session.service';

interface Props {
  user: any;
}

const MyAccountTable: React.FC<Props> = ({ user }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsFetched, setSessionsFetched] = useState(false);

  useEffect(() => {
    const fetchSessions = async (u: any) => {
      const data = await sessionService.getActiveSessions(u.id);
      if (data) setSessions(data);
    };

    if (!sessionsFetched) {
      fetchSessions(user);
      setSessionsFetched(true);
    }
  }, [sessionsFetched]);

  const columns = [
    {
      title: 'Device',
      dataIndex: 'deviceInfo',
      key: 'deviceInfo',
      render: (deviceInfo: any) => deviceInfoStringBuilder(deviceInfo),
      width: '33rem',
    },
    {
      title: 'Revoke',
      dataIndex: 'id',
      key: 'id',
      render: (id: any, current: any) => {
        if (current.current) return <span>Active Session</span>;
        return (
          <a
            onClick={async () => {
              try {
                await sessionService.destroyActiveSession(id);
                setSessions(prev => prev.filter(s => s.id !== id));
                handleSuccess('Session revoked successfully');
              } catch (_err) {
                // handled by axios interceptor
              }
            }}>
            Revoke
          </a>
        );
      },
    },
  ];

  return (
    <>
      {!sessionsFetched ? (
        <Spin />
      ) : (
        <Table columns={columns} size="small" dataSource={sessions} rowKey={record => record.id} pagination={false} />
      )}
    </>
  );
};

export default MyAccountTable;
