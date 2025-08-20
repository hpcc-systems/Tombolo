// Library Imports
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Form } from 'antd';

// Local Imports
import { getRoleNameArray } from '../../common/AuthUtil.js';
import ClusterMonitoringTable from './ClusterMonitoringTable';
import BreadCrumbs from '../../common/BreadCrumbs';
import {
  getAllClusterMonitoring,
  findUniqueName,
  handleBulkUpdateClusterMonitoring,
} from './clusterMonitoringUtils.js';
import ViewDetailsModal from './ViewDetailsModal';
import ActionButton from './ActionButton';
import AddEditModal from './AddEditModal/AddEditModal.jsx';
import { useDomainAndCategories } from '../../../hooks/useDomainsAndProductCategories';
import { useMonitorType } from '../../../hooks/useMonitoringType';
import ApproveRejectModal from './ApproveRejectModal.jsx';
import ClusterMonitoringFilters from './ClusterMonitoringFilters';
import { getAllProductCategories } from '../../common/ASRTools';
import BulkUpdateModal from '../../common/Monitoring/BulkUpdateModal';

// Constants
const monitoringTypeName = 'Cluster Monitoring';

function ClusterMonitoring() {
  //Redux
  const {
    application: { applicationId },
    clusters,
  } = useSelector((state) => state.applicationReducer);

  //get user roles
  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  //Local State
  const [clusterMonitoring, setClusterMonitoring] = useState([]);
  const [displayAddEditModal, setDisplayAddEditModal] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);
  const [notificationDetails, setNotificationDetails] = useState({});
  const [displayViewDetailsModal, setDisplayViewDetailsModal] = useState(false);
  const [editingMonitoring, setEditingMonitoring] = useState(false);
  const [form] = Form.useForm();
  const [displayApproveRejectModal, setApproveRejectModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [duplicatingData, setDuplicatingData] = useState({ isDuplicating: false }); // CM to be duplicated
  const [filters, setFilters] = useState({});
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // eslint-disable-next-line unused-imports/no-unused-vars
  const [matchCount, setMatchCount] = useState(0);
  const [allProductCategories, setAllProductCategories] = useState([]);
  const [filtering, setFiltering] = useState(false);
  const [filteredClusterMonitoring, setFilteredClusterMonitoring] = useState([]);
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);

  // Hooks
  const { monitoringTypeId } = useMonitorType(monitoringTypeName);

  // Get domains and product categories
  const { domains, productCategories, setProductCategories, selectedDomain, setSelectedDomain } =
    useDomainAndCategories(monitoringTypeId, selectedMonitoring);

  //When component loads get all file monitoring
  useEffect(() => {
    (async () => {
      const cm = await getAllClusterMonitoring();
      setClusterMonitoring(cm);
      const prods = await getAllProductCategories();
      setAllProductCategories(prods);
    })();
  }, []);

  // ----------------------------------------------------------------
  // When filter changes, filter the cost monitorings
  useEffect(() => {
    setFiltering(true);
    if (clusterMonitoring.length === 0) {
      setFiltering(false);
      return;
    }

    const { approvalStatus, activeStatus, clusters: filterClusters } = filters;

    // Convert activeStatus to boolean
    let activeStatusBool;
    if (activeStatus === 'Active') {
      activeStatusBool = true;
    } else if (activeStatus === 'Inactive') {
      activeStatusBool = false;
    }

    let filteredCm = clusterMonitoring.filter((costMonitoring) => {
      let include = true;

      if (approvalStatus && costMonitoring.approvalStatus !== approvalStatus) {
        include = false;
      }
      if (activeStatusBool !== undefined && costMonitoring.isActive !== activeStatusBool) {
        include = false;
      }
      if (filterClusters && filterClusters.length > 0) {
        const hasMatchingCluster = costMonitoring.clusterIds?.some((clusterId) => filterClusters.includes(clusterId));
        if (!hasMatchingCluster) {
          include = false;
        }
      }

      return include;
    });

    const matchedCostIds = [];

    // Calculate the number of matched string instances
    if (searchTerm) {
      let instanceCount = 0;
      filteredCm.forEach((cost) => {
        const monitoringName = cost.monitoringName.toLowerCase();
        const description = cost.description?.toLowerCase() || '';

        if (monitoringName.includes(searchTerm.toLowerCase())) {
          matchedCostIds.push(cost.id);
          instanceCount++;
        }

        if (description.includes(searchTerm.toLowerCase())) {
          matchedCostIds.push(cost.id);
          instanceCount++;
        }
      });

      setMatchCount(instanceCount);
    } else {
      setMatchCount(0);
    }

    if (matchedCostIds.length > 0) {
      filteredCm = filteredCm.filter((cost) => matchedCostIds.includes(cost.id));
    } else if (matchedCostIds.length === 0 && searchTerm) {
      filteredCm = [];
    }

    setFilteredClusterMonitoring(filteredCm);
    setFiltering(false);
  }, [filters, clusterMonitoring, searchTerm]);
  // ----------------------------------------------------------------

  // If editing data is passed, set the form values
  useEffect(() => {
    if (editingMonitoring || duplicatingData?.isDuplicating) {
      form.setFieldsValue({
        ...selectedMonitoring,
        ...selectedMonitoring?.metaData?.contacts,
        ...selectedMonitoring?.metaData?.asrSpecificMetaData,
      });
      if (duplicatingData?.isDuplicating) {
        const newName = findUniqueName(selectedMonitoring.monitoringName, clusterMonitoring);
        form.setFields([
          {
            name: 'monitoringName',
            value: newName,
            warnings: ['Auto generated name'],
          },
        ]);
      }
    }
  }, [editingMonitoring, duplicatingData, selectedMonitoring]);

  //JSX
  return (
    <>
      <BreadCrumbs
        extraContent={
          <ActionButton
            setClusterMonitoring={setClusterMonitoring}
            setDisplayAddEditModal={setDisplayAddEditModal}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            setBulkEditModalVisibility={setBulkEditModalVisibility}
          />
        }
      />

      {displayAddEditModal && (
        <AddEditModal
          displayAddEditModal={displayAddEditModal}
          setDisplayAddEditModal={setDisplayAddEditModal}
          form={form}
          domains={domains}
          productCategories={productCategories}
          setProductCategories={setProductCategories}
          selectedDomain={selectedDomain}
          setSelectedDomain={setSelectedDomain}
          clusterMonitoring={clusterMonitoring}
          setClusterMonitoring={setClusterMonitoring}
          setEditingMonitoring={setEditingMonitoring}
          editingMonitoring={editingMonitoring}
          selectedMonitoring={selectedMonitoring}
          setDuplicatingData={setDuplicatingData}
          isDuplicating={duplicatingData.isDuplicating}
        />
      )}
      <ClusterMonitoringFilters
        clusterMonitoring={clusterMonitoring}
        setFilters={setFilters}
        filters={filters}
        clusters={clusters}
        filtersVisible={filtersVisible}
        setFiltersVisible={setFiltersVisible}
        isReader={isReader}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        matchCount={matchCount}
        domains={domains}
        productCategories={productCategories}
        setProductCategories={setProductCategories}
        selectedDomain={selectedDomain}
        setSelectedDomain={setSelectedDomain}
        allProductCategories={allProductCategories}
      />
      {displayViewDetailsModal && (
        <ViewDetailsModal
          setDisplayViewDetailsModal={setDisplayViewDetailsModal}
          selectedMonitoring={selectedMonitoring}
          setSelectedMonitoring={setSelectedMonitoring}
          domains={domains}
          productCategories={productCategories}
        />
      )}

      <ApproveRejectModal
        displayApproveRejectModal={displayApproveRejectModal}
        setApproveRejectModal={setApproveRejectModal}
        selectedRows={selectedRows}
        selectedMonitoring={selectedMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        setClusterMonitoring={setClusterMonitoring}
      />
      <ClusterMonitoringTable
        clusterMonitoring={filteredClusterMonitoring}
        applicationId={applicationId}
        setClusterMonitoring={setClusterMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        notificationDetails={notificationDetails}
        setNotificationDetails={setNotificationDetails}
        isReader={isReader}
        setDisplayViewDetailsModal={setDisplayViewDetailsModal}
        setDisplayAddEditModal={setDisplayAddEditModal}
        setEditingMonitoring={setEditingMonitoring}
        setApproveRejectModal={setApproveRejectModal}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        setDuplicatingData={setDuplicatingData}
        filtering={filtering}
      />

      {/* Bulk Update Modal */}
      {bulkEditModalVisibility && (
        <BulkUpdateModal
          bulkEditModalVisibility={bulkEditModalVisibility}
          setBulkEditModalVisibility={setBulkEditModalVisibility}
          monitorings={clusterMonitoring}
          setMonitorings={setClusterMonitoring}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          monitoringType="cluster"
          handleBulkUpdateMonitorings={handleBulkUpdateClusterMonitoring}
        />
      )}
    </>
  );
}

export default ClusterMonitoring;
