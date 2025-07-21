import React, { useState, useEffect } from 'react';
import { Tour } from 'antd';
import { applicationActions } from '../../redux/actions/Application';
import { useDispatch } from 'react-redux';

const Tours = ({ applicationReducer, appLinkRef, clusterLinkRef }) => {
  //tour states
  const [tourOpen, setTourOpen] = useState(false);
  const [clusterTourOpen, setClusterTourOpen] = useState(false);
  const { application, applicationsRetrieved, noApplication, noClusters, clusters } = applicationReducer;

  const dispatch = useDispatch();

  //useEffect to show tours for new users
  useEffect(() => {
    if (
      !application?.applicationId &&
      noApplication.noApplication &&
      !noApplication.firstTourShown &&
      applicationsRetrieved
    ) {
      if (window.location.pathname !== '/admin/applications') {
        setTourOpen(true);
        dispatch(applicationActions.updateApplicationLeftTourShown(true));
      }
    }

    if (application?.applicationId && noClusters.noClusters && !noClusters.firstTourShown && !clusters.length) {
      if (window.location.pathname !== '/admin/clusters') {
        setClusterTourOpen(true);
        dispatch(applicationActions.updateClustersLeftTourShown(true));
      }
    }
  }, [applicationReducer]);

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
