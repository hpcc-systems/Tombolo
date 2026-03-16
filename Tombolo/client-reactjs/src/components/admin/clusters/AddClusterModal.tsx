import { useEffect, useState } from 'react';
import { Modal, Form, Row, Col, Input, Select, Button, Card, Spin, Alert, Typography, Checkbox } from 'antd';

import clustersService from '@/services/clusters.service';
import AddClusterSteps from './AddClusterSteps';
import EmailTagInput from '@/components/common/EmailTagInput';
import { handleSuccess } from '@/components/common/handleResponse';

import type { ClusterUI } from '@tombolo/shared';
import type { FC } from 'react';

// Constants
const { Option } = Select;
const { Text } = Typography;

interface AddClusterModalProps {
  displayAddClusterModal: boolean;
  setDisplayAddClusterModal: (v: boolean) => void;
  clusterWhiteList: ClusterUI[];
  clusters: ClusterUI[];
  setClusters: (c: ClusterUI[]) => void;
  tombolo_instance_name?: string;
}

interface CompletedStep {
  step: number;
  message?: string;
  cluster?: ClusterUI;
}

const AddClusterModal: FC<AddClusterModalProps> = ({
  displayAddClusterModal,
  setDisplayAddClusterModal,
  clusterWhiteList,
  clusters,
  setClusters,
  tombolo_instance_name,
}) => {
  const [form] = Form.useForm();

  const [requireCredentials, setRequireCredentials] = useState<boolean>(false);
  const [pingingCluster, setPingingCluster] = useState<boolean>(false);
  const [clusterReachable, setClusterReachable] = useState<boolean>(false);
  const [addingCluster, setAddingCluster] = useState<boolean>(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [allowSelfSigned, setAllowSelfSigned] = useState<boolean>(false);

  const [completedSteps, setCompletedSteps] = useState<CompletedStep[]>([]);
  const [displaySteps, setDisplaySteps] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedAndRemainingSteps, setCompletedAndRemainingSteps] = useState<CompletedStep[]>([]);
  const [errorEncountered, setErrorEncountered] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();
    setAbortController(controller);
    return () => controller.abort();
  }, []);

  const resetAllClusterAddSteps = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setCompletedAndRemainingSteps([]);
    setErrorEncountered(false);
  };

  const handleModalCancel = () => {
    form.resetFields();
    setRequireCredentials(false);
    setClusterReachable(false);
    setDisplayAddClusterModal(false);
    setPingingCluster(false);
    setCompletedSteps([]);
    setAddingCluster(false);
    resetAllClusterAddSteps();
  };

  const availableClusters = clusterWhiteList.filter(cluster => !clusters.find(c => c.name === cluster.name));

  const handleClusterChange = async () => {
    try {
      setClusterReachable(false);
      setPingingCluster(true);

      form.setFields([
        {
          name: 'name',
          errors: [],
        },
      ]);

      const clusterInfo = form.getFieldsValue(['name', 'username', 'password']);
      const response = await clustersService.checkHealth({ clusterInfo, abortController });

      if (response === 200) {
        setRequireCredentials(false);
      } else {
        setRequireCredentials(true);
      }
      setClusterReachable(true);
    } catch (e) {
      setClusterReachable(false);
      setRequireCredentials(false);
      form.setFields([
        {
          name: 'name',
          errors: ['Unable to establish connection with the cluster'],
        },
      ]);
      console.error(e);
    } finally {
      setPingingCluster(false);
    }
  };

  const submitNewCluster = async () => {
    resetAllClusterAddSteps();

    let validationErrors = false;
    try {
      await form.validateFields();
    } catch (_e) {
      validationErrors = true;
    }
    if (validationErrors) return;

    setDisplaySteps(true);

    if (requireCredentials) {
      try {
        const clusterInfo = form.getFieldsValue(['name', 'username', 'password']);
        const response = await clustersService.ping({ clusterInfo, abortController });
        if (response === 403) {
          form.setFields([
            { name: 'username', errors: ['Invalid username or password'] },
            { name: 'password', errors: [''] },
          ]);
          return;
        }
      } catch (_e) {
        form.setFields([{ name: 'name', errors: ['Unable to establish connection with the cluster'] }]);
        return;
      }
    }

    try {
      setAddingCluster(true);
      const payload = form.getFieldsValue();
      let processedLength = 0;

      await clustersService.addWithProgress({
        clusterInfo: payload,
        abortController,
        onProgress: (text: string) => {
          const newData = text.substring(processedLength);
          processedLength = text.length;

          if (newData.trim()) {
            const jsonStrings = newData
              .split('\n')
              .filter(str => str.trim() !== '')
              .map(str => str.replace(/^data: /, ''));

            const serverSentEvents = jsonStrings
              .map(str => {
                try {
                  return JSON.parse(str);
                } catch (_e) {
                  return null;
                }
              })
              .filter(event => event !== null) as CompletedStep[];

            setCompletedSteps(prev => [...prev, ...serverSentEvents]);

            serverSentEvents.forEach(event => {
              if (event.step === 99) {
                throw new Error(event.message || 'Unknown error');
              }

              if (event.cluster) {
                setClusters([...clusters, event.cluster]);
                setRequireCredentials(false);
                handleSuccess('Cluster added successfully');
                form.resetFields();
                setDisplayAddClusterModal(false);
                setAddingCluster(false);
                setDisplaySteps(false);
              }
            });
          }
        },
      });
    } catch (err: any) {
      if (!completedSteps.find(step => step.step === 99)) {
        setCompletedAndRemainingSteps(prev => [...prev, { step: 99, message: err.message }]);
      }
      setErrorEncountered(true);
      setDisplaySteps(true);
      setAddingCluster(false);
    }
  };

  return (
    <Modal
      open={displayAddClusterModal}
      onCancel={handleModalCancel}
      maskClosable={false}
      title="Add Cluster"
      width={800}
      closable={true}
      footer={[
        <Button key="cancel" onClick={handleModalCancel} type="primary" ghost>
          Cancel
        </Button>,
        !addingCluster && (
          <Button key="save" type="primary" onClick={submitNewCluster}>
            {errorEncountered ? 'Retry' : 'Save'}
          </Button>
        ),
      ]}>
      <>
        {displaySteps && (
          <AddClusterSteps
            completedSteps={completedSteps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            completedAndRemainingSteps={completedAndRemainingSteps}
            setCompletedAndRemainingSteps={setCompletedAndRemainingSteps}
            errorEncountered={errorEncountered}
          />
        )}

        {!addingCluster && (
          <Card size="small">
            <Spin tip={`Pinging Cluster .. `} spinning={pingingCluster}>
              <Form layout="vertical" form={form}>
                <Form.Item
                  label="Cluster"
                  name="name"
                  required
                  rules={[{ required: true, message: 'Please select a cluster' }]}>
                  <Select onChange={handleClusterChange}>
                    {availableClusters.map(cluster => (
                      <Option key={cluster.name} value={cluster.name}>
                        {cluster.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label={null} name="allowSelfSigned" valuePropName="checked">
                  <Checkbox name="allowSelfSigned" onChange={() => setAllowSelfSigned(!allowSelfSigned)}>
                    Allow Self Signed Certificates
                  </Checkbox>
                </Form.Item>

                {allowSelfSigned && (
                  <a
                    href="https://hpcc-systems.github.io/Tombolo/docs/User-Guides/self-signed-certs"
                    target="_blank"
                    rel="noreferrer">
                    See instructions for self signed certificates
                  </a>
                )}

                <EmailTagInput label="Admin Emails" name="adminEmails" required />

                {requireCredentials && (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          label="Username"
                          name="username"
                          required
                          rules={[{ required: true, message: 'Please enter a username' }]}>
                          <Input autoComplete="off" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <input type="text" style={{ display: 'none' }} />
                        <Form.Item
                          label="Password"
                          name="password"
                          required
                          rules={[{ required: true, message: 'Please enter a password' }]}>
                          <Input.Password autoComplete="new-password" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )}
              </Form>
            </Spin>
            {!requireCredentials && clusterReachable && tombolo_instance_name && !addingCluster && (
              <Alert
                banner
                type="info"
                style={{ padding: '5px 15px' }}
                message={
                  <span>
                    Tombolo will execute jobs in the HPCC cluster using the username{' '}
                    <Text strong>{tombolo_instance_name}</Text>
                  </span>
                }
              />
            )}
          </Card>
        )}
      </>
    </Modal>
  );
};

export default AddClusterModal;
