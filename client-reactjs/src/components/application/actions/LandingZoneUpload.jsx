import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Upload, Table, Select, message, Button, Checkbox, Cascader, Tooltip } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { useHistory } from 'react-router';

import { authHeader, handleError } from '../../common/AuthHeader';
import Text from '../../common/Text';

const devURL = `${process.env.REACT_APP_PROXY_URL}/landingZoneFileUpload`;
const prodURL = '/landingZoneFileUpload';
const { Dragger } = Upload;
const { Option } = Select;
message.config({ top: 150, maxCount: 1 });

function LandingZoneUpload() {
  const [files, setFiles] = useState([]);
  const [socket, setSocket] = useState(null);
  const [cluster, setCluster] = useState(null);
  const [fileDestinationDetail, setFileDestinationDetail] = useState({
    machine: '',
    pathToAsset: '',
    currentDirectoryFiles: [],
    overWriteFiles: false,
  });
  const [uploading, setUploading] = useState(false); // is true once user clicks upload btn
  const [options, setOptions] = useState([]); //Cascader options
  const history = useHistory();
  const [authReducer, clusters] = useSelector((state) => [
    state.authenticationReducer,
    state.applicationReducer.clusters,
  ]);

  useEffect(() => {
    const url = process.env.NODE_ENV === 'development' ? devURL : prodURL;
    // Establish Socket io connection when component is mounted
    const socket = io(url, {
      transports: ['websocket'],
      auth: {
        token: authReducer?.user.token,
      },
    });
    setSocket(socket);

    // When file upload response is received
    socket.on('file-upload-response', (response) => {
      setFiles((prev) =>
        prev.map((item) => {
          if (item.uid === response.id) {
            item.uploadStatus = response.success ? 'success' : 'failed';
            item.statusDescription = response.message;
          }
          return item;
        })
      );
    });

    // socket connection fails
    socket.io.on('error', (_error) => {
      message.warning(`Upload feature unavailable - Unable to establish secure connection with server`, 0);
    });

    //Clean up socket connection when component unmounts
    return () => {
      socket.close();
      message.destroy();
    };
  }, []);

  //Handle File Upload
  const handleFileUpload = () => {
    let newFiles = files.map((file) => file.name);
    let { machine, pathToAsset } = fileDestinationDetail;
    let commonFiles = fileDestinationDetail.currentDirectoryFiles.filter((file) => newFiles.includes(file));
    if (!cluster) {
      message.error('Select a cluster');
    } else if (!pathToAsset) {
      message.error('Select  destination folder');
    } else if (files.length < 1) {
      message.error('Please select at least one file to upload');
    } else if (commonFiles.length > 0 && !fileDestinationDetail.overWriteFiles) {
      message.error('Some file(s) already exist. Please check overwrite box to continue');
    } else {
      setUploading(true);
      setFiles((prev) =>
        prev.map((item) => {
          item.uploadStatus = 'uploading';
          return item;
        })
      );

      // Start by sending some file and destination details to server
      socket.emit('start-upload', { pathToAsset, cluster, machine });
      files.forEach((file) => {
        const { uid: id, name: fileName, size: fileSize } = file.originFileObj;
        if (file.size <= 1000000) {
          let reader = new FileReader();
          reader.readAsArrayBuffer(file.originFileObj);
          reader.onload = function (e) {
            let arrayBuffer = e.target.result;
            socket.emit('upload-file', {
              id,
              fileName,
              data: arrayBuffer,
            });
          };
        } else {
          let slice = file.originFileObj.slice(0, 100000);
          let reader = new FileReader();
          reader.readAsArrayBuffer(slice);
          reader.onload = function (e) {
            let arrayBuffer = e.target.result;
            socket.emit('upload-slice', {
              id,
              fileName,
              data: arrayBuffer,
              fileSize,
              chunkStart: 100000,
              chunkSize: 100000,
            });
          };
        }
      });

      //When server asks for a slice of a file
      socket.on('supply-slice', (message) => {
        let currentFile = files.find((file) => file.originFileObj.uid === message.id);
        let slice = currentFile.originFileObj.slice(message.chunkStart, message.chunkStart + message.chunkSize);
        let reader = new FileReader();
        reader.readAsArrayBuffer(slice);
        reader.onload = function (e) {
          let arrayBuffer = e.target.result;
          socket.emit('upload-slice', {
            id: currentFile.uid,
            fileName: currentFile.name,
            data: arrayBuffer,
            fileSize: currentFile.size,
            chunkSize: message.chunkSize,
          });
        };
      });
    }
  };

  //Dragger props
  const props = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    accept: '.xls, .xlsm, .xlsx, .txt, .json, .csv',
    onChange(info) {
      const { status } = info.file;
      if (status === 'error') {
        return message.error('Error adding files - please try again');
      }
      setFiles(() => info.fileList.slice(-5));
    },
  };

  // When the value of cluster dropdown changes
  function handleClusterChange(value) {
    //set selected cluster
    let selectedCluster = JSON.parse(value);
    setCluster(selectedCluster);

    //Make a call to get all drop zones within that cluster
    fetch(`/api/hpcc/read/getDropzones?clusterId=${selectedCluster.id}&for=fileUpload`, {
      headers: authHeader(),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw Error('Unable to get dropzones');
      })
      .then((data) => {
        //Set initial cascader options
        setOptions(() =>
          data.map((item) => {
            return { value: item.path, label: item.name, machine: item.machines[0], isLeaf: false, selectedCluster };
          })
        );
      })
      .catch((err) => {
        console.log(err);
        message.error(err.message);
      });
  }

  //Load cascader data
  const loadData = (selectedOptions) => {
    setFileDestinationDetail((prev) => ({ ...prev, currentDirectoryFiles: [] })); //Empty current dir files array
    let { thor_host, thor_port, id: clusterId } = cluster;
    const targetOption = selectedOptions[selectedOptions.length - 1];
    targetOption.loading = true;
    const pathToAsset = selectedOptions.map((option) => option.value).join('/') + '/';
    setFileDestinationDetail((prev) => ({ ...prev, pathToAsset }));
    if (targetOption === selectedOptions[0]) {
      setFileDestinationDetail((prev) => ({ ...prev, machine: targetOption.machine.Netaddress }));
    }

    //constructing data object to be sent as query params
    const data = JSON.stringify({
      Netaddr: selectedOptions[0].machine.Netaddress,
      Path: pathToAsset,
      OS: selectedOptions[0].OS,
      rawxml_: true,
      DirectoryOnly: false,
    });

    // Every time user clicks an option on cascader make a call to fetch children
    fetch(`/api/hpcc/read/getDirectories?data=${data}&host=${thor_host}&port=${thor_port}&clusterId=${clusterId}`, {
      headers: authHeader(),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((data) => {
        if (data.FileListResponse.files) {
          let children = [];
          let files = [];
          data.FileListResponse.files.PhysicalFileStruct.map((item) => {
            if (item.isDir) {
              let child = {};
              child.value = item.name;
              child.label = item.name;
              child.isLeaf = !item.isDir;
              children.push(child);
            } else {
              files.push(item.name);
            }
          });
          targetOption.loading = false;
          targetOption.children = children;
          setOptions([...options]);
          setFileDestinationDetail((prev) => ({ ...prev, currentDirectoryFiles: files }));
        } else {
          targetOption.loading = false;
          targetOption.disabled = true;
          targetOption.children = [];
          setOptions([...options]);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  //Handle override checkbox change
  const onCheckBoxChange = (e) => {
    // setOverWriteFiles(e.target.checked);
    setFileDestinationDetail((prev) => ({ ...prev, overWriteFiles: e.target.checked }));
  };

  //Upload status icons
  const renderUploadStatusIcon = (status, message, id) => {
    switch (status) {
      case 'uploading':
        return <LoadingOutlined style={{ fontSize: 18 }} spin />;
      case 'success':
        return (
          <Tooltip title={message}>
            {' '}
            <CheckCircleOutlined style={{ fontSize: 18, color: 'green' }} />{' '}
          </Tooltip>
        );
      case 'failed':
        return (
          <Tooltip title={message} placement="topLeft">
            {' '}
            <CloseCircleOutlined style={{ fontSize: 18, color: 'red' }} />{' '}
          </Tooltip>
        );
      default:
        return <DeleteOutlined onClick={() => handleFileDelete(id)} />;
    }
  };

  //Delete file
  const handleFileDelete = (fileId) => {
    setFiles((prev) =>
      prev.filter((file) => {
        return file.uid !== fileId;
      })
    );
  };

  //Table columns
  const columns = [
    {
      title: '#',
      dataIndex: 'sno',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'File Name',
      dataIndex: 'name',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      render: (text) => {
        return `${text / 1000000} MB`;
      },
    },
    {
      title: '',
      dataIndex: 'uploading',
      render: (text, record) => {
        return renderUploadStatusIcon(record.uploadStatus, record.statusDescription, record.uid);
      },
    },
  ];

  return (
    <div className="ant-col ant-col-sm-24  ant-col-md-20 ant-col-xl-10">
      {!uploading ? (
        <>
          <div>
            <p>{<Text text="Cluster" />}</p>
            <Select defaultValue="" onChange={handleClusterChange} size="large" style={{ width: '100%' }}>
              {clusters.map((item) => {
                return (
                  <Option key={uuidv4()} value={JSON.stringify(item)}>
                    {item.name} ({item.thor_host.substring(7)})
                  </Option>
                );
              })}
            </Select>
          </div>

          <div style={{ marginTop: '8px' }}>
            <p>{<Text text="Destination Folder" />}</p>
            <Cascader
              options={options}
              loadData={loadData}
              allowClear
              changeOnSelect={true}
              style={{ width: '100%' }}
            />
          </div>

          <Dragger
            {...props}
            fileList={files}
            customRequest={({ onSuccess }) => {
              onSuccess('ok');
            }}
            style={{ marginTop: '10px' }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              <b>{<Text text="Click or drag files here to upload (Up to 5 files)" />}</b>
            </p>
            <p className="ant-upload-hint">{<Text text="Supports xls, xlsm, xlsx, txt, json and csv" />}</p>
          </Dragger>
        </>
      ) : null}

      {files.length > 0 ? (
        <div>
          <Table
            columns={columns}
            rowKey={(record) => record.uid}
            dataSource={files}
            size="small"
            pagination={false}
            style={{ width: '100%', maxHeight: '300px', overflow: 'auto' }}
          />
        </div>
      ) : null}

      {!uploading ? (
        <Checkbox onChange={onCheckBoxChange} style={{ margin: '20px 0px 20px 0px' }}>
          {<Text text="Overwrite File(s)" />}
        </Checkbox>
      ) : null}

      <Button
        size="large"
        disabled={files.length < 1}
        onClick={
          !uploading
            ? handleFileUpload
            : () => {
                history.push('/');
              }
        }
        type="primary">
        {!uploading ? <Text text="Upload" /> : <Text text="Done" />}{' '}
      </Button>
    </div>
  );
}

export default LandingZoneUpload;
