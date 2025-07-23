import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, InputNumber, Row, Col, Select, Cascader, Input, message } from 'antd';
import { getDropzones, getDirectoryList, convertToMB } from '../Utils';
import { InfoCircleOutlined } from '@ant-design/icons';
import InfoDrawer from '../../../common/InfoDrawer';

//  Constants
const { Option } = Select;
const monitoringTypes = [
  { id: 1, label: 'Landing Zone Space', value: 'spaceUsage' },
  { id: 2, label: 'File(s) Not Moving', value: 'fileMovement' },
  { id: 3, label: 'File Count in a Directory', value: 'fileCount' },
];

const storageUnits = [
  { id: 0, label: 'MB', value: 'MB' },
  { id: 1, label: 'GB', value: 'GB' },
  { id: 2, label: 'TB', value: 'TB' },
  { id: 3, label: 'PB', value: 'PB' },
];

function MonitoringTab({
  form,
  clusters,
  setSelectedCluster,
  selectedCluster,
  lzMonitoringType,
  setLzMonitoringType,
  minSizeThreasoldUnit,
  maxSizeThreasoldUnit,
  setMinSizeThreasoldUnit,
  setMaxSizeThreasoldUnit,
}) {
  const [dropzones, setDropzones] = useState([]);
  const [machines, setMachines] = useState([]);
  const [directoryOptions, setDirectoryOptions] = useState([]);
  const [selectedDropzone, setSelectedDropzone] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [selectedUserGuideName, setSelectedUserGuideName] = useState('');

  // Ref to store current abort controller for canceling requests
  const abortControllerRef = useRef(null);
  const loadingTimeoutRef = useRef(null);

  // Set Threashold Unit
  const setThresholdUnit = (value, field) => {
    if (field === 'minThreshold') {
      setMinSizeThreasoldUnit(value);
    } else if (field === 'maxThreshold') {
      setMaxSizeThreasoldUnit(value);
    }
  };

  // Threashold Addons
  const renderThresholdAddon = (field) => (
    <Select
      defaultValue={field === 'minThreshold' ? minSizeThreasoldUnit : maxSizeThreasoldUnit}
      style={{ width: 80 }}
      onChange={(value) => setThresholdUnit(value, field)}>
      {storageUnits.map((unit) => (
        <Option key={unit.id} value={unit.value}>
          {unit.label}
        </Option>
      ))}
    </Select>
  );

  // When cluster is  changed get Dropzones and associated machines
  useEffect(() => {
    if (selectedCluster) {
      // Call getDropzones async function
      const fetchDropzones = async () => {
        try {
          const dz = await getDropzones(selectedCluster);
          setDropzones(dz);
        } catch (error) {
          console.error('Error fetching dropzones:', error);
        }
      };
      fetchDropzones();
    }
  }, [selectedCluster]);

  // Handle dropzone selection to populate machines - Clear dependent fields
  const handleDropzoneChange = (dropzoneName) => {
    const selectedDropzoneObj = dropzones.find((dz) => dz.Name === dropzoneName);
    setSelectedDropzone(selectedDropzoneObj);

    if (selectedDropzoneObj && selectedDropzoneObj.TpMachines && selectedDropzoneObj.TpMachines.TpMachine) {
      setMachines(selectedDropzoneObj.TpMachines.TpMachine);
    } else {
      setMachines([]);
    }

    // Clear dependent fields when dropzone changes
    setDirectoryOptions([]);
    setSelectedMachine(null);

    // Clear form values for dependent fields
    form.setFieldValue('machine', undefined);
    form.setFieldValue('directory', undefined);

    // Cancel any pending directory requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  // Handle machine selection to initialize directory options - Clear directory field
  const handleMachineChange = (Netaddress) => {
    const selectedMachineObj = machines.find((machine) => machine.Netaddress === Netaddress);
    setSelectedMachine(selectedMachineObj);

    // Clear directory field when machine changes
    form.setFieldValue('directory', undefined);

    // Cancel any pending directory requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    if (selectedMachineObj && selectedDropzone) {
      // Initialize directory options with root directory
      const rootOption = {
        label: selectedDropzone.Path || '/',
        value: selectedDropzone.Path || '/',
        isLeaf: false,
      };
      setDirectoryOptions([rootOption]);
    } else {
      setDirectoryOptions([]);
    }
  }; // Load directory data for cascader with proper error handling and request cancellation
  const loadDirectoryData = async (selectedOptions) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];

    if (!selectedCluster || !selectedDropzone || !selectedMachine) {
      message.error('Please select cluster, dropzone, and machine first');
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear any existing loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const currentAbortSignal = abortControllerRef.current.signal;

    // Add debouncing - wait 300ms before making the call
    loadingTimeoutRef.current = setTimeout(async () => {
      // Check if aborted before starting
      if (currentAbortSignal.aborted) {
        return;
      }

      // Set loading state
      setDirectoryLoading(true);
      targetOption.loading = true;
      setDirectoryOptions([...directoryOptions]); // Trigger re-render to show loading

      try {
        const response = await getDirectoryList({
          clusterId: selectedCluster.id,
          dropzoneName: selectedDropzone.Name,
          netaddr: selectedMachine.Netaddress,
          path: targetOption.value,
          signal: currentAbortSignal, // Use stored signal reference
        });

        // Check if request was aborted
        if (currentAbortSignal.aborted) {
          return;
        }

        if (response.success && response.data.files && response.data.files.PhysicalFileStruct) {
          const directories = response.data.files.PhysicalFileStruct.filter((item) => item.isDir).map((dir) => ({
            label: dir.name,
            value: `${targetOption.value}${targetOption.value.endsWith('/') ? '' : '/'}${dir.name}`,
            isLeaf: false, // New directories start as expandable
          }));

          if (directories.length > 0) {
            // Has subdirectories - set as branch node
            targetOption.children = directories;
            targetOption.isLeaf = false; // Ensure it's marked as expandable
          } else {
            // No subdirectories found - mark as leaf node
            targetOption.isLeaf = true;
            delete targetOption.children; // Remove children property completely
          }
        } else {
          // Handle API success but no data - mark as leaf
          targetOption.isLeaf = true;
          delete targetOption.children; // Remove children property completely
        }
      } catch (error) {
        // Don't show error if request was aborted (user moved to another option)
        if (error.name === 'AbortError') {
          return;
        }

        console.error('Error loading directory data:', error);

        // Mark as leaf node and remove children property
        targetOption.isLeaf = true;
        delete targetOption.children;

        // Show user-friendly error message
        message.error('Failed to load directory contents. Please try again.');
      } finally {
        // Only clear loading states if request wasn't aborted
        if (!currentAbortSignal.aborted) {
          setDirectoryLoading(false);
          delete targetOption.loading; // Remove loading property

          // Force re-render of cascader with updated options
          setDirectoryOptions([...directoryOptions]);

          // Clear the abort controller if it's still the current one
          if (abortControllerRef.current?.signal === currentAbortSignal) {
            abortControllerRef.current = null;
          }
        }
      }
    }, 300); // 300ms debounce
  };

  // Handle cluster change - Clear all dependent fields
  const handleClusterChange = (value) => {
    const selectedClusterDetails = clusters.find((cluster) => cluster.id === value);
    setSelectedCluster(selectedClusterDetails);

    // Clear all dependent fields when cluster changes
    setDropzones([]);
    setMachines([]);
    setDirectoryOptions([]);
    setSelectedDropzone(null);
    setSelectedMachine(null);

    // Clear form values for dependent fields
    form.setFieldValue('dropzone', undefined);
    form.setFieldValue('machine', undefined);
    form.setFieldValue('directory', undefined);

    // Cancel any pending directory requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  return (
    <div>
      <Form form={form} layout="vertical" initialValues={{ maxDepth: 0 }}>
        <Card size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Cluster" name="clusterId" rules={[{ required: true, message: 'Required field' }]}>
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
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <>
                    <span>Monitoring Type</span>
                    <InfoCircleOutlined
                      style={{ marginLeft: '.5rem', color: 'var(--primary)' }}
                      onClick={() => {
                        setShowUserGuide(true);
                        setSelectedUserGuideName('lzMonitoringTypes');
                      }}
                    />
                  </>
                }
                name="lzMonitoringType"
                rules={[{ required: true, message: 'Required field' }]}>
                <Select onChange={(value) => setLzMonitoringType(value)}>
                  {monitoringTypes.map((type) => (
                    <Option
                      key={type.id}
                      value={type.value}
                      disbaled={type.value === 'spaceUsage' && selectedCluster?.containerized}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {/* Monitoring type select element */}

          <Row gutter={16}>
            <Col span={12}>
              {/* select element for Dropzone, %0% width */}
              <Form.Item label="Dropzone" name="dropzone" rules={[{ required: true, message: 'Required field' }]}>
                <Select onChange={handleDropzoneChange}>
                  {dropzones
                    .sort((a, b) => a.Name.localeCompare(b.Name))
                    .map((dropzone) => (
                      <Option key={dropzone.Name} value={dropzone.Name}>
                        {`${dropzone.Name} - ${dropzone.Path}`}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Machine" name="machine" rules={[{ required: true, message: 'Required field' }]}>
                <Select onChange={handleMachineChange}>
                  {machines.map((machine) => (
                    <Option key={machine.Name} value={machine.Netaddress}>
                      {`${machine.Name} - ${machine.Netaddress}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Directory" name="directory" rules={[{ required: true, message: 'Required field' }]}>
            <Cascader
              options={directoryOptions}
              loadData={loadDirectoryData}
              allowClear={true}
              changeOnSelect={true}
              expandTrigger="hover"
              placeholder="Select directory"
              loading={directoryLoading}
              notFoundContent={directoryLoading ? 'Loading directories...' : 'No directories found'}
              fieldNames={{ label: 'label', value: 'value', children: 'children' }}
              showSearch={{
                filter: (inputValue, path) =>
                  path.some((option) => option.label.toLowerCase().includes(inputValue.toLowerCase())),
              }}
              onChange={(value) => {
                // Allow selection at any level without closing panel
                if (value && value.length > 0) {
                  const fullPath = value[value.length - 1];
                  form.setFieldsValue({ directory: fullPath });
                }
              }}
              displayRender={(labels) => {
                // Show the full path in the input
                return labels.join(' / ');
              }}
            />
          </Form.Item>

          {lzMonitoringType === 'fileMovement' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Threshold (in minutes)"
                  name="threshold"
                  rules={[{ required: true, message: 'Required field' }]}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={
                    <>
                      <span>Maximum Depth</span>
                      <InfoCircleOutlined
                        style={{ marginLeft: '.5rem', color: 'var(--primary)' }}
                        onClick={() => {
                          setShowUserGuide(true);
                          setSelectedUserGuideName('maximumDepth');
                        }}
                      />
                    </>
                  }
                  name="maxDepth"
                  rules={[
                    { required: true, message: 'Required field' },
                    {
                      validator: (_, value) => {
                        if (value < 0 || value > 99) {
                          return Promise.reject(new Error('Value must be between 0 and 99'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                {/* {lzMonitoringType === 'fileMovement' && ( */}
                <Form.Item
                  label={
                    <>
                      <span>File Name </span>
                      <InfoCircleOutlined
                        style={{ marginLeft: '.5rem', color: 'var(--primary)' }}
                        onClick={() => {
                          setShowUserGuide(true);
                          setSelectedUserGuideName('wildcard');
                        }}
                      />
                    </>
                  }
                  name="fileName"
                  rules={[{ required: true, max: 256, message: 'Maximum of 256 characters allowed' }]}>
                  <Input placeholder="Enter a pattern" />
                </Form.Item>
                {/* )} */}
              </Col>
            </Row>
          )}

          {lzMonitoringType === 'fileCount' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Minimum File Count"
                  name="minFileCount"
                  rules={[
                    { required: true, message: 'Required field' },
                    {
                      validator: (_, value) => {
                        if (value < 0 || value > 999999) {
                          return Promise.reject(new Error('Value must be between 0 and 999999'));
                        }
                        return Promise.resolve();
                      },
                    },
                    {
                      validator: (_, value) => {
                        // Only validate comparison if value exists (not empty/null/undefined)
                        if (value != null && value !== '') {
                          const minFileCount = form.getFieldValue('maxFileCount');
                          if (minFileCount != null && value > minFileCount) {
                            return Promise.reject(
                              new Error('Max file count must be smaller than or equal to max file count')
                            );
                          }
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Maximum File Count"
                  name="maxFileCount"
                  rules={[
                    { required: true, message: 'Required field' },
                    {
                      validator: (_, value) => {
                        if (value < 0 || value > 999999) {
                          return Promise.reject(new Error('Value must be between 0 and 999999'));
                        }
                        return Promise.resolve();
                      },
                    },
                    {
                      validator: (_, value) => {
                        // Only validate comparison if value exists (not empty/null/undefined)
                        if (value != null && value !== '') {
                          const minFileCount = form.getFieldValue('minFileCount');
                          if (minFileCount != null && value < minFileCount) {
                            return Promise.reject(
                              new Error('Max file count must be greater than or equal to min file count')
                            );
                          }
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          )}

          {lzMonitoringType === 'spaceUsage' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Minimum Threshold"
                  name="minThreshold"
                  rules={[
                    { required: true, message: 'Required field' },
                    {
                      validator: (_, value) => {
                        if (value < 0 || value > 999999) {
                          return Promise.reject(new Error('Value must be between 0 and 999999'));
                        }
                        return Promise.resolve();
                      },
                    },
                    {
                      validator: (_, value) => {
                        // Only validate comparison if value exists (not empty/null/undefined)
                        if (value != null && value !== '') {
                          const maxThreshold = form.getFieldValue('maxThreshold');
                          if (maxThreshold != null) {
                            const minValueInMB = convertToMB(value, minSizeThreasoldUnit);
                            const maxValueInMB = convertToMB(maxThreshold, maxSizeThreasoldUnit);
                            if (minValueInMB >= maxValueInMB) {
                              return Promise.reject(new Error('Min threshold must be less than max threshold'));
                            }
                          }
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}>
                  <InputNumber
                    style={{ width: '100%' }}
                    addonAfter={renderThresholdAddon('minThreshold')}
                    min={0}
                    max={999999}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Max Threshold"
                  name="maxThreshold"
                  rules={[
                    { required: true, message: 'Required field' },
                    {
                      validator: (_, value) => {
                        if (value < 0 || value > 999999) {
                          return Promise.reject(new Error('Value must be between 0 and 999999'));
                        }
                        return Promise.resolve();
                      },
                    },
                    {
                      validator: (_, value) => {
                        // Only validate comparison if value exists (not empty/null/undefined)
                        if (value != null && value !== '') {
                          const minThreshold = form.getFieldValue('minThreshold');
                          if (minThreshold != null) {
                            const minValueInMB = convertToMB(minThreshold, minSizeThreasoldUnit);
                            const maxValueInMB = convertToMB(value, maxSizeThreasoldUnit);
                            if (maxValueInMB <= minValueInMB) {
                              return Promise.reject(new Error('Max threshold must be greater than min threshold'));
                            }
                          }
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}>
                  <InputNumber
                    style={{ width: '100%' }}
                    addonAfter={renderThresholdAddon('maxThreshold')}
                    min={0}
                    max={999999}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Card>

        <InfoDrawer
          open={showUserGuide}
          onClose={() => setShowUserGuide(false)}
          width="500px"
          content={selectedUserGuideName}></InfoDrawer>
      </Form>
    </div>
  );
}

export default MonitoringTab;
