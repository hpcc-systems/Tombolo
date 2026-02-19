import React, { useState, useEffect, useRef } from 'react';

import BreadCrumbs from '../../common/BreadCrumbs';
import { useSelector } from 'react-redux';
import { Form } from 'antd';
import landingZoneMonitoringService from '@/services/landingZoneMonitoring.service.js';
import { identifyErroneousTabs, handleLandingZoneMonitoringApproval } from './Utils';
import { flattenObject } from '../../common/CommonUtil';
import asrService from '@/services/asr.service.js';
import monitoringTypeService from '@/services/monitoringType.service.js';
import { getRoleNameArray } from '../../common/AuthUtil';
import AddEditModal from './AddEditModal/Modal';
import MonitoringActionButton from '../../common/Monitoring/ActionButton.jsx';
import LandingZoneMonitoringTable from './LandingZoneMonitoringTable';
import ApproveRejectModal from '../../common/Monitoring/ApproveRejectModal';
import BulkUpdateModal from './BulkUpdateModal';
import ViewDetailsModal from './ViewDetailsModal';
import LzFilters from './LzFilters';
import { Constants } from '@/components/common/Constants';
import { handleError, handleSuccess } from '@/components/common/handleResponse';

const monitoringTypeName = 'Landing Zone Monitoring';

const LandigZoneMonitoring: React.FC = () => {
  const applicationId = useSelector((state: any) => state.application.application.applicationId);
  const clusters = useSelector((state: any) => state.application.clusters);

  const [form] = Form.useForm();
  const isMonitoringTypeIdFetched = useRef(false);
  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  const [displayAddEditModal, setDisplayAddEditModal] = useState(false);
  const [landingZoneMonitoring, setLandingZoneMonitoring] = useState<any[]>([]);
  const [displayViewDetailsModal, setDisplayViewDetailsModal] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState<any | null>(null);
  const [editingData, setEditingData] = useState<any>({ isEditing: false });
  const [displayApprovalModal, setDisplayApprovalModal] = useState(false);
  const [savingLzMonitoring, setSavingLzMonitoring] = useState(false);
  const [erroneousTabs, setErroneousTabs] = useState<string[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('0');
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);
  const [directory, setDirectory] = useState<any>(null);
  const [copying, setCopying] = useState(false);
  const [lzMonitoringType, setLzMonitoringType] = useState<any>(null);
  const [minSizeThresholdUnit, setMinSizeThresholdUnit] = useState('MB');
  const [maxSizeThresholdUnit, setMaxSizeThresholdUnit] = useState('MB');
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<any>({});

  const [filteringLzMonitorings, setFilteringLzMonitorings] = useState(false);
  const [filteredLzMonitorings, setFilteredLzMonitorings] = useState<any[]>([]);
  const [matchCount, setMatchCount] = useState(0);

  const [domains, setDomains] = useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [monitoringTypeId, setMonitoringTypeId] = useState<any>(null);

  useEffect(() => {
    if (editingData?.isEditing || copying) {
      form.setFieldsValue(selectedMonitoring);
      setSelectedCluster(clusters.find((c: any) => c.id === selectedMonitoring?.cluster?.id));
      setLzMonitoringType(selectedMonitoring.lzMonitoringType);

      form.setFieldsValue({
        domain: selectedMonitoring['metaData.asrSpecificMetaData.domain'],
        productCategory: selectedMonitoring['metaData.asrSpecificMetaData.productCategory'],
        severity: selectedMonitoring['metaData.asrSpecificMetaData.severity'],
        dropzone: selectedMonitoring['metaData.monitoringData.dropzone'],
        machine: selectedMonitoring['metaData.monitoringData.machine'],
        directory: selectedMonitoring['metaData.monitoringData.directory'],
        maxDepth: selectedMonitoring['metaData.monitoringData.maxDepth'],
        threshold: selectedMonitoring['metaData.monitoringData.threshold'],
        fileName: selectedMonitoring['metaData.monitoringData.fileName'],
        primaryContacts: selectedMonitoring['metaData.contacts.primaryContacts'],
        secondaryContacts: selectedMonitoring['metaData.contacts.secondaryContacts'],
        notifyContacts: selectedMonitoring['metaData.contacts.notifyContacts'],
        minThreshold: selectedMonitoring['metaData.monitoringData.minThreshold'],
        maxThreshold: selectedMonitoring['metaData.monitoringData.maxThreshold'],
        minFileCount: selectedMonitoring['metaData.monitoringData.minFileCount'],
        maxFileCount: selectedMonitoring['metaData.monitoringData.maxFileCount'],
      });

      if (selectedMonitoring['metaData.monitoringData.maxSizeThresholdUnit']) {
        setMaxSizeThresholdUnit(selectedMonitoring['metaData.monitoringData.maxSizeThresholdUnit']);
      }
      if (selectedMonitoring['metaData.monitoringData.minSizeThresholdUnit']) {
        setMinSizeThresholdUnit(selectedMonitoring['metaData.monitoringData.minSizeThresholdUnit']);
      }
    }
  }, [editingData, copying]);

  useEffect(() => {
    if (!applicationId) return;
    (async () => {
      try {
        const allLzMonitoring = await landingZoneMonitoringService.getAll(applicationId);
        const flattenedMonitorings = allLzMonitoring.map((monitoring: any) => {
          const flat = flattenObject(monitoring);
          return { ...flat, ...monitoring };
        });
        setLandingZoneMonitoring(flattenedMonitorings);
      } catch (error) {
        handleError('Failed to fetch all landing zone monitoring');
      }
    })();
  }, [applicationId, displayAddEditModal]);

  useEffect(() => {
    if (!isMonitoringTypeIdFetched.current) {
      (async () => {
        try {
          const monitoringTypeId = await monitoringTypeService.getId({ monitoringTypeName });
          setMonitoringTypeId(monitoringTypeId);
        } catch (error) {
          handleError('Error fetching monitoring type ID');
        }
      })();
      isMonitoringTypeIdFetched.current = true;
    }
  }, []);

  useEffect(() => {
    if (!monitoringTypeId) return;
    (async () => {
      try {
        let domainData = await asrService.getDomains({ monitoringTypeId });
        domainData = domainData.map((d: any) => ({ label: d.name, value: d.id }));
        setDomains(domainData);
      } catch (error) {
        handleError('Error fetching domains');
      }
    })();

    if (selectedMonitoring && selectedMonitoring['metaData.asrSpecificMetaData.domain']) {
      setSelectedDomain(selectedMonitoring['metaData.asrSpecificMetaData.domain']);
    }

    if (!selectedDomain) return;
    (async () => {
      try {
        const pcs = await asrService.getProductCategories({ domainId: selectedDomain });
        const formatted = pcs.map((c: any) => ({ label: `${c.name} (${c.shortCode})`, value: c.id }));
        setProductCategories(formatted);
      } catch (error) {
        handleError('Error fetching product category');
      }
    })();
  }, [monitoringTypeId, selectedDomain, selectedMonitoring]);

  const handleAddNewLzMonitoringBtnClick = () => setDisplayAddEditModal(true);

  const handleSaveLzmonitoring = async () => {
    setSavingLzMonitoring(true);
    let validForm = true;
    try {
      await form.validateFields();
    } catch (err) {
      validForm = false;
    }

    const erroneousFields = form.getFieldsError().filter((f: any) => f.errors.length > 0).map((f: any) => f.name[0]);
    const badTabs = identifyErroneousTabs({ erroneousFields });

    if (badTabs.length > 0) setErroneousTabs(badTabs);
    if (!validForm) {
      setSavingLzMonitoring(false);
      return;
    }

    try {
      let userFieldInputs = form.getFieldsValue();
      const metaData: any = {};
      const { primaryContacts, secondaryContacts, notifyContacts } = userFieldInputs;
      metaData.contacts = { primaryContacts, secondaryContacts: secondaryContacts ? secondaryContacts : [], notifyContacts: notifyContacts ? notifyContacts : [] };
      delete userFieldInputs.primaryContacts;
      delete userFieldInputs.secondaryContacts;
      delete userFieldInputs.notifyContacts;

      const { dropzone, machine, directory, maxDepth, fileName, threshold, maxThreshold, minThreshold, minFileCount, maxFileCount } = userFieldInputs;
      metaData.monitoringData = { dropzone, machine, directory, maxDepth, threshold, fileName, maxThreshold, maxSizeThresholdUnit, minThreshold, minSizeThresholdUnit, minFileCount, maxFileCount };

      delete userFieldInputs.dropzone;
      delete userFieldInputs.machine;
      delete userFieldInputs.directory;
      delete userFieldInputs.maxDepth;
      delete userFieldInputs.threshold;
      delete userFieldInputs.fileName;
      delete userFieldInputs.maxThreshold;
      delete userFieldInputs.minThreshold;
      delete userFieldInputs.minFileCount;
      delete userFieldInputs.maxFileCount;

      if (userFieldInputs.domin !== 'undefined') {
        const { domain, productCategory, severity } = userFieldInputs;
        metaData.asrSpecificMetaData = { domain, productCategory, severity };
        delete userFieldInputs.domain;
        delete userFieldInputs.productCategory;
        delete userFieldInputs.severity;
      }

      userFieldInputs.metaData = metaData;
      userFieldInputs.applicationId = applicationId;

      await landingZoneMonitoringService.create(userFieldInputs);
      resetStates();
      setDisplayAddEditModal(false);
      handleSuccess('Landing zone monitoring created successfully');
    } catch (err) {
      console.log(err);
      handleError('Failed to create landing zone monitoring');
    } finally {
      setSavingLzMonitoring(false);
    }
  };

  const handleUpdateLzMonitoring = async () => {
    setSavingLzMonitoring(true);
    try {
      let validForm = true;
      try {
        await form.validateFields();
      } catch (err) {
        validForm = false;
      }

      const erroneousFields = form.getFieldsError().filter((f: any) => f.errors.length > 0).map((f: any) => f.name[0]);
      const badTabs = identifyErroneousTabs({ erroneousFields });
      if (badTabs.length > 0) setErroneousTabs(badTabs);
      if (!validForm) {
        setSavingLzMonitoring(false);
        return;
      }

      const formFields = form.getFieldsValue();
      const fields = Object.keys(formFields);
      const monitoringDataFields = ['dropzone', 'machine', 'directory', 'maxDepth', 'threshold', 'fileName'];
      const notificationMetaDataFields = ['primaryContacts', 'secondaryContacts', 'notifyContacts'];
      const asrSpecificFields = ['domain', 'productCategory', 'severity'];

      const touchedFields: string[] = [];
      fields.forEach((field) => {
        if (form.isFieldTouched(field)) touchedFields.push(field);
      });

      if (touchedFields.length === 0) return handleError('No changes detected');

      let updatedData: any = { ...selectedMonitoring };
      const touchedAsrSpecificMetaDataFields = touchedFields.filter((field) => asrSpecificFields.includes(field));
      const touchedMonitoringDataFields = touchedFields.filter((field) => monitoringDataFields.includes(field));
      const touchedContactsFields = touchedFields.filter((field) => notificationMetaDataFields.includes(field));

      if (touchedAsrSpecificMetaDataFields.length > 0) {
        let existingAsrSpecificMetaData = selectedMonitoring?.metaData?.asrSpecificMetaData || {};
        const upDatedAsrSpecificMetaData = form.getFieldsValue(touchedAsrSpecificMetaDataFields);
        const newAsrSpecificFields = { ...existingAsrSpecificMetaData, ...upDatedAsrSpecificMetaData };
        updatedData.metaData.asrSpecificMetaData = newAsrSpecificFields;
      }

      if (touchedMonitoringDataFields.length > 0) {
        const existingMonitoringData = selectedMonitoring?.metaData?.monitoringData || {};
        const updatedMonitoringData = form.getFieldsValue(touchedMonitoringDataFields);
        const newMonitoringData = { ...existingMonitoringData, ...updatedMonitoringData };
        updatedData.metaData.monitoringData = newMonitoringData;
      }

      if (touchedContactsFields.length > 0) {
        const existingContacts = selectedMonitoring?.metaData?.contacts || {};
        const updatedContacts = form.getFieldsValue(touchedContactsFields);
        const newContacts = { ...existingContacts, ...updatedContacts };
        updatedData.metaData.contacts = newContacts;
      }

      const allMetaDataFields = [...asrSpecificFields, ...monitoringDataFields, ...notificationMetaDataFields];
      const otherFields = fields.filter((field) => !allMetaDataFields.includes(field));
      const otherFieldsValues = form.getFieldsValue(otherFields);
      const newOtherFields = { ...selectedMonitoring, ...otherFieldsValues };
      updatedData = { ...updatedData, ...newOtherFields };

      await landingZoneMonitoringService.updateOne(updatedData);
      handleSuccess('Landingzone monitoring updated successfully');
      resetStates();
    } catch (err) {
      handleError('Failed to save landing zone monitoring');
    } finally {
      setSavingLzMonitoring(false);
    }
  };

  const resetStates = () => {
    setDisplayAddEditModal(false);
    setSelectedMonitoring(null);
    setEditingData({ isEditing: false });
    setErroneousTabs([]);
    setSelectedCluster(null);
    setActiveTab('0');
    setCopying(false);
    setLzMonitoringType(null);
    setMinSizeThresholdUnit('MB');
    setMaxSizeThresholdUnit('MB');
    form.resetFields();
  };

  useEffect(() => {
    setFilteringLzMonitorings(true);
    if (landingZoneMonitoring.length === 0) {
      setFilteringLzMonitorings(false);
    }
    const { approvalStatus, activeStatus, domain, cluster, product } = filters;

    let activeStatusBool: boolean | undefined;
    if (activeStatus === 'Active') activeStatusBool = true;
    else if (activeStatus === 'Inactive') activeStatusBool = false;

    let filteredlzm = landingZoneMonitoring.filter((lzm: any) => {
      let include = true;
      const currentDomain = lzm?.metaData?.asrSpecificMetaData?.domain;
      const currentProduct = lzm?.metaData?.asrSpecificMetaData?.productCategory;
      const currentClusterId = lzm?.clusterId;

      if (approvalStatus && lzm.approvalStatus !== approvalStatus) include = false;
      if (activeStatusBool !== undefined && lzm.isActive !== activeStatusBool) include = false;
      if (domain && currentDomain !== domain) include = false;
      if (product && currentProduct !== product) include = false;
      if (cluster && currentClusterId !== cluster) include = false;

      return include;
    });

    const matchedLzmIds: string[] = [];
    if (searchTerm) {
      let instanceCount = 0;
      filteredlzm.forEach((lz: any) => {
        const lzMonitoringName = lz.monitoringName.toLowerCase();
        if (lzMonitoringName.includes(searchTerm)) {
          matchedLzmIds.push(lz.id);
          instanceCount++;
        }
      });
      setMatchCount(instanceCount);
    } else setMatchCount(0);

    if (matchedLzmIds.length > 0) filteredlzm = filteredlzm.filter((lz: any) => matchedLzmIds.includes(lz.id));
    else if (matchedLzmIds.length === 0 && searchTerm) filteredlzm = [];

    setFilteredLzMonitorings(filteredlzm);
    setFilteringLzMonitorings(false);
  }, [filters, landingZoneMonitoring, searchTerm]);

  const handleBulkDeleteSelectedLandingZones = async (ids: string[]) => {
    try {
      await landingZoneMonitoringService.bulkDelete(ids);
      setLandingZoneMonitoring((prev: any[]) => prev.filter((lz) => !ids.includes(lz.id)));
      setSelectedRows([]);
      handleSuccess('Selected landing zone monitoring deleted successfully');
    } catch (err) {
      handleError('Failed to delete selected landing zone monitoring');
    }
  };

  const handleBulkStartPauseLandingZones = async ({ ids, action }: any) => {
    try {
      const startMonitoring = action === 'start';
      await landingZoneMonitoringService.toggle(ids, startMonitoring);
      handleSuccess(`Selected landing zone monitoring ${startMonitoring ? 'started' : 'paused'} successfully. `);
    } catch (err) {
      handleError('Failed to start/pause selected landing zone monitoring');
    }
  };

  const handleOpenBulkEdit = () => setBulkEditModalVisibility(true);
  const handleOpenApproveReject = () => setDisplayApprovalModal(true);
  const handleToggleFilters = () => setFiltersVisible((prev) => !prev);

  return (
    <>
      <BreadCrumbs
        extraContent={
          <MonitoringActionButton
            label="Landing Zone Monitoring Actions"
            isReader={isReader}
            selectedRows={selectedRows}
            onAdd={handleAddNewLzMonitoringBtnClick}
            onBulkEdit={handleOpenBulkEdit}
            onBulkApproveReject={handleOpenApproveReject}
            onToggleFilters={handleToggleFilters}
            showBulkApproveReject={true}
            showFiltersToggle={true}
            filtersStorageKey={Constants.LZM_FILTERS_VS_KEY}
            onBulkDelete={handleBulkDeleteSelectedLandingZones}
            onBulkStartPause={handleBulkStartPauseLandingZones}
          />
        }
      />
      <AddEditModal
        displayAddEditModal={displayAddEditModal}
        setDisplayAddEditModal={setDisplayAddEditModal}
        handleSaveLzmonitoring={handleSaveLzmonitoring}
        savingLzMonitoring={savingLzMonitoring}
        handleUpdateLzMonitoring={handleUpdateLzMonitoring}
        form={form}
        clusters={clusters}
        landingZoneMonitoring={landingZoneMonitoring}
        isEditing={editingData?.isEditing}
        erroneousTabs={erroneousTabs}
        selectedCluster={selectedCluster}
        setSelectedCluster={setSelectedCluster}
        resetStates={resetStates}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        directory={directory}
        setDirectory={setDirectory}
        copying={copying}
        setCopying={setCopying}
        domains={domains}
        productCategories={productCategories}
        setSelectedDomain={setSelectedDomain}
        selectedMonitoring={selectedMonitoring}
        lzMonitoringType={lzMonitoringType}
        setLzMonitoringType={setLzMonitoringType}
        minSizeThresholdUnit={minSizeThresholdUnit}
        maxSizeThresholdUnit={maxSizeThresholdUnit}
        setMinSizeThresholdUnit={setMinSizeThresholdUnit}
        setMaxSizeThresholdUnit={setMaxSizeThresholdUnit}
      />
      <LzFilters
        filtersVisible={filtersVisible}
        setFiltersVisible={setFiltersVisible}
        domains={domains}
        selectedDomain={selectedDomain}
        landingZoneMonitoring={landingZoneMonitoring}
        allProductCategories={productCategories}
        setFilters={setFilters}
        matchCount={matchCount}
        setSearchTerm={setSearchTerm}
        setSelectedDomain={setSelectedDomain}
        searchTerm={searchTerm}
      />
      <LandingZoneMonitoringTable
        landingZoneMonitoring={landingZoneMonitoring}
        setLandingZoneMonitoring={setLandingZoneMonitoring}
        setDisplayViewDetailsModal={setDisplayViewDetailsModal}
        setSelectedMonitoring={setSelectedMonitoring}
        setDisplayAddEditModal={setDisplayAddEditModal}
        setEditingData={setEditingData}
        setDisplayAddRejectModal={setDisplayApprovalModal}
        applicationId={applicationId}
        setSelectedRows={setSelectedRows}
        setCopying={setCopying}
        isReader={isReader}
        filteringLzMonitorings={filteringLzMonitorings}
        filteredLzMonitorings={filteredLzMonitorings}
        searchTerm={searchTerm}
      />
      <ViewDetailsModal
        displayViewDetailsModal={displayViewDetailsModal}
        setDisplayViewDetailsModal={setDisplayViewDetailsModal}
        selectedMonitoring={selectedMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        domains={domains}
        productCategories={productCategories}
      />
      <ApproveRejectModal
        visible={displayApprovalModal}
        onCancel={() => setDisplayApprovalModal(false)}
        selectedMonitoring={selectedMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        selectedRows={selectedRows}
        monitoringTypeLabel={monitoringTypeName}
        evaluateMonitoring={landingZoneMonitoringService.approveMonitoring}
        onSubmit={(formData: any) =>
          handleLandingZoneMonitoringApproval({
            formData,
            landingZoneMonitoringService,
            handleSuccess,
            handleError,
            applicationId,
            setLandingZoneMonitoring,
            setDisplayApprovalModal,
            flattenObject,
          })
        }
      />
      {bulkEditModalVisibility && (
        <BulkUpdateModal
          bulkEditModalVisibility={bulkEditModalVisibility}
          setBulkEditModalVisibility={setBulkEditModalVisibility}
          landingZoneMonitoring={landingZoneMonitoring}
          setLandingZoneMonitoring={setLandingZoneMonitoring}
          selectedRows={selectedRows}
        />
      )}
    </>
  );
};

export default LandigZoneMonitoring;
