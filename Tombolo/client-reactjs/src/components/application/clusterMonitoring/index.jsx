/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Form } from 'antd';
import { getRoleNameArray } from '../../common/AuthUtil.js';
import ClusterMonitoringTable from './ClusterMonitoringTable';
import BreadCrumbs from '../../common/BreadCrumbs';
import { getAllClusterMonitoring } from './clusterMonitoringUtils.js';
import ViewDetailsModal from './ViewDetailsModal';
import ActionButton from './ActionButton';
import AddEditModal from './AddEditModal/AddEditModal.jsx';
import { useDomainAndCategories } from '../../../hooks/useDomainsAndProductCategories';
import { useMonitorType } from '../../../hooks/useMonitoringType';
// import ClusterMonitoringFilters from './ClusterMonitoringFilters';

// Constants
const monitoringTypeName = 'Cluster  Monitoring';

function ClusterMonitoring() {
  //Redux
  const {
    application: { applicationId },
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
  const [erroneousTabs, setErroneousTabs] = useState([]);
  const [form] = Form.useForm();

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

  //JSX
  return (
    <>
      <BreadCrumbs extraContent={<ActionButton setDisplayAddEditModal={setDisplayAddEditModal} />} />
      {displayAddEditModal && (
        <AddEditModal
          displayAddEditModal={displayAddEditModal}
          setDisplayAddEditModal={setDisplayAddEditModal}
          form={form}
          erroneousTabs={erroneousTabs}
          domains={domains}
          productCategories={productCategories}
          setProductCategories={setProductCategories}
          selectedDomain={selectedDomain}
          setSelectedDomain={setSelectedDomain}
          clusterMonitoring={clusterMonitoring}
          setClusterMonitoring={setClusterMonitoring}
        />
      )}
      {displayViewDetailsModal && (
        <ViewDetailsModal
          setDisplayViewDetailsModal={setDisplayViewDetailsModal}
          selectedMonitoring={selectedMonitoring}
          setSelectedMonitoring={setSelectedMonitoring}
        />
      )}
      {/* <ClusterMonitoringFilters /> */}
      <ClusterMonitoringTable
        clusterMonitoring={clusterMonitoring}
        applicationId={applicationId}
        setClusterMonitoring={setClusterMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        notificationDetails={notificationDetails}
        setNotificationDetails={setNotificationDetails}
        isReader={isReader}
        setDisplayViewDetailsModal={setDisplayViewDetailsModal}
      />
    </>
  );
}

export default ClusterMonitoring;

// 546
