import React, { useState, useEffect } from 'react';
import { Modal, message, Button, Input } from 'antd';
import InfoDrawer from '../../../common/InfoDrawer.jsx';
import useWindowSize from '../../../../hooks/useWindowSize';
import { authHeader, handleError } from '../../../common/AuthHeader.js';
import { InfoCircleOutlined, CopyOutlined } from '@ant-design/icons';
import DashboardApiTable from './DashboardApiTable.jsx';
import KeyForm from './KeyForm.jsx';

const DashboardModal = ({ modalVisible, setModalVisible, applicationId, dataType, authReducer }) => {
  //extra states needed for data verification and entry
  const [key, setKey] = useState(null);
  const [modalWidth, setModalWidth] = useState(null);
  const [keyFormVisible, setKeyFormVisible] = useState(false);

  const [keys, setKeys] = useState(null);
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const getKeys = async () => {
    try {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      const response = await fetch(`/api/key/all/${applicationId}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();

      data.map((data) => {
        //get current date and expiration date for calculations
        let date = new Date(data.expirationDate);
        let curDate = new Date();

        //get date difference and round
        let diff = date.getTime() - curDate.getTime();

        data.daysToExpire = Math.floor(diff / (1000 * 60 * 60 * 24)) + ' days';

        data.expirationDate = date.toLocaleString();

        //move notes to top level for display in table
        data.Notes = data.metaData.Notes;

        //format created at date for ease of reading
        let createdAtDate = new Date(data.createdAt);

        var dd = String(createdAtDate.getDate()).padStart(2, '0');
        var mm = String(createdAtDate.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = createdAtDate.getFullYear();

        data.formattedCreatedAt = mm + '/' + dd + '/' + yyyy;
      });

      setKeys(data);
      return data;
    } catch (error) {
      message.error('Failed to fetch keys');
    }
  };

  const windowSize = useWindowSize();

  const createKey = async (formData) => {
    try {
      const payload = {
        method: 'POST',
        header: authHeader(),
        body: JSON.stringify({ applicationId, formData }),
      };

      const response = await fetch(`/api/key/newKey/${applicationId}`, payload);
      if (!response.ok) handleError(response);

      const data = await response.json();

      if (data && data.apiKey) setKey(data.apiKey);
      getKeys();
      setKey(data);
      return;
    } catch (error) {
      message.error('Failed to get API Key');
    }
  };
  // Changes modal size per screen vw
  useEffect(() => {
    const { width } = windowSize.inner;
    if (width > 1500) {
      setModalWidth('40vw');
    } else if (width > 1000) {
      setModalWidth('60vw');
    } else {
      setModalWidth('100vw');
    }
  }, [windowSize]);

  const copyKey = () => {
    navigator.clipboard.writeText(key.apiKey);
    message.success('Key Copied to Clipboard');
  };

  function cancelModal() {
    setModalVisible(false);
    setKeyFormVisible(false);
    setKey(false);
  }

  return (
    <>
      <Modal
        visible={modalVisible}
        width={modalWidth}
        onCancel={cancelModal}
        maskClosable={false}
        destroyOnClose
        title={
          <>
            Api Keys{'  '}
            <InfoCircleOutlined onClick={() => showDrawer()} />
          </>
        }
        footer={false}
        style={{ marginTop: '200px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <DashboardApiTable
            applicationId={applicationId}
            keys={keys}
            getKeys={getKeys}
            showDrawer={showDrawer}></DashboardApiTable>
        </div>

        {!keyFormVisible && !key ? (
          <Button type="primary" onClick={() => setKeyFormVisible(true)}>
            Get New Key
          </Button>
        ) : null}

        {keyFormVisible && !key ? <KeyForm authReducer={authReducer} createKey={createKey} key={key}></KeyForm> : null}

        {key ? (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
                background: '#C6F29D',
                marginTop: '15px',
              }}>
              <Input disabled={true} value={key.apiKey}></Input>
              <Button onClick={() => copyKey()}>
                <CopyOutlined />
              </Button>

              <br />
            </div>
            <p style={{ marginTop: '.5rem' }}>
              <div style={{ fontSize: '11px', textAlign: 'center', color: 'red' }}>
                This is the only time you will be able to view this key. Please copy and save it securely.
              </div>
            </p>
          </>
        ) : null}

        <InfoDrawer open={open} onClose={onClose} width="35%" content="api"></InfoDrawer>
      </Modal>
    </>
  );
};

export default DashboardModal;
