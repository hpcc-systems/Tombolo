/* eslint-disable unused-imports/no-unused-imports */
/* eslint-disable unused-imports/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Select, message } from 'antd';
import { isEmail } from 'validator';
import { handleBulkUpdateJobMonitorings } from './jobMonitoringUtils';
import { set } from '@ant-design/plots/es/core/utils';

const { useForm } = Form;

const BulkUpdateModal = ({
  bulkEditModalVisibility,
  setBulkEditModalVisibility,
  jobMonitorings,
  setJobMonitorings,
  selectedRows,
}) => {
  // Original
  const [primaryContacts, setPrimaryContacts] = useState([]);
  const [secondaryContacts, setSecondaryContacts] = useState([]);
  const [notifyContacts, setNotifyContacts] = useState([]);

  // Added
  const [newPrimaryContacts, setNewPrimaryContacts] = useState([]);
  const [newSecondaryContacts, setNewSecondaryContacts] = useState([]);
  const [newNotifyContacts, setNewNotifyContacts] = useState([]);

  //Removed
  const [removedPrimaryContacts, setRemovedPrimaryContacts] = useState([]);
  const [removedSecondaryContacts, setRemovedSecondaryContacts] = useState([]);
  const [removedNotifyContacts, setRemovedNotifyContacts] = useState([]);

  // Handle Primary Contact Change
  const handlePrimaryContactsChange = (value) => {
    const addedPc = value.filter((v) => !primaryContacts.includes(v));
    const removedPc = primaryContacts.filter((v) => !value.includes(v));

    setNewPrimaryContacts(addedPc);
    setRemovedPrimaryContacts(removedPc);
  };

  // Handle Secondary Contact Change
  const handleSecondaryContactsChange = (value) => {
    const addedSc = value.filter((v) => !secondaryContacts.includes(v));
    const removedSc = secondaryContacts.filter((v) => !value.includes(v));

    setNewSecondaryContacts(addedSc);
    setRemovedSecondaryContacts(removedSc);
  };

  // handle Notify Contact Change
  const handleNotifyContactsChange = (value) => {
    const addedNc = value.filter((v) => !notifyContacts.includes(v));
    const removedNc = notifyContacts.filter((v) => !value.includes(v));

    setNewNotifyContacts(addedNc);
    setRemovedNotifyContacts(removedNc);
  };

  // When modal is cancelled - reset states
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

  // Get contacts from all selected row , remove duplicates and set to the state
  useEffect(() => {
    // selected rows details
    selectedRows.forEach(({ metaData }) => {
      const { notificationMetaData } = metaData || {};
      const { primaryContacts, secondaryContacts, notifyContacts } = notificationMetaData || [];

      if (primaryContacts) {
        setPrimaryContacts((prev) => [...new Set([...prev, ...primaryContacts])]);
      }

      if (secondaryContacts) {
        setSecondaryContacts((prev) => [...new Set([...prev, ...secondaryContacts])]);
      }

      if (notifyContacts) {
        setNotifyContacts((prev) => [...new Set([...prev, ...notifyContacts])]);
      }
    });
  }, [jobMonitorings, selectedRows]);

  // Set fields value when primary, secondary and notify contacts change
  useEffect(() => {
    form.setFieldsValue({ primaryContacts, secondaryContacts, notifyContacts });
  }, [primaryContacts, secondaryContacts, notifyContacts]);

  // When save button is clicked
  const saveUpdate = async () => {
    const updatedMetaData = [];

    try {
      selectedRows.forEach((row) => {
        const { metaData } = row || {};
        const { notificationMetaData } = metaData || {};
        const { primaryContacts, secondaryContacts, notifyContacts } = notificationMetaData || {};

        let meta = {};

        // Check if 'notificationMetaData' exists and it has a 'primaryContacts' property
        if (primaryContacts) {
          // Filter out the contacts that are in the 'removedPrimaryContacts' list
          const remainingContacts = primaryContacts.filter((v) => !removedPrimaryContacts.includes(v));

          // Combine the remaining contacts with the new contacts
          const combinedContacts = [...remainingContacts, ...newPrimaryContacts];

          // Remove duplicates by creating a Set (as Set only allows unique values) and then spreading it back into an array
          const uniqueContacts = [...new Set(combinedContacts)];

          // Update 'primaryContacts' with the new unique contacts
          meta.primaryContacts = uniqueContacts;
        }

        if (secondaryContacts) {
          // Filter out the contacts that are in the 'removedSecondaryContacts' list
          const remainingContacts = secondaryContacts.filter((v) => !removedSecondaryContacts.includes(v));

          // Combine the remaining contacts with the new contacts
          const combinedContacts = [...remainingContacts, ...newSecondaryContacts];

          // Remove duplicates by creating a Set (as Set only allows unique values) and then spreading it back into an array
          const uniqueContacts = [...new Set(combinedContacts)];

          // Update 'secondaryContacts' with the new unique contacts
          meta.secondaryContacts = uniqueContacts;
        }

        if (notifyContacts) {
          // Filter out the contacts that are in the 'removedNotifyContacts' list
          const remainingContacts = notifyContacts.filter((v) => !removedNotifyContacts.includes(v));

          // Combine the remaining contacts with the new contacts
          const combinedContacts = [...remainingContacts, ...newNotifyContacts];

          // Remove duplicates by creating a Set (as Set only allows unique values) and then spreading it back into an array
          const uniqueContacts = [...new Set(combinedContacts)];

          meta.notifyContacts = uniqueContacts;
        }

        if (meta?.primaryContacts.length < 1) {
          message.error(`Primary contact is mandatory. ${row.monitoringName} does not have any`);
          return;
        }

        updatedMetaData.push({
          id: row.id,
          metaData: { ...metaData, notificationMetaData: { ...metaData.notificationMetaData, ...meta } },
        });
      });

      // Update
      await handleBulkUpdateJobMonitorings({ updatedData: updatedMetaData });
      const allUpdatedIds = updatedMetaData.map((data) => data.id);
      const newJobMonitoringData = jobMonitorings.map((job) => {
        if (allUpdatedIds.includes(job.id)) {
          const updatedJob = updatedMetaData.find((data) => data.id === job.id);
          return { ...job, metaData: updatedJob.metaData };
        }
        return job;
      });
      setJobMonitorings(newJobMonitoringData);
      resetState();
    } catch (err) {
      message.error(err.message);
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
              validator: (_, value) => {
                if (!value || value.length === 0) {
                  return Promise.reject(new Error('Please add at least one email!'));
                }
                if (!value.every((v) => isEmail(v))) {
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

        <Form.Item
          label="Secondary Contact(s)"
          name="secondaryContacts"
          rules={[
            {
              validator: (_, value) => {
                if (!value.every((v) => isEmail(v))) {
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
              validator: (_, value) => {
                if (!value.every((v) => isEmail(v))) {
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
      </Form>
    </Modal>
  );
};

export default BulkUpdateModal;
