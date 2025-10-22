// Imports from libraries
import React, { useState, useEffect } from 'react';
import { Table, Spin } from 'antd';

// Local imports
import { deviceInfoStringBuilder } from './utils';
import { handleSuccess } from '../../common/handleResponse';
import sessionService from '@/services/session.service';

const MyAccountTable = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [sessionsFetched, setSessionsFetched] = useState(false);

  useEffect(() => {
    const fetchSessions = async (user) => {
      const { data } = await sessionService.getActiveSessions(user.id);
      if (data) {
        setSessions(data);
      }
    };

    if (sessionsFetched === false) {
      fetchSessions(user);
      setSessionsFetched(true);
    }
  }, [sessions]);

  const columns = [
    {
      title: 'Device',
      dataIndex: 'deviceInfo',
      key: 'deviceInfo',
      render: (deviceInfo) => {
        return deviceInfoStringBuilder(deviceInfo);
      },
      width: '33rem',
    },
    {
      title: 'Revoke',
      dataIndex: 'id',
      key: 'id',
      render: (id, current) => {
        if (current.current) {
          return <span>Active Session</span>;
        }
        return (
          <a
            onClick={async () => {
              //TODO -- check if session is current active session and disabled revoke option
              try {
                await sessionService.destroyActiveSession(id);
                setSessions(sessions.filter((s) => s.id !== id));
                handleSuccess('Session revoked successfully');
              } catch (err) {
                // Error handled by axios interceptor
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
        <Table columns={columns} size="small" dataSource={sessions} rowKey={(record) => record.id} pagination={false} />
      )}
    </>
  );
};

export default MyAccountTable;
