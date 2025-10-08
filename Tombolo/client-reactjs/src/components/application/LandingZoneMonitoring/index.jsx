import { useState, useEffect, useRef } from 'react';

// Local Imports
import BreadCrumbs from '../../common/BreadCrumbs';
import { useSelector } from 'react-redux';
import { Form } from 'antd';
import landingZoneMonitoringService from '@/services/landingZoneMonitoring.service.js';
import { identifyErroneousTabs } from './Utils';
import { flattenObject } from '../../common/CommonUtil';
import { getMonitoringTypeId, getDomains, getProductCategories } from '../../common/ASRTools';
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

// Constants
const monitoringTypeName = 'Landing Zone Monitoring';

const LandigZoneMonitoring = () => {
  // Redux
  const applicationId = useSelector((state) => state.application.application.applicationId);
  const clusters = useSelector((state) => state.application.clusters);

  // Constants
  const [form] = Form.useForm();
  const isMonitoringTypeIdFetched = useRef(false);
  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  //Local States
  const [displayAddEditModal, setDisplayAddEditModal] = useState(false);
  const [landingZoneMonitoring, setLandingZoneMonitoring] = useState([]);
  const [displayViewDetailsModal, setDisplayViewDetailsModal] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);
  const [editingData, setEditingData] = useState({ isEditing: false }); // Data to be edited
  const [displayApprovalModal, setDisplayApprovalModal] = useState(false);
  const [savingLzMonitoring, setSavingLzMonitoring] = useState(false); // Flag to indicate if landing zone monitoring is being saved
  const [erroneousTabs, setErroneousTabs] = useState([]); // Tabs with erroneous fields
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [activeTab, setActiveTab] = useState('0');
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);
  const [directory, setDirectory] = useState(null);
  const [copying, setCopying] = useState(false);
  const [lzMonitoringType, setLzMonitoringType] = useState(null);
  const [minSizeThresholdUnit, setMinSizeThresholdUnit] = useState('MB');
  const [maxSizeThresholdUnit, setMaxSizeThresholdUnit] = useState('MB');
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  const [filteringLzMonitorings, setFilteringLzMonitorings] = useState(false);
  const [filteredLzMonitorings, setFilteredLzMonitorings] = useState([]);
  const [matchCount, setMatchCount] = useState(0);

  //asr specific
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [productCategories, setProductCategories] = useState([]);
  const [monitoringTypeId, setMonitoringTypeId] = useState(null);

  // If editing or making copy of LZ monitoring, set form values
  useEffect(() => {
    if (editingData?.isEditing || copying) {
      form.setFieldsValue(selectedMonitoring);
      setSelectedCluster(clusters.find((c) => c.id === selectedMonitoring?.cluster?.id));
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

      // Set maxSizeThresholdUnit and minSizeThresholdUnit if they exist
      if (selectedMonitoring['metaData.monitoringData.maxSizeThresholdUnit']) {
        setMaxSizeThresholdUnit(selectedMonitoring['metaData.monitoringData.maxSizeThresholdUnit']);
      }
      if (selectedMonitoring['metaData.monitoringData.minSizeThresholdUnit']) {
        setMinSizeThresholdUnit(selectedMonitoring['metaData.monitoringData.minSizeThresholdUnit']);
      }
    }
  }, [editingData, copying]);

  // Get all landing zone monitorings on page load
  useEffect(() => {
    if (!applicationId) return;
    (async () => {
      try {
        const allLzMonitoring = await landingZoneMonitoringService.getAll(applicationId);
        // Flatten each object in the array
        const flattenedMonitorings = allLzMonitoring.map((monitoring) => {
          const flat = flattenObject(monitoring);
          return { ...flat, ...monitoring }; // Flat also keep the original object - make it easier to update
        });
        setLandingZoneMonitoring(flattenedMonitorings);
      } catch (error) {
        handleError('Failed to fetch all landing zone monitoring');
      }
    })();
  }, [applicationId, displayAddEditModal]);

  // Get monitoring type ID only once when component mounts
  useEffect(() => {
    if (!isMonitoringTypeIdFetched.current) {
      (async () => {
        try {
          const monitoringTypeId = await getMonitoringTypeId({ monitoringTypeName });
          setMonitoringTypeId(monitoringTypeId);
        } catch (error) {
          handleError('Error fetching monitoring type ID');
        }
      })();
      isMonitoringTypeIdFetched.current = true;
    }
  }, []);

  // Get domains and product categories
  useEffect(() => {
    // Get domains
    if (!monitoringTypeId) return;
    (async () => {
      try {
        let domainData = await getDomains({ monitoringTypeId });
        domainData = domainData.map((d) => ({
          label: d.name,
          value: d.id,
        }));
        setDomains(domainData);
      } catch (error) {
        handleError('Error fetching domains');
      }
    })();

    // If monitoring selected - set selected domain so corresponding product categories can be fetched
    if (selectedMonitoring && selectedMonitoring['metaData.asrSpecificMetaData.domain']) {
      setSelectedDomain(selectedMonitoring['metaData.asrSpecificMetaData.domain']);
    }

    // Get product categories
    if (!selectedDomain) return;
    (async () => {
      try {
        const productCategories = await getProductCategories({ domainId: selectedDomain });
        const formattedProductCategories = productCategories.map((c) => ({
          label: `${c.name} (${c.shortCode})`,
          value: c.id,
        }));
        setProductCategories(formattedProductCategories);
      } catch (error) {
        handleError('Error fetching product category');
      }
    })();
  }, [monitoringTypeId, selectedDomain, selectedMonitoring]);

  const handleAddNewLzMonitoringBtnClick = () => {
    setDisplayAddEditModal(true);
  };

  const handleSaveLzmonitoring = async () => {
    setSavingLzMonitoring(true);
    let validForm = true;

    // Validate from and set validForm to false if any field is invalid
    try {
      await form.validateFields();
    } catch (err) {
      validForm = false;
    }

    // Identify erroneous tabs
    const erroneousFields = form
      .getFieldsError()
      .filter((f) => f.errors.length > 0)
      .map((f) => f.name[0]);
    const badTabs = identifyErroneousTabs({ erroneousFields });

    if (badTabs.length > 0) {
      setErroneousTabs(badTabs);
    }

    // If form is invalid
    if (!validForm) {
      setSavingLzMonitoring(false);
      return;
    }

    try {
      //All inputs
      let userFieldInputs = form.getFieldsValue();

      const metaData = {};
      // Add contact specific metaData
      const { primaryContacts, secondaryContacts, notifyContacts } = userFieldInputs;
      metaData.contacts = {
        primaryContacts,
        secondaryContacts: secondaryContacts ? secondaryContacts : [],
        notifyContacts: notifyContacts ? notifyContacts : [],
      };
      // Remove all the contact fields from userFieldInputs
      delete userFieldInputs.primaryContacts;
      delete userFieldInputs.secondaryContacts;
      delete userFieldInputs.notifyContacts;

      // Add monitoring  specific metaData
      const {
        dropzone,
        machine,
        directory,
        maxDepth,
        fileName,
        threshold,
        maxThreshold,
        minThreshold,
        minFileCount,
        maxFileCount,
      } = userFieldInputs;
      metaData.monitoringData = {
        dropzone,
        machine,
        directory,
        maxDepth,
        threshold,
        fileName,
        maxThreshold,
        maxSizeThresholdUnit,
        minThreshold,
        minSizeThresholdUnit,
        minFileCount,
        maxFileCount,
      };
      // Remove file movement specific fields from userFieldInputs
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

      // Add ASR specific metaData
      if (userFieldInputs.domin !== 'undefined') {
        const { domain, productCategory, severity } = userFieldInputs;
        metaData.asrSpecificMetaData = {
          domain,
          productCategory,
          severity,
        };

        // Remove ASR specific fields from userFieldInputs
        delete userFieldInputs.domain;
        delete userFieldInputs.productCategory;
        delete userFieldInputs.severity;
      }

      // Add metaData back to userFieldInputs to create final payload
      userFieldInputs.metaData = metaData;

      // Add appliationId to userFieldInputs
      userFieldInputs.applicationId = applicationId;

      await landingZoneMonitoringService.create(userFieldInputs);

      // Rest states and Close model if saved successfully
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
      // Validate from and set validForm to false if any field is invalid
      let validForm = true;
      try {
        await form.validateFields();
      } catch (err) {
        validForm = false;
      }

      // Identify erroneous tabs
      const erroneousFields = form
        .getFieldsError()
        .filter((f) => f.errors.length > 0)
        .map((f) => f.name[0]);
      const badTabs = identifyErroneousTabs({ erroneousFields });

      if (badTabs.length > 0) {
        setErroneousTabs(badTabs);
      }

      // If form is invalid  return
      if (!validForm) {
        setSavingLzMonitoring(false);
        return;
      }

      // Form fields
      const formFields = form.getFieldsValue();
      const fields = Object.keys(formFields);

      const monitoringDataFields = ['dropzone', 'machine', 'directory', 'maxDepth', 'threshold', 'fileName'];
      const notificationMetaDataFields = ['primaryContacts', 'secondaryContacts', 'notifyContacts'];
      const asrSpecificFields = ['domain', 'productCategory', 'severity'];

      // Identify the fields that were touched
      const touchedFields = [];
      fields.forEach((field) => {
        if (form.isFieldTouched(field)) {
          touchedFields.push(field);
        }
      });

      // If no touched fields
      if (touchedFields.length === 0) {
        return handleError('No changes detected');
      }

      // updated monitoring
      let updatedData = { ...selectedMonitoring };

      //Touched ASR fields
      const touchedAsrSpecificMetaDataFields = touchedFields.filter((field) => asrSpecificFields.includes(field));
      const touchedMonitoringDataFields = touchedFields.filter((field) => monitoringDataFields.includes(field));
      const touchedContactsFields = touchedFields.filter((field) => notificationMetaDataFields.includes(field));

      // update selected monitoring with asr specific fields that are nested inside metaData > asrSpecificMetaData
      if (touchedAsrSpecificMetaDataFields.length > 0) {
        let existingAsrSpecificMetaData = selectedMonitoring?.metaData?.asrSpecificMetaData || {};
        const upDatedAsrSpecificMetaData = form.getFieldsValue(touchedAsrSpecificMetaDataFields);
        const newAsrSpecificFields = { ...existingAsrSpecificMetaData, ...upDatedAsrSpecificMetaData };
        updatedData.metaData.asrSpecificMetaData = newAsrSpecificFields;
      }

      // updated monitoring data such as Dropzone, machine, directory, maxDepth, threshold, fileName etc
      if (touchedMonitoringDataFields.length > 0) {
        const existingMonitoringData = selectedMonitoring?.metaData?.monitoringData || {};
        const updatedMonitoringData = form.getFieldsValue(touchedMonitoringDataFields);
        const newMonitoringData = { ...existingMonitoringData, ...updatedMonitoringData };
        updatedData.metaData.monitoringData = newMonitoringData;
      }

      // update contacts
      if (touchedContactsFields.length > 0) {
        const existingContacts = selectedMonitoring?.metaData?.contacts || {};
        const updatedContacts = form.getFieldsValue(touchedContactsFields);
        const newContacts = { ...existingContacts, ...updatedContacts };
        updatedData.metaData.contacts = newContacts;
      }
      // Fields that are not contacts, monitoring data or asr specific meta data
      const allMetaDataFields = [...asrSpecificFields, ...monitoringDataFields, ...notificationMetaDataFields];
      const otherFields = fields.filter((field) => !allMetaDataFields.includes(field));

      // Update other fields
      const otherFieldsValues = form.getFieldsValue(otherFields);
      const newOtherFields = { ...selectedMonitoring, ...otherFieldsValues };
      updatedData = { ...updatedData, ...newOtherFields };

      // Make api call
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

  // When filterChange filter the  monitorings
  useEffect(() => {
    setFilteringLzMonitorings(true);
    if (landingZoneMonitoring.length === 0) {
      setFilteringLzMonitorings(false);
    }
    // if (Object.keys(filters).length < 1) return;
    const { approvalStatus, activeStatus, domain, cluster, product } = filters;

    // Convert activeStatus to boolean
    let activeStatusBool;
    if (activeStatus === 'Active') {
      activeStatusBool = true;
    } else if (activeStatus === 'Inactive') {
      activeStatusBool = false;
    }

    let filteredlzm = landingZoneMonitoring.filter((lzm) => {
      let include = true;
      const currentDomain = lzm?.metaData?.asrSpecificMetaData?.domain;
      const currentProduct = lzm?.metaData?.asrSpecificMetaData?.productCategory;
      const currentClusterId = lzm?.clusterId;

      if (approvalStatus && lzm.approvalStatus !== approvalStatus) {
        include = false;
      }
      if (activeStatusBool !== undefined && lzm.isActive !== activeStatusBool) {
        include = false;
      }
      if (domain && currentDomain !== domain) {
        include = false;
      }

      if (product && currentProduct !== product) {
        include = false;
      }

      if (cluster && currentClusterId !== cluster) {
        include = false;
      }

      return include;
    });

    const matchedLzmIds = [];

    // Calculate the number of matched string instances
    if (searchTerm) {
      let instanceCount = 0;
      filteredlzm.forEach((lz) => {
        const lzMonitoringName = lz.monitoringName.toLowerCase();

        if (lzMonitoringName.includes(searchTerm)) {
          matchedLzmIds.push(lz.id);
          instanceCount++;
        }
      });

      setMatchCount(instanceCount);
    } else {
      setMatchCount(0);
    }

    if (matchedLzmIds.length > 0) {
      filteredlzm = filteredlzm.filter((lz) => matchedLzmIds.includes(lz.id));
    } else if (matchedLzmIds.length === 0 && searchTerm) {
      filteredlzm = [];
    }

    setFilteredLzMonitorings(filteredlzm);
    setFilteringLzMonitorings(false);
  }, [filters, landingZoneMonitoring, searchTerm]);

  const handleBulkDeleteSelectedLandingZones = async (ids) => {
    try {
      await landingZoneMonitoringService.bulkDelete(ids);
      setLandingZoneMonitoring((prev) => prev.filter((lz) => !ids.includes(lz.id)));
      setSelectedRows([]);
      handleSuccess('Selected landing zone monitoring deleted successfully');
    } catch (err) {
      handleError('Failed to delete selected landing zone monitoring');
    }
  };

  const handleBulkStartPauseLandingZones = async ({ ids, action }) => {
    try {
      const startMonitoring = action === 'start';
      await landingZoneMonitoringService.toggle(ids, startMonitoring);
      handleSuccess(`Selected landing zone monitoring ${startMonitoring ? 'started' : 'paused'} successfully. `);
    } catch (err) {
      console.log(err);
      handleError('Failed to start/pause selected landing zone monitoring');
    }
  };

  const handleOpenBulkEdit = () => setBulkEditModalVisibility(true);
  const handleOpenApproveReject = () => setDisplayApprovalModal(true);
  const handleToggleFilters = () => setFiltersVisible((prev) => !prev);

  //JSX
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
        clusters={clusters}
        domains={domains}
        productCategories={productCategories}
      />
      <ApproveRejectModal
        visible={displayApprovalModal}
        onCancel={() => setDisplayApprovalModal(false)}
        selectedMonitoring={selectedMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        selectedRows={selectedRows}
        // setMonitoring={setLandingZoneMonitoring}
        monitoringTypeLabel={monitoringTypeName}
        evaluateMonitoring={landingZoneMonitoringService.approveMonitoring}
        onSubmit={async (formData) => {
          try {
            await landingZoneMonitoringService.approveMonitoring(formData);
            const updatedLzMonitoringData = await landingZoneMonitoringService.getAll(applicationId);
            const flattenedMonitoring = updatedLzMonitoringData.map((monitoring) => {
              const flat = flattenObject(monitoring);
              return { ...flat, ...monitoring }; // Flat also keep the original object - make it easier to update
            });
            setLandingZoneMonitoring(flattenedMonitoring);
            handleSuccess('Response saved successfully');
            setDisplayApprovalModal(false);
          } catch (error) {
            handleError('Failed to updated landing zone monitoring');
          }
        }}
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
