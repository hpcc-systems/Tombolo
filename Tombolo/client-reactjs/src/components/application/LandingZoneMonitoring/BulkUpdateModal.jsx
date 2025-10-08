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
}) => {
  const applicationId = useSelector((state) => state.application.application.applicationId);
  const integrations = useSelector((state) => state.application.integrations);

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
      const { contacts } = metaData || {};
      const { primaryContacts, secondaryContacts, notifyContacts } = contacts || {};

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
  }, [landingZoneMonitoring, selectedRows]);

  // Set fields value when primary, secondary and notify contacts change
  useEffect(() => {
    form.setFieldsValue({ primaryContacts, secondaryContacts, notifyContacts });
  }, [primaryContacts, secondaryContacts, notifyContacts]);

  // Set fields value when primary, secondary and notify contacts change
  useEffect(() => {
    form.setFieldsValue({ primaryContacts });
  }, [primaryContacts]);

  // When save button is clicked
  const saveUpdate = async () => {
    const updatedRows = [];

    try {
      selectedRows.forEach((row) => {
        const { metaData } = row;
        const { contacts } = metaData;
        const { primaryContacts, secondaryContacts, notifyContacts } = contacts;

        let newContacts = {};

        // Check if 'notificationMetaData' exists and it has a 'primaryContacts' property
        if (primaryContacts) {
          // Filter out the contacts that are in the 'removedPrimaryContacts' list
          const remainingContacts = primaryContacts.filter((v) => !removedPrimaryContacts.includes(v));

          // Combine the remaining contacts with the new contacts
          const combinedContacts = [...remainingContacts, ...newPrimaryContacts];

          // Remove duplicates by creating a Set (as Set only allows unique values) and then spreading it back into an array
          const uniqueContacts = [...new Set(combinedContacts)];

          // Update 'primaryContacts' with the new unique contacts
          newContacts.primaryContacts = uniqueContacts;
        }

        if (secondaryContacts) {
          // Filter out the contacts that are in the 'removedSecondaryContacts' list
          const remainingContacts = secondaryContacts.filter((v) => !removedSecondaryContacts.includes(v));

          // Combine the remaining contacts with the new contacts
          const combinedContacts = [...remainingContacts, ...newSecondaryContacts];

          // Remove duplicates by creating a Set (as Set only allows unique values) and then spreading it back into an array
          const uniqueContacts = [...new Set(combinedContacts)];

          // Update 'secondaryContacts' with the new unique contacts
          newContacts.secondaryContacts = uniqueContacts;
        }

        if (notifyContacts) {
          // Filter out the contacts that are in the 'removedNotifyContacts' list
          const remainingContacts = notifyContacts.filter((v) => !removedNotifyContacts.includes(v));

          // Combine the remaining contacts with the new contacts
          const combinedContacts = [...remainingContacts, ...newNotifyContacts];

          // Remove duplicates by creating a Set (as Set only allows unique values) and then spreading it back into an array
          const uniqueContacts = [...new Set(combinedContacts)];

          newContacts.notifyContacts = uniqueContacts;
        }

        if (newContacts?.primaryContacts.length < 1) {
          handleError(`Primary contact is mandatory. ${row.monitoringName} does not have any`);
          return;
        }

        updatedRows.push({ metaData: { ...metaData, contacts: newContacts }, id: row.id });
      });

      // Update
      // await handleBulkUpdateLzMonitorings(updatedRows);
      console.log('------------------------');
      console.log('updatedRows', updatedRows);
      console.log('------------------------');
      await landingZoneMonitoringService.bulkUpdate(updatedRows);

      handleSuccess('Landing zone monitoring updated successfully');

      // Set selected monitoring to the updated monitoring
      setLandingZoneMonitoring((prev) =>
        prev.map((row) => {
          const updatedRow = updatedRows.find((data) => data.id === row.id);
          return flattenObject({ ...row, metaData: updatedRow?.metaData });
        })
      );

      resetState();
    } catch (err) {
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

        {integrations &&
          integrations.some(
            (integration) => integration.name === 'ASR' && integration.application_id === applicationId
          ) && (
            <>
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
            </>
          )}
      </Form>
    </Modal>
  );
};

export default BulkUpdateModal;
