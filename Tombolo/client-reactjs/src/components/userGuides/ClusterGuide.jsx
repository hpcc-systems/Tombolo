import React from 'react';

const ClusterGuide = () => {
  /*
        Following the structure below will assist in keeping guide structure consistent throughout the project.
        <span> tags are utilized to bold key phrases to make content more easily scannable and emphasize important pieces of information
        Always follow a proper heading structure with <h3> as the top level heading (h2 is the title of the info drawer), and <h4> for subheadings
        All heading tags are automatically bolded, so no <span> tag is necessary
        Avoid use of <br/> tags, instead group text into a new <p> tag to achieve a break line for consistency. 
    */
  return (
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
};

export default ClusterGuide;
