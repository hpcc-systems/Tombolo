/* eslint-disable unused-imports/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import cronstrue from 'cronstrue';
import { Tooltip, Button, message, Form, Tabs, Input, Modal, Select, Typography, Checkbox } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

import ClusterMonitoringTable from './ClusterMonitoringTable';
import BreadCrumbs from '../../common/BreadCrumbs';
import Text from '../../common/Text';
import { authHeader, handleError } from '../../common/AuthHeader.js';

//Constants
const { TabPane } = Tabs;
const { Option } = Select;
const notifyOptions = [{ label: 'Target cluster exceeds specified size', value: 'TargetClusterAlertSize' }];
const notificationOptions = [
  { label: 'E-mail', value: 'eMail' },
  { label: 'MS Teams', value: 'msTeams' },
];

function ClusterMonitoring() {
  //Redux
  const {
    clusters,
    application: { applicationId },
  } = useSelector((state) => state.applicationReducer);

  //Local State
  const [clusterMonitorings, setClusterMonitorings] = useState([]);
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [engines, setEngines] = useState([]);
  const [selectedEngines, setSelectedEngines] = useState([]);
  const [fetchingEngines, setFetchingEngines] = useState(false);
  const [cornExplainer, setCornExplainer] = useState(null);
  const [notificationDetails, setNotificationDetails] = useState({});
  const [notifyConditions, setNotifyConditions] = useState([]);

  // ==============================================================================
  const DynamicFieldSet = (selectedEngines) => {
    return (
      <Form.Item noStyle>
        {selectedEngines.map((engine) => (
          <Form.Item label={engine} required={false} key={engine}>
            <Input name={engine} value={engine} />
          </Form.Item>
        ))}
      </Form.Item>
    );
  };
  // =============================================================================

  //When component loads get all file monitoring
  useEffect(() => {
    if (applicationId) getClusterMonitorings(applicationId);
  }, [applicationId]);

  //When submit btn is clicked
  const handleFinish = (values) => {
    console.log('Success:', values);
  };

  //Handle finish func
  const handleFinishFailed = ({ errorFields }) => {
    console.log(errorFields);
  };

  // Show modal func
  const showModal = () => {
    setVisible(true);
  };

  //When submit btn on modal is clicked
  const handleOk = async () => {
    // await form.validateFields().then((response) => {
    //   console.log('------------------------------------------');
    //   console.log(response);
    //   console.log('------------------------------------------');
    // });
    console.log(form.getFieldsValue());
    alert('Submitting');
  };

  //Cancel / close modal
  const handleCancel = () => {
    setVisible(false);
  };

  //Function to get all cluster monitoring
  const getClusterMonitorings = async (applicationId) => {
    try {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      const response = await fetch(`/api/clustermonitoring/all/${applicationId}`, payload);
      if (!response.ok) handleError(response);

      const data = await response.json();
      if (data) {
        setClusterMonitorings(data);
      }
    } catch (err) {
      console.log(err);
      message.error('Failed to fetch cluster monitoring');
    }
  };

  //Handle Cluster change
  const handleClusterChange = (value) => {
    setSelectedCluster(value);
    form.setFieldsValue({ engine: [] });
    getExecutionEngines(value);
  };

  //Function to get all engines for selected cluster ->  clusterMetaData
  const getExecutionEngines = async (clusterId) => {
    try {
      setFetchingEngines(true);
      setEngines([]);
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      const response = await fetch(`/api/hpcc/read/clusterMetaData?clusterId=${clusterId}`, payload);
      if (!response.ok) handleError(response);

      const { tpLogicalCluster } = await response.json();
      console.log('------------------------------------------');
      console.log(tpLogicalCluster);
      console.log('------------------------------------------');
      if (tpLogicalCluster) {
        setEngines(tpLogicalCluster);
      }
    } catch (err) {
      console.log(err);
      message.error('Failed to fetch cluster monitoring');
    } finally {
      setFetchingEngines(false);
    }
  };

  //Modal footer btns -------------------------------------------------------------------------
  const nextBtn = (
    <Button
      key="next"
      type="primary"
      ghost
      onClick={() => {
        setActiveTab((parseInt(activeTab) + 1).toString());
      }}>
      Next
    </Button>
  );

  const backBtn = (
    <Button
      key="back"
      type="primary"
      ghost
      onClick={() => {
        setActiveTab((parseInt(activeTab) - 1).toString());
      }}>
      Back
    </Button>
  );

  const saveBtn = (
    <Button key="save" type="primary" onClick={handleOk}>
      Save
    </Button>
  );
  const btns = {
    0: null,
    1: [nextBtn],
    2: [backBtn, nextBtn],
    3: [backBtn, saveBtn],
  };
  //------------------------------------------------------------------------------------
  return (
    <>
      <BreadCrumbs
        extraContent={
          <Tooltip placement="bottom" title={'Click to add a new Application'} onClick={showModal}>
            <Button type="primary" onClick={() => console.log('add cluster monitoring here')}>
              {<Text text="Add Cluster Monitoring" />}
            </Button>
          </Tooltip>
        }
      />
      <ClusterMonitoringTable clusterMonitorings={clusterMonitorings} />

      <Modal visible={visible} onOk={handleOk} onCancel={handleCancel} footer={btns[activeTab]} destroyOnClose>
        <Form form={form} onFinish={handleFinish} onFinishFailed={handleFinishFailed} layout="vertical">
          <Tabs
            activeKey={activeTab}
            onTabClick={(record) => {
              setActiveTab(record);
            }}>
            <TabPane tab={<span>Basic</span>} key="1">
              <Form.Item label="Cluster" name="cluster_id" rules={[{ required: true, message: 'Required filed' }]}>
                <Select onChange={(value) => handleClusterChange(value)}>
                  {clusters.map((cluster) => {
                    return (
                      <Option key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>

              {selectedCluster ? (
                <Form.Item
                  label="Engine"
                  // style={{ width: 'calc(47.5% - 8px)' }}
                  name="engine"
                  rules={[{ required: true, message: 'Required filed' }]}>
                  <Select
                    loading={fetchingEngines}
                    mode="multiple"
                    onChange={(value) => {
                      setSelectedEngines(value);
                    }}>
                    {engines.map((engine) => {
                      return (
                        <Option key={engine.Name} value={engine.Name}>
                          {engine.Name}
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              ) : null}
            </TabPane>

            {/* ---------------------------------------------------------------------------------------------------------- */}
            <TabPane tab={<span>Monitoring </span>} key="2">
              <Form.Item
                label="Monitoring name"
                name="name"
                rules={[
                  {
                    validator: (_, value) => {
                      const nameExists = clusterMonitorings.find((monitoring) => monitoring.name === value);
                      if (!value) {
                        return Promise.reject('Invalid name');
                      } else if (nameExists) {
                        return Promise.reject('File Monitoring with same name already exists');
                      } else {
                        return Promise.resolve();
                      }
                    },
                  },
                ]}>
                <Input></Input>
              </Form.Item>
              <Form.Item
                label="Cron (How often to monitor)"
                // onChange={(e) => setMonitoringDetails({ ...monitoringDetails, cron: e.target.value })}
                name="cron"
                rules={[
                  { required: true, message: 'Required field' },
                  {
                    validator: async (_, cron) => {
                      if (cron) {
                        try {
                          cronstrue.toString(cron);
                        } catch (err) {
                          return Promise.reject(err);
                        }
                      }
                    },
                  },
                ]}
                extra={
                  cornExplainer ? (
                    <span style={{ color: '#1890ff' }}>{cornExplainer.message}</span>
                  ) : (
                    <Typography.Link href="https://crontab.cronhub.io/" target="_blank">
                      Click here to create cron expression
                    </Typography.Link>
                  )
                }>
                <Input
                  placeholder="*/5 * * * *"
                  // onChange={(e) => {
                  //   setCorn(e.target.value);
                  // }}
                />
              </Form.Item>
              <Form.Item
                label="Notify when"
                name="notifyCondition"
                rules={[{ required: true, message: 'Required filed' }]}>
                <Select
                  placeholder="Select one or more"
                  mode="multiple"
                  options={notifyOptions}
                  onChange={(value) => {
                    setNotifyConditions(value);
                  }}></Select>
              </Form.Item>

              {notifyConditions.includes('TargetClusterAlertSize') && selectedEngines.length > 0 ? (
                <Form.List name="names">
                  {engines.map((item, index) => (
                    <Form.Item key={item} name={[index]}>
                      <Input placeholder={item} />
                    </Form.Item>
                  ))}
                </Form.List>
              ) : null}

              {/* <Form.Item name="targetClusterMaxSize">{engineMaxSizeLimit}</Form.Item> */}
              {/* {notifyConditions.includes('TargetClusterAlertSize') && selectedEngines.length > 0 ? (
                <Form.List
                  style={{ width: '50%' }}
                  name="xxxxxxxxxx"
                  rules={[
                    {
                      validator: (_, value) => {
                        console.log(value);
                        // const valueArray = value.split(',');
                        // console.log('------------------------------------------');
                        // console.log(valueArray);
                        // console.log('------------------------------------------');
                        // const lastValueNotInt = isNaN(parseInt(valueArray[value.length - 1]));
                        // console.log('------------------------------------------');
                        // console.log(lastValueNotInt);
                        // console.log('------------------------------------------');
                        Promise.resolve();
                        // if (lastValueNotInt) {
                        //   return Promise.reject('Invalid size');
                        // } else {
                        //   return Promise.resolve();
                        // }
                      },
                    },
                  ]}>
                  {selectedEngines.map((engine) => {
                    return (
                      <Form.Item key={engine} style={{ marginTop: '5px' }}>
                        <Input
                          className="clusterMonitoring_engines"
                          addonBefore={engine}
                          type="number"
                          placeholder="Size in %"
                        />
                      </Form.Item>
                    );
                  })}
                </Form.List>
              ) : null} */}
              <Form.Item name="monitoringActive" valuePropName="checked" noStyle>
                <Checkbox>Start monitoring now</Checkbox>
              </Form.Item>
            </TabPane>
            {/* -------------------------------------------------------------------------------------------------------------------------- */}
            <TabPane tab={<span>Notifications </span>} key="3">
              <Form.Item
                label="Notification Channel"
                name="notificationChannels"
                rules={[{ required: true, message: 'Required Field' }]}>
                <Select
                  options={notificationOptions}
                  mode="tags"
                  onChange={(value) => {
                    setNotificationDetails({ ...notificationDetails, notificationChannel: value });
                  }}></Select>
              </Form.Item>

              {/*  --------------------------------------------------------------------------- */}
              {notificationDetails?.notificationChannel?.includes('eMail') ? (
                <Form.List name="emails">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field, _index) => (
                        <Form.Item required={true} key={field.key}>
                          <div style={{ display: 'flex', placeItems: 'center' }}>
                            <Form.Item
                              {...field}
                              validateTrigger={['onChange', 'onBlur']}
                              type="email"
                              rules={[
                                {
                                  required: true,
                                  whitespace: true,
                                  message: 'Invalid e-mail address.',
                                },
                              ]}
                              noStyle>
                              <Input placeholder="E-mail" />
                            </Form.Item>
                            {fields.length > 1 ? (
                              <MinusCircleOutlined
                                className="dynamic-delete-button"
                                onClick={() => remove(field.name)}
                                style={{ marginLeft: '10px' }}
                              />
                            ) : null}
                          </div>
                        </Form.Item>
                      ))}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          icon={<PlusOutlined />}
                          width={'100%'}
                          style={{ width: '100% -10px' }}>
                          Add E-mail
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              ) : null}
              {/*  --------------------------------------------------------------------------- */}

              {/*  --------------------------------------------------------------------------- */}
              {notificationDetails?.notificationChannel?.includes('msTeams') ? (
                <Form.List name="msTeamsGroups">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field, _index) => (
                        <Form.Item required={false} key={field.key}>
                          <div style={{ display: 'flex', placeItems: 'center' }}>
                            <Form.Item
                              {...field}
                              validateTrigger={['onChange', 'onBlur']}
                              rules={[
                                {
                                  required: true,
                                  whitespace: true,
                                  message: 'Invalid Teams webhook URL',
                                },
                              ]}
                              noStyle>
                              <Input placeholder="Teams incoming webhook URL" />
                            </Form.Item>
                            {fields.length > 1 ? (
                              <MinusCircleOutlined
                                className="dynamic-delete-button"
                                onClick={() => remove(field.name)}
                                style={{ marginLeft: '10px' }}
                              />
                            ) : null}
                          </div>
                        </Form.Item>
                      ))}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          icon={<PlusOutlined />}
                          style={{ width: '100% -10px' }}>
                          Add Teams Group
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              ) : null}
            </TabPane>
          </Tabs>
        </Form>
      </Modal>
    </>
  );
}

export default ClusterMonitoring;
