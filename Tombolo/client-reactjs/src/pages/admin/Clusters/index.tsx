import { useEffect, useState, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/store/hooks';
import { handleError } from '@/components/common/handleResponse';
import BreadCrumbs from '@/components/common/BreadCrumbs';
import ClusterActionBtn from '@/components/admin/clusters/ClusterActionBtn';
import ClustersTable from '@/components/admin/clusters/ClustersTable';
import ClusterDetailsModal from '@/components/admin/clusters/ClusterDetailsModal';
import AddClusterModal from '@/components/admin/clusters/AddClusterModal';
import EditClusterModal from '@/components/admin/clusters/EditClusterModal';
import clustersService from '@/services/clusters.service';
import configurationsService from '@/services/configurations.service';
import { clustersAddButtonTourShown, clustersFound } from '@/redux/slices/ApplicationSlice';

function Clusters() {
  // States
  const [clusters, setClusters] = useState<any[]>([]); // Already saved clusters
  const [clusterWhiteList, setClusterWhiteList] = useState<any[]>([]); // Cluster white list
  const [displayClusterDetailsModal, setDisplayClusterDetailsModal] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);
  const [displayAddClusterModal, setDisplayAddClusterModal] = useState(false);
  const [displayEditClusterModal, setDisplayEditClusterModal] = useState(false);
  const [tombolo_instance_name, setTombolo_instance_name] = useState<string | null>(null);

  //tour management
  const noClusters = useAppSelector(store => store.application.noClusters);
  const addClusterButtonRef = useRef<HTMLButtonElement | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const dispatch = useAppDispatch();

  // Effects
  useEffect(() => {
    // Get all saved clusters
    (async () => {
      try {
        const clusters = await clustersService.getAll();
        setClusters(clusters);
      } catch (e) {
        handleError('Failed to fetch clusters');
        console.error(e);
      }
    })();

    // Get cluster white list
    (async () => {
      try {
        const clusterWhiteList = await clustersService.getWhiteList();
        setClusterWhiteList(clusterWhiteList);
      } catch (e) {
        handleError('Failed to fetch cluster white list');
        console.error(e);
      }
    })();

    // Get tombolo instance name
    (async () => {
      try {
        const { instanceName } = await configurationsService.getInstanceDetails();
        setTombolo_instance_name(instanceName);
      } catch (e) {
        handleError('Failed to fetch instance name');
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    //show tour if needed
    if (noClusters.noClusters && noClusters.firstTourShown && !noClusters.addButtonTourShown) {
      setTourOpen(true);
      dispatch(clustersAddButtonTourShown(true));
    }
  }, [noClusters, dispatch]);

  //when cluster state is adjusted, dispatch redux action to update clusters in redux
  useEffect(() => {
    dispatch(clustersFound(clusters));
  }, [clusters, dispatch]);

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
