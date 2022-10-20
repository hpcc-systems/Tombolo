import React, { useEffect, useState } from 'react';
import { Form, Select, Input, Cascader, message } from 'antd';

import { authHeader } from './AuthHeader';
import Text, { i18n } from '../../components/common/Text';

const { Option } = Select;

function LandingZoneFileExplorer({
  clusterId,
  DirectoryOnly,
  setLandingZoneRootPath,
  enableEdit,
  onDirectoryPathChange,
}) {
  const [landingZoneDetails, setLandingZoneDetails] = useState({
    fetchingLandingZone: false,
    landingZones: [],
    selectedLandingZone: { machines: [] },
    selectedMachine: null,
    directories: [],
  });

  useEffect(() => {
    if (clusterId) {
      getLandingZones(clusterId);
      setLandingZoneDetails((prev) => ({ ...prev, landingZones: [], directories: [] }));
    }
  }, [clusterId]);

  //GET LANDING ZONE FUNCTION
  const getLandingZones = async (clusterId) => {
    setLandingZoneDetails((prev) => ({ ...prev, fetchingLandingZone: true }));
    const url = `/api/hpcc/read/getDropZones?clusterId=${clusterId}&for=lzFileExplorer`;
    try {
      const response = await fetch(url, { headers: authHeader() });
      if (!response.ok) throw Error('Error getting landing zones');
      const landingZones = await response.json();
      setLandingZoneDetails((prev) => ({ ...prev, fetchingLandingZone: false, landingZones }));
    } catch (err) {
      message.error(err.message);
      setLandingZoneDetails((prev) => ({ ...prev, fetchingLandingZone: false }));
    }
  };

  // WHEN LANDING ZONE SELECTION IS CHANGED
  const handleLandingZoneSelectionChange = (value) => {
    const selectedLandingZone = landingZoneDetails.landingZones.find((lz) => lz.name === value);
    console.log('THIS IS SELECTED LZ', selectedLandingZone);
    setLandingZoneRootPath({ landingZonePath: selectedLandingZone.path });
    setLandingZoneDetails((prev) => ({ ...prev, selectedLandingZone, directories: [] }));
  };

  //WHEN MACHINE IS CHANGED IS CHANGED -> Get first level dirs
  const handleMachineChange = async (value) => {
    setLandingZoneDetails((prev) => ({ ...prev, selectedMachine: value, directories: [] }));
    try {
      const response = await fetchDirectories({
        clusterId,
        machine: value,
        path: `${landingZoneDetails.selectedLandingZone.path}`,
        dirOnly: DirectoryOnly,
      });

      const directories = [{ label: '/', value: '', isLeaf: true }];
      if (response.FileListResponse?.files?.PhysicalFileStruct) {
        response.FileListResponse?.files?.PhysicalFileStruct.map((dir) => {
          directories.push({ label: dir.name, value: dir.name, isLeaf: false });
        });
      }

      setLandingZoneDetails((prev) => ({ ...prev, directories }));
    } catch (err) {
      message.error(err.message);
    }
  };

  // LOAD DIRECTORIES -> WHEN CASCADER OPTIONS ARE CLICKED
  const loadCascaderData = async (selectedOptions) => {
    try {
      const targetOption = selectedOptions[selectedOptions.length - 1];
      targetOption.loading = true;

      const selectedPath = selectedOptions.map((option) => option.label).join('/');
      const path = `${landingZoneDetails.selectedLandingZone.path}/${selectedPath}/`;

      const response = await fetchDirectories({
        clusterId,
        machine: landingZoneDetails.selectedMachine,
        path,
        dirOnly: DirectoryOnly,
      });
      if (response?.FileListResponse?.files?.PhysicalFileStruct) {
        const childDirs = response?.FileListResponse?.files?.PhysicalFileStruct.map((dir) => ({
          label: dir.name,
          value: dir.name,
          isLeaf: false,
        }));
        targetOption.children = childDirs;
      } else {
        targetOption.isLeaf = true;
      }

      targetOption.loading = false;
      setLandingZoneDetails((prev) => ({ ...prev, directories: [...prev.directories] }));
    } catch (err) {
      console.log(err);
    }
  };

  // GET DIRECTORIES FUNCTION
  const fetchDirectories = async ({ clusterId, machine, path, dirOnly }) => {
    const url = `/api/hpcc/read/dropZoneDirectories?clusterId=${clusterId}&Netaddr=${machine}&Path=${path}/&DirectoryOnly=${dirOnly}`;

    try {
      const response = await fetch(url, { headers: authHeader() });
      if (!response.ok) throw Error(`Error getting directories from ${landingZoneDetails.selectedLandingZone.name}`);
      const data = await response.json();
      return data;
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <>
      {enableEdit ? (
        <Form.Item label={<Text>Landing Zone / Machine</Text>} required>
          <Input.Group compact>
            <Form.Item
              style={{ width: '50%' }}
              name="landingZone"
              rules={[{ required: true, message: 'Please select landing zone !' }]}>
              <Select
                placeholder={i18n('Landing Zone')}
                allowClear
                style={{ width: '100%' }}
                loading={landingZoneDetails.fetchingLandingZone}
                onChange={handleLandingZoneSelectionChange}
                className=".read-only-input">
                {landingZoneDetails.landingZones.map((lz) => (
                  <Option key={lz.name}>{lz.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              style={{ width: '50%' }}
              name="machine"
              rules={[{ required: true, message: 'Please select Machine !' }]}>
              <Select placeholder={i18n('Machine')} allowClear onChange={handleMachineChange} style={{ width: '100%' }}>
                {landingZoneDetails.selectedLandingZone.machines.map((machine) => (
                  <Option key={machine.Netaddress}> {machine.Netaddress}</Option>
                ))}
              </Select>
            </Form.Item>
          </Input.Group>
        </Form.Item>
      ) : null}

      {!enableEdit ? (
        <>
          <Form.Item label="Landing Zone" name="landingZone">
            <Input className="read-only-input"></Input>
          </Form.Item>
          <Form.Item label={<Text>Machine</Text>} name="machine">
            <Input className="read-only-input"></Input>
          </Form.Item>
        </>
      ) : null}

      {enableEdit ? (
        <Form.Item
          label={<Text>Directory</Text>}
          name="dirToMonitor"
          rules={[{ required: true, message: 'Please select directory path!' }]}>
          <Cascader
            options={landingZoneDetails.directories}
            loadData={loadCascaderData}
            placeholder={i18n('Directory')}
            allowClear
            changeOnSelect={true}
            onChange={(value, selectedOptions) =>
              onDirectoryPathChange ? onDirectoryPathChange(value, selectedOptions) : null
            }
            style={{ width: '100%' }}
          />
        </Form.Item>
      ) : null}
    </>
  );
}

export default LandingZoneFileExplorer;
