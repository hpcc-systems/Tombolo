import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { message, Tabs, Descriptions, Card, Collapse, Form, Empty, Spin } from 'antd';
import { CaretRightOutlined, FolderOpenOutlined, FileOutlined } from '@ant-design/icons';

import { authHeader } from '../common/AuthHeader.js';
import LandingZoneFileExplorer from '../common/LandingZoneFileExplorer';

const TabPane = Tabs.TabPane;
const { Panel } = Collapse;

function ClusterDetails() {
  let { clusterId } = useParams();
  const [clusterMetaData, setClusterMetaData] = useState(null);
  const [directoryDetails, setDirectoryDetails] = useState(null);
  const [landingZoneRootPath, setLandingZoneRootPath] = useState(null);
  const [fetchingDirectoryDetails, setFetchingDirectoryDetails] = useState(false);
  const [form] = Form.useForm();

  //Use Effect
  useEffect(() => {
    getClusterMetaData(clusterId);
  }, [clusterId]);

  //When the value in directory cascader changes
  const onDirectoryPathChange = async (value, selectedOptions) => {
    setFetchingDirectoryDetails(true);
    try {
      const netAddress = form.getFieldValue('machine');
      const directoryPath = selectedOptions.map((selectedOption) => selectedOption.value).join('/');
      const { landingZonePath } = landingZoneRootPath;
      const url = `/api/hpcc/read/dropZoneDirectoryDetails?clusterId=${clusterId}&Netaddr=${netAddress}&DirectoryOnly=false&Path=${landingZonePath}/${directoryPath}`;

      const response = await fetch(url, { headers: authHeader() });
      console.log(response);
      if (!response.ok) {
        throw Error('Failed to fetch directory metadata');
      }
      const data = await response.json();
      setDirectoryDetails(data);
    } catch (err) {
      message.error(err.message);
    } finally {
      setFetchingDirectoryDetails(false);
    }
  };
  //Get Cluster metadata
  const getClusterMetaData = async (clusterId) => {
    try {
      const response = await fetch(`/api/hpcc/read/clusterMetaData?clusterId=${clusterId}`, { headers: authHeader() });
      if (!response.ok) {
        throw Error('Failed to fetch cluster metadata');
      }
      const clusterMetaData = await response.json();
      setClusterMetaData(clusterMetaData);
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <div>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Cluster Details" key="1" style={{ minWidth: '480px', maxWidth: '50vw' }}>
          {clusterMetaData ? (
            <>
              <Card title={`Drop zones [${clusterMetaData.dropZones.length}]`} size="small">
                {clusterMetaData.dropZones.map((data, index) => (
                  <Collapse
                    title={data.Name}
                    collapsible="header"
                    key={data.Name}
                    expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}>
                    <Panel header={data.Name} key={index}>
                      <Descriptions size="small" column={1}>
                        <Descriptions.Item label="Name">{data.Name}</Descriptions.Item>
                        <Descriptions.Item label="Path">{data.Path}</Descriptions.Item>
                        <Descriptions.Item label="Description">{data.Description}</Descriptions.Item>
                        <Descriptions.Item label="UMask">{data.UMask}</Descriptions.Item>
                        <Descriptions.Item label="Build">{data.build}</Descriptions.Item>
                        <Descriptions.Item label="Tp Machine Count">
                          {data.TpMachines.TpMachine.length}
                        </Descriptions.Item>
                      </Descriptions>
                      <div>
                        {data.TpMachines.TpMachine.map((machine) => (
                          <Descriptions size="small" key={machine.Name} column={1}>
                            <Descriptions.Item label="Machine name">{machine.Name}</Descriptions.Item>
                            <Descriptions.Item label="Netaddress">{machine.Netaddress}</Descriptions.Item>
                            <Descriptions.Item label="OS">{machine.OS}</Descriptions.Item>
                          </Descriptions>
                        ))}
                      </div>
                    </Panel>
                  </Collapse>
                ))}
              </Card>
              <Card title="Execution engines" size="small">
                {clusterMetaData.tpLogicalCluster.map((cluster) => (
                  <Collapse
                    title={cluster.Name}
                    key={cluster.Name}
                    expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}>
                    <Panel header={cluster.Name}>
                      <Descriptions size="small" column={1}>
                        <Descriptions.Item label="Name">{cluster.Name}</Descriptions.Item>
                        <Descriptions.Item label="LanguageVersion">{cluster.LanguageVersion}</Descriptions.Item>
                        <Descriptions.Item label="Process">{cluster.Process}</Descriptions.Item>
                        <Descriptions.Item label="QueriesOnly">{cluster.QueriesOnly}</Descriptions.Item>
                        <Descriptions.Item label="Queue">{cluster.Queue}</Descriptions.Item>
                        <Descriptions.Item label="Type">{cluster.hthor}</Descriptions.Item>
                      </Descriptions>
                    </Panel>
                  </Collapse>
                ))}
              </Card>

              <Card title="DFU servers" size="small">
                {clusterMetaData.TpDfuServer.TpDfuServers.TpDfuServer.map((dfuServer) => (
                  <Collapse
                    key={dfuServer.Name}
                    expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}>
                    <Panel header={dfuServer.Name}>
                      <Descriptions size="small" column={1}>
                        <Descriptions.Item label="Name">{dfuServer.Name}</Descriptions.Item>
                        <Descriptions.Item label="Description">{dfuServer.Description}</Descriptions.Item>
                        <Descriptions.Item label="LogDirectory">{dfuServer.LogDirectory}</Descriptions.Item>
                        <Descriptions.Item label="Path">{dfuServer.Path}</Descriptions.Item>
                        <Descriptions.Item label="Queue">{dfuServer.Queue}</Descriptions.Item>
                        <Descriptions.Item label="Type">{dfuServer.Type}</Descriptions.Item>
                      </Descriptions>
                    </Panel>
                  </Collapse>
                ))}
              </Card>
            </>
          ) : null}
        </TabPane>
        <TabPane tab="Landingzone Details" key="2" style={{ minWidth: '480px', maxWidth: '50vw' }}>
          <Form layout="vertical" form={form}>
            <LandingZoneFileExplorer
              clusterId={clusterId}
              enableEdit={true}
              setLandingZoneRootPath={setLandingZoneRootPath}
              DirectoryOnly={true}
              onDirectoryPathChange={onDirectoryPathChange}
            />
          </Form>
          {directoryDetails ? (
            <div style={{ marginTop: '20px' }}>
              <Card title="Basic Details" size="small" headStyle={{ fontWeight: 700 }}>
                <Descriptions column={1} size="small" labelStyle={{ fontWeight: 500 }}>
                  <Descriptions.Item label="Total Directories">{directoryDetails.directoryCount}</Descriptions.Item>
                  <Descriptions.Item label="Total Files">{directoryDetails.fileCount}</Descriptions.Item>
                </Descriptions>
              </Card>

              {directoryDetails?.oldestFile ? (
                <Card title="Oldest File" size="small" headStyle={{ fontWeight: 700 }} style={{ marginTop: '2px' }}>
                  <Descriptions column={1} size="small">
                    {Object.keys(directoryDetails.oldestFile).map((key) => (
                      <Descriptions key={key} label={key}>
                        {directoryDetails.oldestFile[key]}
                      </Descriptions>
                    ))}
                  </Descriptions>
                </Card>
              ) : null}

              {directoryDetails?.filesAndDirectories.length > 0 ? (
                <Card
                  title="Files and Directories"
                  size="small"
                  headStyle={{ fontWeight: 700 }}
                  style={{ marginTop: '2px' }}>
                  {directoryDetails?.filesAndDirectories.map((directory, index) => (
                    <Collapse
                      key={index}
                      size="small"
                      expandIcon={() => (directory.isDir ? <FolderOpenOutlined /> : <FileOutlined />)}>
                      <Panel header={directory.name}>
                        <Descriptions column={1} size="small">
                          {Object.keys(directory).map((key) => (
                            <Descriptions.Item label={key} key={key}>
                              {directory[key]}
                            </Descriptions.Item>
                          ))}
                        </Descriptions>
                      </Panel>
                    </Collapse>
                  ))}
                </Card>
              ) : null}
            </div>
          ) : fetchingDirectoryDetails ? (
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <Spin />
            </div>
          ) : (
            <Empty />
          )}
        </TabPane>
      </Tabs>
    </div>
  );
}

export default ClusterDetails;
