import React, { useState, useEffect } from 'react';
import { Table, Spin, message } from 'antd';
import { getSessions, deviceInfoStringBuilder, revokeSession } from './utils';

const MyAccountTable = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [sessionsFetched, setSessionsFetched] = useState(false);

  useEffect(() => {
    const fetchSessions = async (user) => {
      const sessions = await getSessions(user);
      if (!sessions?.success) {
        return;
      }
      setSessions(sessions.data);
      return;
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
      render: (id) => {
        return (
          <a
            onClick={async () => {
              //TODO -- check if session is current active session and disabled revoke option
              const response = await revokeSession(id);
              if (!response) {
                return;
              }
              setSessions(sessions.filter((s) => s.id !== id));
              message.success('Session revoked successfully');
            }}>
            Revoke
          </a>
        );
      },
    },
  ];

  return (
    <>
      {!sessionsFetched ? <Spin /> : <Table columns={columns} dataSource={sessions} rowKey={(record) => record.id} />}
    </>
  );
};

export default MyAccountTable;