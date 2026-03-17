import React from 'react';

const ApplicationsGuide: React.FC = () => (
  <div className="guide">
    <h2>Applications Guide</h2>
    <p>
      Applications provide a way to seperate groups of data and settings inside of Tombolo. Each application has its own
      set of Monitorings and Notifications as well as administration settings. You can switch application instances at
      any time by utilizing the selector in the top left corner of the navigation bar, by the Tombolo logo.
    </p>
    <p>
      Common use cases for multiple applications are departments with several divisions where each division wants to
      maintain its own data and notifications, but be hosted on the same instance.
    </p>
    <h3>Applications share: </h3>
    <ul>
      <li>
        <p>Environment Variables, such as API key valid time period, Cluster Whitelists, and Email Configurations</p>
      </li>
      <li>
        <p>Database</p>
      </li>
      <li>
        <p>Host Machine Settings, such as firewalls.</p>
      </li>
    </ul>

    <h3>Applications do not share: </h3>
    <ul>
      <li>
        <p>Assets</p>
      </li>
      <li>
        <p>DataFlows</p>
      </li>
      <li>
        <p>Jobs</p>
      </li>
      <li>
        <p>Monitorings</p>
      </li>
      <li>
        <p>Notifications</p>
      </li>
      <li>
        <p>Dashboard Data</p>
      </li>
    </ul>

    <h3>Visibility</h3>
    <ul>
      <li>
        <p>
          <span>Public</span> - Public applications are visible to any user that has login credentials to the Tombolo
          Instance.
        </p>
      </li>
      <li>
        <p>
          <span>Private</span> - Private applications are only visible to the user who creates the instance, and other
          administrators of the Tombolo Instance.
        </p>
      </li>
    </ul>
  </div>
);

export default ApplicationsGuide;
