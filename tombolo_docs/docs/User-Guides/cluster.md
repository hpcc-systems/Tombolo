---
sidebar_position: 3
---

# Clusters

Tombolo can speak directly to HPCC clusters to run ECL code, monitor jobs, files, or cluster usage states, and schedule user-defined dataflows.

## Add your Cluster to the whitelist file

In order to make a cluster available to be added to applications, we first need to add the cluster to the "cluster whitelist". The cluster whitelist is a file in the server directory of tombolo that defines the connection parameters needed to connect to a cluster.

Create a file utilizing the following format, or use our conveniently provided "cluster-whitelist.sample.js" file to add your clusters. When finished, ensure the file is saved as cluster-whitelist.js and restart your server.

```
module.exports = {
    clusters: [
      {
        name: "My Local Cluster",
        thor: "https://localhost",
        thor_port: "18010",
        roxie: "https://localhost",
        roxie_port: "18002",
      },
      {
        name: "My Local Cluster2",
        thor: "https://localhost2",
        thor_port: "18010",
        roxie: "https://localhost2",
        roxie_port: "18002",
      },
    ],
  };
```

## Add the cluster to your application

Navigate to the Cluster management and creation screen by selecting "Clusters" under the "Admin" section of the left-hand navigation.

In the top right hand corner, click or select the "Add Cluster" button.

Select your cluster from the Host dropdown.

Username and Password:
If your desired cluster requires authentication, you will need to provide a valid username and password for Tombolo to utilize to access the cluster.

Admin:
One or more admins may be added to the cluster to be notified if connection to the cluster fails due to user credentials.
