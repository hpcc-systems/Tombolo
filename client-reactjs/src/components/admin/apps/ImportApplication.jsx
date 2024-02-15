import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Upload, Button, Modal, message } from 'antd';
import { ImportOutlined, InboxOutlined } from '@ant-design/icons';
import { authHeader } from '../../common/AuthHeader.js';
import { applicationActions } from '../../../redux/actions/Application';
import { store } from '../../../redux/store/Store';
import { useHistory } from 'react-router';
import { io } from 'socket.io-client';

// !! TODO : NOT IN USE
function ImportApplication(props) {
  const [modalVisible, setModalVisiblity] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [file, setFile] = useState({});
  const [socket, setSocket] = useState();
  const [importStatus, setImportStatus] = useState(null);
  const [importUpdates, setImportUpdates] = useState([]);
  const [importSuccess, setImportSuccess] = useState();
  const [routingURL, setRoutingURL] = useState('');
  const history = useHistory();
  const scrollToBottomRef = useRef(null);
  const { Dragger } = Upload;
  const authReducer = useSelector((state) => state.authenticationReducer);

  //Log color
  const logColor = (status) => {
    if (status === 'error') {
      return '#ff5722';
    } else if (status === 'success') {
      return '#00ff00';
    } else {
      return '#FFFFFF';
    }
  };

  // Socket io
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const socket = io(`http://localhost:3000`, {
        transports: ['websocket'],
        auth: {
          token: authReducer.user.token,
        },
      });
      setSocket(socket);
    } else {
      const socket = io({
        transports: ['websocket'],
        auth: {
          token: authReducer.user.token,
        },
      });
      setSocket(socket);
    }
  }, []);

  useEffect(() => {
    //When message is received from back end
    if (socket) {
      socket.on('message', (message) => {
        setImportUpdates((existingMsgs) => [...existingMsgs, JSON.parse(message)]);
      });
    }

    //Clean up socket connection when component unmounts
    return function cleanup() {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  //Scroll logs to bottom
  const scrollLogs = () => {
    scrollToBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollLogs();
  }, [importUpdates]);

  //Handle Import
  const handleImport = () => {
    setImportStatus('importing');
    let formData = new FormData();
    formData.append('user', props.user.username);
    formData.append('file', file);

    fetch('/api/app/read/importApp', {
      method: 'post',
      headers: authHeader('importApp'),
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setImportStatus('done');
          setImportSuccess(true);
          console.log(JSON.stringify(data));
          store.dispatch(applicationActions.applicationSelected(data.appId, data.app.appTitle));
          localStorage.setItem('activeProjectId', data.appTitle);
          setRoutingURL(`/${data.appId}/assets`);
        } else {
          setImportStatus('done');
        }
      });
  };

  //When done importing close btn is cliced
  const handleDoneImport = () => {
    setFile({});
    setImportUpdates([]);
    setModalVisiblity(false);
    setImportStatus(null);
    setUploadStatus('');
    if (importSuccess) {
      history.push(routingURL);
    }
  };

  //Draggeer's props
  const propss = {
    name: 'file',
    multiple: false,
    onChange(info) {
      setUploadStatus('');
      const { status } = info.file;
      if (status !== 'uploading') {
        setUploadStatus(status);
      }
      if (status === 'done') {
        setUploadStatus(status);
        setFile(info.file.originFileObj);
      } else if (status === 'error') {
        setUploadStatus(status);
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  //customRequest
  const customRequest = ({ onSuccess }) => {
    onSuccess('ok');
  };

  //Modal footer buttons
  const footer = () => {
    if (importStatus === 'importing') {
      return null;
    } else if (importStatus === 'done') {
      return (
        <Button type="primary" size={'large'} onClick={handleDoneImport}>
          {' '}
          Close
        </Button>
      );
    } else if (uploadStatus === 'done') {
      return (
        <Button onClick={handleImport} type="primary" size={'large'}>
          {' '}
          Import Application
        </Button>
      );
    } else {
      return null;
    }
  };

  return (
    <div>
      <Button
        style={{ display: 'flex', placeItems: 'center', marginRight: '10px' }}
        type="primary"
        onClick={() => setModalVisiblity(true)}
        icon={<ImportOutlined />}>
        Import App
      </Button>

      <Modal
        title={importStatus ? null : 'Import Application'}
        closable={uploadStatus === ''}
        maskClosable={false}
        open={modalVisible}
        onCancel={() => {
          setModalVisiblity(false);
          setUploadStatus('');
          setFile({});
        }}
        footer={footer()}>
        <Dragger
          maxCount={1}
          showUploadList={false}
          className="importApplication_dragger"
          style={{ display: importStatus === null ? 'block' : 'none' }}
          {...propss}
          customRequest={customRequest}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">Data must be in JSON format</p>
          <p>
            <b>{file ? file.name : null}</b>
          </p>
        </Dragger>
        <div
          style={{
            background: 'var(--dark)',
            textAlign: 'left',
            padding: '10px',
            maxHeight: '400px',
            overflow: 'auto',
            display: importStatus ? 'block' : 'none',
          }}>
          {importUpdates.map((item) => {
            let textColor = logColor(item.status);
            let message = item.step;
            return (
              <div style={{ textAlign: 'left' }}>
                <small style={{ color: textColor, fontWeight: '600', lineHeight: '5px' }}>{message}</small>
              </div>
            );
          })}
          <div ref={scrollToBottomRef}></div>
        </div>
      </Modal>
    </div>
  );
}

export default ImportApplication;
