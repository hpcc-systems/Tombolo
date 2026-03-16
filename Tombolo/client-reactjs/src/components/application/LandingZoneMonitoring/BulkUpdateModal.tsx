import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Select } from 'antd';
import { handleError, handleSuccess } from '@/components/common/handleResponse';
import { isEmail } from 'validator';
import { useSelector } from 'react-redux';

import { flattenObject } from '../../common/CommonUtil';
import landingZoneMonitoringService from '../../../services/landingZoneMonitoring.service';

const { useForm } = Form;

const BulkUpdateModal = ({
  bulkEditModalVisibility,
  setBulkEditModalVisibility,
  landingZoneMonitoring,
  selectedRows,
  setLandingZoneMonitoring,
}: any) => {
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
      const { contacts } = metaData || {};
      const { primaryContacts: pc, secondaryContacts: sc, notifyContacts: nc } = contacts || {};

      if (pc) {
        setPrimaryContacts(prev => [...new Set([...prev, ...pc])]);
      }

      if (sc) {
        setSecondaryContacts(prev => [...new Set([...prev, ...sc])]);
      }

      if (nc) {
        setNotifyContacts(prev => [...new Set([...prev, ...nc])]);
      }
    });
  }, [landingZoneMonitoring, selectedRows]);

  useEffect(() => {
    form.setFieldsValue({ primaryContacts, secondaryContacts, notifyContacts });
  }, [primaryContacts, secondaryContacts, notifyContacts]);

  const saveUpdate = async () => {
    const updatedRows: any[] = [];

    try {
      selectedRows.forEach((row: any) => {
        const { metaData } = row;
        const { contacts } = metaData;
        const { primaryContacts: pc, secondaryContacts: sc, notifyContacts: nc } = contacts;

        let newContacts: any = {};

        if (pc) {
          const remainingContacts = pc.filter((v: string) => !removedPrimaryContacts.includes(v));
          const combinedContacts = [...remainingContacts, ...newPrimaryContacts];
          const uniqueContacts = [...new Set(combinedContacts)];
          newContacts.primaryContacts = uniqueContacts;
        }

        if (sc) {
          const remainingContacts = sc.filter((v: string) => !removedSecondaryContacts.includes(v));
          const combinedContacts = [...remainingContacts, ...newSecondaryContacts];
          const uniqueContacts = [...new Set(combinedContacts)];
          newContacts.secondaryContacts = uniqueContacts;
        }

        if (nc) {
          const remainingContacts = nc.filter((v: string) => !removedNotifyContacts.includes(v));
          const combinedContacts = [...remainingContacts, ...newNotifyContacts];
          const uniqueContacts = [...new Set(combinedContacts)];
          newContacts.notifyContacts = uniqueContacts;
        }

        if (newContacts?.primaryContacts && newContacts.primaryContacts.length < 1) {
          handleError(`Primary contact is mandatory. ${row.monitoringName} does not have any`);
          return;
        }

        updatedRows.push({ metaData: { ...metaData, contacts: newContacts }, id: row.id });
      });

      await landingZoneMonitoringService.bulkUpdate(updatedRows);
      handleSuccess('Landing zone monitoring updated successfully');

      setLandingZoneMonitoring((prev: any[]) =>
        prev.map(row => {
          const updatedRow = updatedRows.find(data => data.id === row.id);
          return flattenObject({ ...row, metaData: updatedRow?.metaData });
        })
      );

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
                if (!value.every((v: string) => isEmail(v))) {
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
                      if (!value.every((v: string) => isEmail(v))) {
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
                      if (!value.every((v: string) => isEmail(v))) {
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
