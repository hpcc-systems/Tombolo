import React, { useState, useEffect } from 'react';
import { Tour } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { applicationLeftTourShown, clustersLeftTourShown } from '@/redux/slices/ApplicationSlice';

const Tours = ({ appLinkRef, clusterLinkRef }) => {
  //tour states
  const [tourOpen, setTourOpen] = useState(false);
  const [clusterTourOpen, setClusterTourOpen] = useState(false);

  const application = useSelector((state) => state.application.application);
  const applicationsRetrieved = useSelector((state) => state.application.applicationsRetrieved);
  const noApplication = useSelector((state) => state.application.noApplication);
  const noClusters = useSelector((state) => state.application.noClusters);
  const clusters = useSelector((state) => state.application.clusters);

  const dispatch = useDispatch();

  //useEffect to show tours for new users
  useEffect(() => {
    if (
      !application?.applicationId &&
      noApplication?.noApplication &&
      !noApplication?.firstTourShown &&
      applicationsRetrieved
    ) {
      if (window.location.pathname !== '/admin/applications') {
        setTourOpen(true);
        dispatch(applicationLeftTourShown(true));
      }
    }

    if (
      application?.applicationId &&
      noClusters?.noClusters &&
      !noClusters?.firstTourShown &&
      Array.isArray(clusters) &&
      clusters.length === 0
    ) {
      if (window.location.pathname !== '/admin/clusters') {
        setClusterTourOpen(true);
        dispatch(clustersLeftTourShown(true));
      }
    }
  }, [
    application?.applicationId,
    noApplication?.noApplication,
    noApplication?.firstTourShown,
    applicationsRetrieved,
    noClusters?.noClusters,
    noClusters?.firstTourShown,
    dispatch,
    clusters.length,
  ]);

  //click handler for tour closing
  const handleClick = (e) => {
    if (appLinkRef.current && appLinkRef.current.contains(e.target)) {
      setTourOpen(false);
    }

    if (clusterLinkRef.current && clusterLinkRef.current.contains(e.target)) {
      setClusterTourOpen(false);
    }
  };

  //add event listener to close tour on click
  useEffect(() => {
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  //tour closing methods
  const handleTourShownClose = () => {
    setTourOpen(false);
  };

  const handleClusterTourShownClose = () => {
    setClusterTourOpen(false);
  };

  //app tour steps
  const steps = [
    {
      title: 'Welcome to Tombolo',
      description:
        'There is some setup that we need to complete before being able to fully utilize Tombolo. We will unlock features as we move through this interactive tutorial.',
      target: null,
    },
    {
      title: 'Applications',
      description: (
        <>
          <p>
            It looks like you have not set up an application yet. Applications are a necessary part of Tombolos basic
            functions, and we must set one up before unlocking the rest of the application. Click on the navigation
            element to head to the application management screen and set one up.
          </p>
          <br />
          <p>
            If youre interested to read more about applications, head to our documentation page at{' '}
            <a
              target="_blank"
              rel="noreferrer"
              href="https://hpcc-systems.github.io/Tombolo/docs/User-Guides/application">
              our documentation site.
            </a>
          </p>
        </>
      ),
      placement: 'right',
      arrow: true,
      target: appLinkRef.current,
      nextButtonProps: { style: { display: 'none' }, disabled: true },
      prevButtonProps: { style: { display: 'none' }, disabled: true },
    },
  ];

  //cluster tour steps
  const clusterSteps = [
    {
      title: 'Clusters',
      description: (
        <>
          <p>
            Now that we have an application set up, we can connect to an hpcc systems cluster to unlock the rest of the
            application. Click the navigation element to head to the cluster management screen and set one up.
          </p>
          <br />
          <p>
            If youre interested to read more about Clusters, head to our documentation page at{' '}
            <a target="_blank" rel="noreferrer" href="https://hpcc-systems.github.io/Tombolo/docs/User-Guides/cluster">
              our documentation site.
            </a>
          </p>
        </>
      ),
      placement: 'right',
      arrrow: true,
      target: clusterLinkRef.current,
      nextButtonProps: { style: { display: 'none' }, disabled: true },
    },
  ];

  return (
    <>
      <Tour steps={steps} open={tourOpen} onClose={handleTourShownClose} indicatorsRender={() => <></>} />
      <Tour steps={clusterSteps} open={clusterTourOpen} onClose={handleClusterTourShownClose} />
    </>
  );
};

export default Tours;
