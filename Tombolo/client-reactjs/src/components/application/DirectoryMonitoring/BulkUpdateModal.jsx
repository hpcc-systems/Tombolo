import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Select, message } from 'antd';
import { isEmail } from 'validator';
import { handleBulkUpdateDirectoryMonitorings } from './Utils';

const { useForm } = Form;

const BulkUpdateModal = ({
  bulkEditModalVisibility,
  setBulkEditModalVisibility,
  directoryMonitorings,
  selectedRows,
  setSelectedRows,
  fetchAllDirectoryMonitorings,
}) => {
  // Original
  const [primaryContacts, setPrimaryContacts] = useState([]);

  // Added
  const [newPrimaryContacts, setNewPrimaryContacts] = useState([]);

  //Removed
  const [removedPrimaryContacts, setRemovedPrimaryContacts] = useState([]);

  // Handle Primary Contact Change
  const handlePrimaryContactsChange = (value) => {
    const addedPc = value.filter((v) => !primaryContacts.includes(v));
    const removedPc = primaryContacts.filter((v) => !value.includes(v));

    setNewPrimaryContacts(addedPc);
    setRemovedPrimaryContacts(removedPc);
  };

  // When modal is cancelled - reset states
  const resetState = () => {
    setNewPrimaryContacts([]);
    setRemovedPrimaryContacts([]);
    setBulkEditModalVisibility(false);
  };

  const [form] = useForm();

  // Get contacts from all selected row , remove duplicates and set to the state
  useEffect(() => {
    // selected rows details
    selectedRows.forEach(({ metaData }) => {
      const { notificationMetaData } = metaData || {};
      const { primaryContacts } = notificationMetaData || [];

      if (primaryContacts) {
        setPrimaryContacts((prev) => [...new Set([...prev, ...primaryContacts])]);
      }
    });
  }, [directoryMonitorings, selectedRows]);

  // Set fields value when primary, secondary and notify contacts change
  useEffect(() => {
    form.setFieldsValue({ primaryContacts });
  }, [primaryContacts]);

  // When save button is clicked
  const saveUpdate = async () => {
    const updatedMetaData = [];

    try {
      selectedRows.forEach((row) => {
        const { metaData } = row || {};
        const { notificationMetaData } = metaData || {};
        const { primaryContacts } = notificationMetaData || {};

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
      const res = await handleBulkUpdateDirectoryMonitorings({ updatedData: updatedMetaData });

      if (res.message) {
        message.success('Directory monitoring updated successfully');
      }

      // Update the directory monitorings
      fetchAllDirectoryMonitorings();

      // Set selected monitoring to the updated monitoring
      setSelectedRows((prev) =>
        prev.map((row) => {
          const updatedRow = updatedMetaData.find((data) => data.id === row.id);
          return { ...row, metaData: updatedRow.metaData };
        })
      );

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
      </Form>
    </Modal>
  );
};

export default BulkUpdateModal;
