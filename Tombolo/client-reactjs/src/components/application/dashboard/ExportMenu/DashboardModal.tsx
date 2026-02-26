import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Button, Input } from 'antd';
import InfoDrawer from '../../../common/InfoDrawer';
import useWindowSize from '@/hooks/useWindowSize';
import { handleError as handleResponseError } from '@/components/common/handleResponse';
import { InfoCircleOutlined, CopyOutlined } from '@ant-design/icons';
import DashboardApiTable from './DashboardApiTable';
import KeyForm from './KeyForm';
import apiKeysService from '@/services/apiKeys.service';

interface Props {
  modalVisible: boolean;
  setModalVisible: (v: boolean) => void;
  applicationId: any;
  authReducer?: any;
  dataType?: string;
}

const DashboardModal: React.FC<Props> = ({ modalVisible, setModalVisible, applicationId, authReducer }) => {
  const [key, setKey] = useState<any>(null);
  const [modalWidth, setModalWidth] = useState<any>(null);
  const [keyFormVisible, setKeyFormVisible] = useState(false);

  const [keys, setKeys] = useState<any[] | null>(null);
  const [open, setOpen] = useState(false);

  const { TabPane } = Tabs as any;

  const showDrawer = () => setOpen(true);
  const onClose = () => setOpen(false);

  const getKeys = async () => {
    try {
      const data = await apiKeysService.getAll({ applicationId });

      data.map((data: any) => {
        let date = new Date(data.expirationDate);
        let curDate = new Date();
        let diff = date.getTime() - curDate.getTime();
        data.daysToExpire = Math.floor(diff / (1000 * 60 * 60 * 24)) + ' days';
        data.expirationDate = date.toLocaleString();
        data.Notes = data.metaData?.Notes;
        let createdAtDate = new Date(data.createdAt);
        var dd = String(createdAtDate.getDate()).padStart(2, '0');
        var mm = String(createdAtDate.getMonth() + 1).padStart(2, '0');
        var yyyy = createdAtDate.getFullYear();
        data.formattedCreatedAt = mm + '/' + dd + '/' + yyyy;
      });

      setKeys(data);
      return data;
    } catch (error) {
      handleResponseError('Failed to fetch keys');
    }
  };

  const windowSize = useWindowSize();

  const createKey = async (formData: any) => {
    try {
      const data = await apiKeysService.create({ applicationId, formData });
      if (data && data.apiKey) setKey(data.apiKey);
      getKeys();
      setKey(data);
      return;
    } catch (error) {
      handleResponseError('Failed to get API Key');
    }
  };

  useEffect(() => {
    const { width } = windowSize.inner;
    if (width > 1500) setModalWidth('40vw');
    else if (width > 1000) setModalWidth('60vw');
    else setModalWidth('100vw');
  }, [windowSize]);

  const copyKey = () => {
    if (key?.apiKey) navigator.clipboard.writeText(key.apiKey);
  };

  function cancelModal() {
    setModalVisible(false);
    setKeyFormVisible(false);
    setKey(false);
  }

  return (
    <>
      <Modal
        open={modalVisible}
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
        <Tabs type="card">
          <TabPane tab="Active Keys" key="1">
            <div style={{ marginBottom: '1rem' }}>
              <DashboardApiTable
                applicationId={applicationId}
                keys={keys}
                active={1}
                getKeys={getKeys}
                showDrawer={showDrawer}
              />
            </div>
          </TabPane>
          <TabPane tab="Expired Keys" key="2">
            <div style={{ marginBottom: '1rem' }}>
              <DashboardApiTable
                applicationId={applicationId}
                active={0}
                keys={keys}
                getKeys={getKeys}
                showDrawer={showDrawer}
              />
            </div>
          </TabPane>
        </Tabs>

        {!keyFormVisible && !key ? (
          <Button type="primary" onClick={() => setKeyFormVisible(true)}>
            Get New Key
          </Button>
        ) : null}

        {keyFormVisible && !key ? <KeyForm authReducer={authReducer} createKey={createKey} key={key} /> : null}

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
              <Input disabled={true} value={key.apiKey} />
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

        <InfoDrawer open={open} onClose={onClose} width="35%" content="api" />
      </Modal>
    </>
  );
};

export default DashboardModal;
