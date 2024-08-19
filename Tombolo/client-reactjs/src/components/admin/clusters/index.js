import React, { useEffect, useState, useRef } from 'react';
import { message } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { applicationActions } from '../../../redux/actions/Application';
import BreadCrumbs from '../../common/BreadCrumbs';
import ClusterActionBtn from './ClusterActionBtn';
import ClustersTable from './ClustersTable';
import ClusterDetailsModal from './ClusterDetailsModal';
import AddClusterModal from './AddClusterModal';
import EditClusterModal from './EditClusterModal';
import { getAllClusters, getClusterWhiteList, getConfigurationDetails } from './clusterUtils';

function Clusters() {
  // States
  const [clusters, setClusters] = useState([]); // Already saved clusters
  const [clusterWhiteList, setClusterWhiteList] = useState([]); // Cluster white list
  const [displayClusterDetailsModal, setDisplayClusterDetailsModal] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [displayAddClusterModal, setDisplayAddClusterModal] = useState(false);
  const [displayEditClusterModal, setDisplayEditClusterModal] = useState(false);
  const [tombolo_instance_name, setTombolo_instance_name] = useState(null);

  //tour management
  const { applicationReducer } = useSelector((store) => store);
  const addClusterButtonRef = useRef(null);
  const [tourOpen, setTourOpen] = useState(false);
  const dispatch = useDispatch();

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

    // Get tombolo instance name
    (async () => {
      try {
        const { instanceName } = await getConfigurationDetails();
        setTombolo_instance_name(instanceName);
      } catch (e) {
        message.error('Failed to fetch instance name');
      }
    })();
  }, []);

  useEffect(() => {
    //show tour if needed
    if (
      applicationReducer.noClusters.noClusters &&
      applicationReducer.noClusters.firstTourShown &&
      !applicationReducer.noClusters.addButtonTourShown
    ) {
      setTourOpen(true);
      dispatch(applicationActions.updateClustersAddButtonTourShown(true));
    }
  }, [applicationReducer]);

  //when cluster state is adjusted, dispatch redux action to update clusters in redux
  useEffect(() => {
    dispatch(applicationActions.updateClusters(clusters));
  }, [clusters]);

  return (
    <>
      <BreadCrumbs
        extraContent={
          <ClusterActionBtn
            setDisplayAddClusterModal={setDisplayAddClusterModal}
            tourOpen={tourOpen}
            setTourOpen={setTourOpen}
            addClusterButtonRef={addClusterButtonRef}
          />
        }
      />
      <ClustersTable
        clusters={clusters}
        setClusters={setClusters}
        setDisplayClusterDetailsModal={setDisplayClusterDetailsModal}
        setSelectedCluster={setSelectedCluster}
        setDisplayEditClusterModal={setDisplayEditClusterModal}
      />

      {displayClusterDetailsModal && (
        <ClusterDetailsModal
          displayClusterDetailsModal={displayClusterDetailsModal}
          setDisplayClusterDetailsModal={setDisplayClusterDetailsModal}
          selectedCluster={selectedCluster}
          setSelectedCluster={setSelectedCluster}
        />
      )}

      {displayAddClusterModal && (
        <AddClusterModal
          displayAddClusterModal={displayAddClusterModal}
          setDisplayAddClusterModal={setDisplayAddClusterModal}
          clusters={clusters}
          setClusters={setClusters}
          clusterWhiteList={clusterWhiteList}
          tombolo_instance_name={tombolo_instance_name}
        />
      )}

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