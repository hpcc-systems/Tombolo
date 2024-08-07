import React, { useEffect, useState } from 'react';
import { message } from 'antd';

import BreadCrumbs from '../../common/BreadCrumbs';
import ClusterActionBtn from './ClusterActionBtn';
import ClustersTable from './ClustersTable';
import ClusterDetailsModal from './ClusterDetailsModal';
import AddClusterModal from './AddClusterModal';
import EditClusterModal from './EditClusterModal';
import { getAllClusters, getClusterWhiteList } from './clusterUtils';

function Clusters() {
  // States
  const [clusters, setClusters] = useState([]); // Already saved clusters
  const [clusterWhiteList, setClusterWhiteList] = useState([]); // Cluster white list
  const [displayClusterDetailsModal, setDisplayClusterDetailsModal] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [displayAddClusterModal, setDisplayAddClusterModal] = useState(false);
  const [displayEditClusterModal, setDisplayEditClusterModal] = useState(false);

  // Effects
  useEffect(() => {
    // Get all saved clusters
    (async () => {
      try {
        const clusters = await getAllClusters();
        setClusters(clusters);
      } catch (e) {
        message.error('Failed to fetch clusters');
      }
    })();

    // Get cluster white list
    (async () => {
      try {
        const clusterWhiteList = await getClusterWhiteList();
        setClusterWhiteList(clusterWhiteList);
      } catch (e) {
        message.error('Failed to fetch cluster white list');
      }
    })();
  }, []);
  return (
    <>
      <BreadCrumbs extraContent={<ClusterActionBtn setDisplayAddClusterModal={setDisplayAddClusterModal} />} />
      <ClustersTable
        clusters={clusters}
        setClusters={setClusters}
        setDisplayClusterDetailsModal={setDisplayClusterDetailsModal}
        setSelectedCluster={setSelectedCluster}
        setDisplayEditClusterModal={setDisplayEditClusterModal}
      />
      <ClusterDetailsModal
        displayClusterDetailsModal={displayClusterDetailsModal}
        setDisplayClusterDetailsModal={setDisplayClusterDetailsModal}
        selectedCluster={selectedCluster}
        setSelectedCluster={setSelectedCluster}
      />
      <AddClusterModal
        displayAddClusterModal={displayAddClusterModal}
        setDisplayAddClusterModal={setDisplayAddClusterModal}
        clusters={clusters}
        setClusters={setClusters}
        clusterWhiteList={clusterWhiteList}
      />
      {displayEditClusterModal && (
        <EditClusterModal
          displayEditClusterModal={displayEditClusterModal}
          setDisplayEditClusterModal={setDisplayEditClusterModal}
          selectedCluster={selectedCluster}
          setClusters={setClusters}
        />
      )}
    </>
  );
}

export default Clusters;
