import React, { useEffect, useState } from 'react';
import { Button, Form, Modal, Select, Card } from 'antd';
import { isEmail } from 'validator';
import { useSelector } from 'react-redux';
import { APPROVAL_STATUS } from '@/components/common/Constants';
import { handleSuccess, handleError } from '@/components/common/handleResponse';

const { useForm } = Form;

const BulkUpdateModal: React.FC<any> = ({
  bulkEditModalVisibility,
  setBulkEditModalVisibility,
  monitorings,
  setMonitorings,
  selectedRows,
  setSelectedRows,
  monitoringType,
  handleBulkUpdateMonitorings,
}) => {
  const applicationId = useSelector((state: any) => state.application?.application?.applicationId);
  const integrations = useSelector((state: any) => state.application?.integrations);

  const [primaryContacts, setPrimaryContacts] = useState<string[]>([]);
  const [secondaryContacts, setSecondaryContacts] = useState<string[]>([]);
  const [notifyContacts, setNotifyContacts] = useState<string[]>([]);

  const [newPrimaryContacts, setNewPrimaryContacts] = useState<string[]>([]);
  const [newSecondaryContacts, setNewSecondaryContacts] = useState<string[]>([]);
  const [newNotifyContacts, setNewNotifyContacts] = useState<string[]>([]);

  const [removedPrimaryContacts, setRemovedPrimaryContacts] = useState<string[]>([]);
  const [removedSecondaryContacts, setRemovedSecondaryContacts] = useState<string[]>([]);
  const [removedNotifyContacts, setRemovedNotifyContacts] = useState<string[]>([]);

  const handlePrimaryContactsChange = (value: string[]) => {
    const addedPc = value.filter(v => !primaryContacts.includes(v));
    const removedPc = primaryContacts.filter(v => !value.includes(v));

    setNewPrimaryContacts(addedPc);
    setRemovedPrimaryContacts(removedPc);
  };

  const handleSecondaryContactsChange = (value: string[]) => {
    const addedSc = value.filter(v => !secondaryContacts.includes(v));
    const removedSc = secondaryContacts.filter(v => !value.includes(v));

    setNewSecondaryContacts(addedSc);
    setRemovedSecondaryContacts(removedSc);
  };

  const handleNotifyContactsChange = (value: string[]) => {
    const addedNc = value.filter(v => !notifyContacts.includes(v));
    const removedNc = notifyContacts.filter(v => !value.includes(v));

    setNewNotifyContacts(addedNc);
    setRemovedNotifyContacts(removedNc);
  };

  const resetState = () => {
    setNewPrimaryContacts([]);
    setNewSecondaryContacts([]);
    setNewNotifyContacts([]);
    setRemovedPrimaryContacts([]);
    setRemovedSecondaryContacts([]);
    setRemovedNotifyContacts([]);
    setBulkEditModalVisibility(false);
  };

  const [form] = useForm();

  useEffect(() => {
    setPrimaryContacts([]);
    setSecondaryContacts([]);
    setNotifyContacts([]);

    selectedRows.forEach(({ metaData }: any) => {
      const { notificationMetaData, contacts } = metaData || {};
      const { primaryContacts: pc, secondaryContacts: sc, notifyContacts: nc } = notificationMetaData || contacts || {};

      if (pc) setPrimaryContacts(prev => [...new Set([...prev, ...pc])]);
      if (sc) setSecondaryContacts(prev => [...new Set([...prev, ...sc])]);
      if (nc) setNotifyContacts(prev => [...new Set([...prev, ...nc])]);
    });
  }, [selectedRows]);

  useEffect(() => {
    form.setFieldsValue({ primaryContacts, secondaryContacts, notifyContacts });
  }, [primaryContacts, secondaryContacts, notifyContacts]);

  const saveUpdate = async () => {
    const updatedMetaData: any[] = [];
    let hasError = false;

    try {
      selectedRows.forEach((row: any) => {
        const { metaData } = row || {};
        const { notificationMetaData, contacts } = metaData || {};
        const {
          primaryContacts: pc = [],
          secondaryContacts: sc = [],
          notifyContacts: nc = [],
        } = notificationMetaData || contacts || {};

        let meta: any = {};

        if (pc || newPrimaryContacts.length > 0) {
          const remainingContacts = pc.filter((v: string) => !removedPrimaryContacts.includes(v));
          const combinedContacts = [...remainingContacts, ...newPrimaryContacts];
          meta.primaryContacts = [...new Set(combinedContacts)];
        }

        if (sc || newSecondaryContacts.length > 0) {
          const remainingContacts = sc.filter((v: string) => !removedSecondaryContacts.includes(v));
          const combinedContacts = [...remainingContacts, ...newSecondaryContacts];
          meta.secondaryContacts = [...new Set(combinedContacts)];
        }

        if (nc || newNotifyContacts.length > 0) {
          const remainingContacts = nc.filter((v: string) => !removedNotifyContacts.includes(v));
          const combinedContacts = [...remainingContacts, ...newNotifyContacts];
          meta.notifyContacts = [...new Set(combinedContacts)];
        }

        if (!meta.primaryContacts || meta.primaryContacts.length < 1) {
          handleError(`Primary contact is mandatory. ${row.monitoringName} does not have any`);
          hasError = true;
          return;
        }

        const updatedNotificationMetaData = { ...metaData.notificationMetaData, ...meta };

        if (monitoringType === 'cost') {
          delete updatedNotificationMetaData.secondaryContacts;
          delete updatedNotificationMetaData.notifyContacts;
        }

        updatedMetaData.push({
          id: row.id,
          metaData: {
            ...metaData,
            notificationMetaData: updatedNotificationMetaData,
            contacts: updatedNotificationMetaData,
          },
        });
      });

      if (hasError) return;

      await handleBulkUpdateMonitorings({ updatedData: updatedMetaData });

      const allUpdatedIds = updatedMetaData.map(d => d.id);
      const newCostMonitoringData = monitorings.map((cost: any) => {
        if (allUpdatedIds.includes(cost.id)) {
          const updatedCost = updatedMetaData.find(data => data.id === cost.id);
          return { ...cost, metaData: updatedCost.metaData, isActive: false, approvalStatus: APPROVAL_STATUS.PENDING };
        }
        return cost;
      });

      setSelectedRows((prev: any[]) =>
        prev.map(row => {
          const updatedRow = updatedMetaData.find(data => data.id === row.id);
          return { ...row, metaData: updatedRow.metaData, isActive: false, approvalStatus: APPROVAL_STATUS.PENDING };
        })
      );

      setMonitorings(newCostMonitoringData);
      const successMessage =
        monitoringType === 'orbit' ? 'Orbit monitorings updated successfully' : 'Cost monitorings updated successfully';
      handleSuccess(successMessage);
      resetState();
    } catch (err: any) {
      const errorMessage =
        monitoringType === 'orbit' ? 'Failed to update orbit monitorings' : 'Failed to update cost monitorings';
      handleError(err?.message || errorMessage);
    }
  };

  return (
    <Modal
      open={bulkEditModalVisibility}
      onCancel={resetState}
      destroyOnClose
      width={800}
      footer={[
        <Button key="cancel" onClick={() => setBulkEditModalVisibility(false)}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={saveUpdate}>
          Save
        </Button>,
      ]}>
      <Card>
        <Form form={form} layout="vertical">
          <Form.Item
            label="Primary Contact(s)"
            name="primaryContacts"
            required
            rules={[
              {
                validator: (_: any, value: string[]) => {
                  if (!value || value.length === 0) {
                    return Promise.reject(new Error('Please add at least one email!'));
                  }
                  if (!value.every(v => isEmail(v))) {
                    return Promise.reject(new Error('One or more emails are invalid'));
                  }
                  return Promise.resolve();
                },
              },
            ]}>
            <Select
              mode="tags"
              open={false}
              allowClear
              placeholder="Enter a comma-delimited list of email addresses"
              tokenSeparators={[',']}
              onChange={handlePrimaryContactsChange}
            />
          </Form.Item>

          {monitoringType !== 'cost' &&
            integrations &&
            integrations.some(
              (integration: any) => integration.name === 'ASR' && integration.application_id === applicationId
            ) && (
              <>
                <Form.Item
                  label="Secondary Contact(s)"
                  name="secondaryContacts"
                  rules={[
                    {
                      validator: (_: any, value: string[]) => {
                        if (value && !value.every(v => isEmail(v))) {
                          return Promise.reject(new Error('One or more emails are invalid'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}>
                  <Select
                    onChange={handleSecondaryContactsChange}
                    mode="tags"
                    allowClear
                    placeholder="Enter a comma-delimited list of email addresses"
                    tokenSeparators={[',']}
                  />
                </Form.Item>

                <Form.Item
                  label="Notify Contact(s)"
                  name="notifyContacts"
                  rules={[
                    {
                      validator: (_: any, value: string[]) => {
                        if (value && !value.every(v => isEmail(v))) {
                          return Promise.reject(new Error('One or more emails are invalid'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}>
                  <Select
                    onChange={handleNotifyContactsChange}
                    mode="tags"
                    allowClear
                    placeholder="Enter a comma-delimited list of email addresses"
                    tokenSeparators={[',']}
                  />
                </Form.Item>
              </>
            )}
        </Form>
      </Card>
    </Modal>
  );
};

export default BulkUpdateModal;
