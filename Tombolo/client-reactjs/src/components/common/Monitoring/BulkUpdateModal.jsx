import React, { useEffect, useState } from 'react';
import { Button, Form, message, Modal, Select } from 'antd';
import { isEmail } from 'validator';
import { useSelector } from 'react-redux';

const { useForm } = Form;

const BulkUpdateModal = ({
  bulkEditModalVisibility,
  setBulkEditModalVisibility,
  monitorings,
  setMonitorings,
  selectedRows,
  setSelectedRows,
  monitoringType,
  handleBulkUpdateMonitorings,
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

  // Get contacts from all selected rows, remove duplicates and set to the state
  useEffect(() => {
    // Reset contact states when modal opens
    setPrimaryContacts([]);
    setSecondaryContacts([]);
    setNotifyContacts([]);

    // selected rows details
    selectedRows.forEach(({ metaData }) => {
      const { notificationMetaData, contacts } = metaData || {};
      const { primaryContacts, secondaryContacts, notifyContacts } = notificationMetaData || contacts || {};

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
  }, [selectedRows]);

  // Set fields value when primary, secondary and notify contacts change
  useEffect(() => {
    form.setFieldsValue({ primaryContacts, secondaryContacts, notifyContacts });
  }, [primaryContacts, secondaryContacts, notifyContacts]);

  // When the save button is clicked
  const saveUpdate = async () => {
    const updatedMetaData = [];
    let hasError = false;

    try {
      selectedRows.forEach((row) => {
        const { metaData } = row || {};
        const { notificationMetaData, contacts } = metaData || {};
        const {
          primaryContacts = [],
          secondaryContacts = [],
          notifyContacts = [],
        } = notificationMetaData || contacts || {}; // For backward compatibility

        let meta = {};

        // Handle primary contacts
        if (primaryContacts || newPrimaryContacts.length > 0) {
          // Filter out the contacts that are in the 'removedPrimaryContacts' list
          const remainingContacts = primaryContacts.filter((v) => !removedPrimaryContacts.includes(v));

          // Combine the remaining contacts with the new contacts
          const combinedContacts = [...remainingContacts, ...newPrimaryContacts];

          // Remove duplicates by creating a Set and then spreading it back into an array
          // Update 'primaryContacts' with the new unique contacts
          meta.primaryContacts = [...new Set(combinedContacts)];
        }

        // Handle secondary contacts
        if (secondaryContacts || newSecondaryContacts.length > 0) {
          // Filter out the contacts that are in the 'removedSecondaryContacts' list
          const remainingContacts = secondaryContacts.filter((v) => !removedSecondaryContacts.includes(v));

          // Combine the remaining contacts with the new contacts
          const combinedContacts = [...remainingContacts, ...newSecondaryContacts];

          // Remove duplicates
          meta.secondaryContacts = [...new Set(combinedContacts)];
        }

        // Handle notify contacts
        if (notifyContacts || newNotifyContacts.length > 0) {
          // Filter out the contacts that are in the 'removedNotifyContacts' list
          const remainingContacts = notifyContacts.filter((v) => !removedNotifyContacts.includes(v));

          // Combine the remaining contacts with the new contacts
          const combinedContacts = [...remainingContacts, ...newNotifyContacts];

          // Remove duplicates
          meta.notifyContacts = [...new Set(combinedContacts)];
        }

        // Validate primary contacts are present
        if (!meta.primaryContacts || meta.primaryContacts.length < 1) {
          message.error(`Primary contact is mandatory. ${row.monitoringName} does not have any`);
          hasError = true;
          return;
        }

        const updatedNotificationMetaData = { ...metaData.notificationMetaData, ...meta };

        // For cost monitoring, explicitly remove secondary and notify contacts
        if (monitoringType === 'cost') {
          delete updatedNotificationMetaData.secondaryContacts;
          delete updatedNotificationMetaData.notifyContacts;
        }

        updatedMetaData.push({
          id: row.id,
          metaData: {
            ...metaData,
            notificationMetaData: updatedNotificationMetaData,
            contacts: updatedNotificationMetaData, // For backward compatibility
          },
        });
      });

      if (hasError) {
        return;
      }

      // Update using the bulk update function
      await handleBulkUpdateMonitorings({ updatedData: updatedMetaData });

      const allUpdatedIds = updatedMetaData.map((data) => data.id);
      const newCostMonitoringData = monitorings.map((cost) => {
        if (allUpdatedIds.includes(cost.id)) {
          const updatedCost = updatedMetaData.find((data) => data.id === cost.id);
          return { ...cost, metaData: updatedCost.metaData, isActive: false, approvalStatus: 'Pending' };
        }
        return cost;
      });

      // Set selected monitoring to the updated monitoring
      setSelectedRows((prev) =>
        prev.map((row) => {
          const updatedRow = updatedMetaData.find((data) => data.id === row.id);
          return { ...row, metaData: updatedRow.metaData, isActive: false, approvalStatus: 'Pending' };
        })
      );

      setMonitorings(newCostMonitoringData);
      message.success('Cost monitorings updated successfully');
      resetState();
    } catch (err) {
      message.error(err.message || 'Failed to update cost monitorings');
    }
  };

  return (
    <Modal
      title="Bulk Edit Cost Monitoring"
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

        {monitoringType !== 'cost' &&
          integrations &&
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
                      if (value && !value.every((v) => isEmail(v))) {
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
                      if (value && !value.every((v) => isEmail(v))) {
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
