import React from 'react';

const ClusterGuide: React.FC = () => (
  <div className="guide">
    <h2>Cluster Guide</h2>
    <p>
      Tombolo can speak directly to HPCC clusters to run ECL code, monitor jobs, files, or cluster usage states, and
      schedule user-defined dataflows.
    </p>
    <h3>Adding new Clusters to the select menu: </h3>
    <p>Clusters need to be added to the cluster-whitelist.js file by a system administrator. </p>
    <h3>Username and Password: </h3>
    <p>
      If your desired cluster requires authentication, you will need to provide a valid username and password for
      Tombolo to utilize to access the cluster.
    </p>
    <h3>Admin</h3>
    <p>
      One or more admins may be added to the cluster to be notified if connection to the cluster fails due to user
      credentials.
    </p>
  </div>
);

export default ClusterGuide;
