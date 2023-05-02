import React from 'react';

const style = {
  marginTop: '20px',
};

function DataFlowGUide() {
  return (
    <div>
      <h2>Dataflows</h2>
      <div>
        To automate job execution, you can create dataflows. To create a dataflow, you must first import all the
        necessary assets into Tombolo. Once you have imported the assets, you can create a new dataflow by clicking on
        the add button and providing the details.
      </div>
      <div style={style}>
        <h3>Cluster Username and Password</h3>
        <div>
          If the cluster where the jobs are configured to run requires authentication, you must provide the username and
          password for the cluster. If a cluster requires authentication and you do not provide a username and password,
          Tombolo will use the credentials provided during the cluster configuration step as the default.
        </div>

        <div style={style}>
          <h3>Notification</h3>
          <div>
            You can configure notifications to receive alerts when a dataflow successfully runs, fails, or when either
            of these two events occur. By default, notification for dataflows are not set.
          </div>
        </div>

        <div style={style}>
          <h3>Dataflow Versions</h3>
          <div>
            You can design and save multiple versions of your dataflows. Once you are satisfied with your design, you
            can make the version live to start running. If you need to modify a running dataflow, you can pull the
            dataflow as a working copy into the canvas and make modifications. This way, the running versions are not
            affected.
          </div>
        </div>

        <div style={style}>
          <h3>Sub Processes</h3>
          <div>
            You can use subprocesses to break a dataflow into smaller sub-processes. If a dataflow is too large, you can
            move jobs to small subprocesses to organize your dataflow
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataFlowGUide;
