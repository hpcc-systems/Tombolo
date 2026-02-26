import React, { useEffect, useState } from 'react';
import { Button, Form, Modal, Select } from 'antd';
import { handleError } from '@/components/common/handleResponse';
import { isEmail } from 'validator';
import jobMonitoringService from '@/services/jobMonitoring.service';
import { useSelector } from 'react-redux';
import { APPROVAL_STATUS } from '@/components/common/Constants';
import { JobMonitoringDTO } from '@tombolo/shared';

const { useForm } = Form;

interface Props {
  bulkEditModalVisibility: boolean;
  setBulkEditModalVisibility: (v: boolean) => void;
  jobMonitorings: JobMonitoringDTO[];
  setJobMonitorings: (v: JobMonitoringDTO[] | ((p: JobMonitoringDTO[]) => JobMonitoringDTO[])) => void;
  selectedRows: JobMonitoringDTO[];
  setSelectedRows: (v: JobMonitoringDTO[] | ((p: JobMonitoringDTO[]) => JobMonitoringDTO[])) => void;
}

const BulkUpdateModal: React.FC<Props> = ({
  bulkEditModalVisibility,
  setBulkEditModalVisibility,
  jobMonitorings,
  setJobMonitorings,
  selectedRows,
  setSelectedRows,
}) => {
  const applicationId = useSelector((state: any) => state.application.application.applicationId);
  const integrations = useSelector((state: any) => state.application.integrations);

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
    selectedRows.forEach(({ metaData }: any) => {
      const notificationMetaData = metaData?.notificationMetaData || {};
      const pc: string[] = notificationMetaData.primaryContacts || [];
      const sc: string[] = notificationMetaData.secondaryContacts || [];
      const nc: string[] = notificationMetaData.notifyContacts || [];

      if (pc && pc.length > 0) {
        setPrimaryContacts(prev => Array.from(new Set([...prev, ...pc])));
      }

      if (sc && sc.length > 0) {
        setSecondaryContacts(prev => Array.from(new Set([...prev, ...sc])));
      }

      if (nc && nc.length > 0) {
        setNotifyContacts(prev => Array.from(new Set([...prev, ...nc])));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobMonitorings, selectedRows]);

  useEffect(() => {
    form.setFieldsValue({ primaryContacts, secondaryContacts, notifyContacts });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryContacts, secondaryContacts, notifyContacts]);

  const saveUpdate = async () => {
    const updatedMetaData: any[] = [];

    try {
      selectedRows.forEach((row: any) => {
        const metaData = row?.metaData || {};
        const notificationMetaData = metaData?.notificationMetaData || {};
        const pc: string[] = notificationMetaData.primaryContacts || [];
        const sc: string[] = notificationMetaData.secondaryContacts || [];
        const nc: string[] = notificationMetaData.notifyContacts || [];

        const meta: any = {};

        if (pc) {
          const remainingContacts = pc.filter(v => !removedPrimaryContacts.includes(v));
          const combinedContacts = [...remainingContacts, ...newPrimaryContacts];
          meta.primaryContacts = Array.from(new Set(combinedContacts));
        }

        if (sc) {
          const remainingContacts = sc.filter(v => !removedSecondaryContacts.includes(v));
          const combinedContacts = [...remainingContacts, ...newSecondaryContacts];
          meta.secondaryContacts = Array.from(new Set(combinedContacts));
        }

        if (nc) {
          const remainingContacts = nc.filter(v => !removedNotifyContacts.includes(v));
          const combinedContacts = [...remainingContacts, ...newNotifyContacts];
          meta.notifyContacts = Array.from(new Set(combinedContacts));
        }

        if (!meta.primaryContacts || meta.primaryContacts.length < 1) {
          handleError(`Primary contact is mandatory. ${row.monitoringName} does not have any`);
          return;
        }

        updatedMetaData.push({
          id: row.id,
          metaData: { ...metaData, notificationMetaData: { ...metaData.notificationMetaData, ...meta } },
        });
      });

      await jobMonitoringService.bulkUpdate({ updatedData: updatedMetaData });
      const allUpdatedIds = updatedMetaData.map(data => data.id);
      const newJobMonitoringData = jobMonitorings.map(job => {
        if (allUpdatedIds.includes(job.id)) {
          const updatedJob = updatedMetaData.find(data => data.id === job.id);
          return { ...job, metaData: updatedJob.metaData, isActive: false, approvalStatus: APPROVAL_STATUS.PENDING };
        }
        return job;
      });

      setSelectedRows((prev: JobMonitoringDTO[]) =>
        prev.map(row => {
          const updatedRow = updatedMetaData.find(data => data.id === row.id);
          return {
            ...row,
            metaData: updatedRow.metaData,
            isActive: false,
            approvalStatus: APPROVAL_STATUS.PENDING,
          } as JobMonitoringDTO;
        })
      );

      setJobMonitorings(newJobMonitoringData);
      resetState();
    } catch (err: any) {
      handleError(err.message);
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

        {integrations &&
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
    </Modal>
  );
};

export default BulkUpdateModal;
