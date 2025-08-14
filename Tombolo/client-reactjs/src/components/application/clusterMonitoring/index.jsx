// Library Imports
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Form } from 'antd';

// Local Imports
import { getRoleNameArray } from '../../common/AuthUtil.js';
import ClusterMonitoringTable from './ClusterMonitoringTable';
import BreadCrumbs from '../../common/BreadCrumbs';
import { getAllClusterMonitoring, findUniqueName } from './clusterMonitoringUtils.js';
import ViewDetailsModal from './ViewDetailsModal';
import ActionButton from './ActionButton';
import AddEditModal from './AddEditModal/AddEditModal.jsx';
import { useDomainAndCategories } from '../../../hooks/useDomainsAndProductCategories';
import { useMonitorType } from '../../../hooks/useMonitoringType';
import ApproveRejectModal from './ApproveRejectModal.jsx';
import ClusterMonitoringFilters from './ClusterMonitoringFilters';

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

  // Hooks
  const { monitoringTypeId } = useMonitorType(monitoringTypeName);

  // Get domains and product categories
  const { domains, productCategories, setProductCategories, selectedDomain, setSelectedDomain } =
    useDomainAndCategories(monitoringTypeId, selectedMonitoring);

  //When component loads get all file monitoring
  useEffect(() => {
    (async () => {
      const response = await getAllClusterMonitoring();
      setClusterMonitoring(response);
    })();
  }, []);

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
            filtersVisible={filtersVisible}
            setFiltersVisible={setFiltersVisible}
            setDisplayAddEditModal={setDisplayAddEditModal}
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
      {displayViewDetailsModal && (
        <ViewDetailsModal
          setDisplayViewDetailsModal={setDisplayViewDetailsModal}
          selectedMonitoring={selectedMonitoring}
          setSelectedMonitoring={setSelectedMonitoring}
          domains={domains}
          productCategories={productCategories}
        />
      )}
      <ClusterMonitoringFilters
        setFiltersVisible={setFiltersVisible}
        setFilters={setFilters}
        filters={filters}
        clusters={clusters}
        filtersVisible={filtersVisible}
        setSearchTerm={setSearchTerm}
      />
      <ApproveRejectModal
        displayApproveRejectModal={displayApproveRejectModal}
        setApproveRejectModal={setApproveRejectModal}
        selectedRows={selectedRows}
        selectedMonitoring={selectedMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        setClusterMonitoring={setClusterMonitoring}
      />
      <ClusterMonitoringTable
        clusterMonitoring={clusterMonitoring}
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
      />
    </>
  );
}

export default ClusterMonitoring;
