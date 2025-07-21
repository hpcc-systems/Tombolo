import React from 'react';

const ApplicationsGuide = () => {
  /*
        Following the structure below will assist in keeping guide structure consistent throughout the project.
        <span> tags are utilized to bold key phrases to make content more easily scannable and emphasize important pieces of information
        Always follow a proper heading structure with <h3> as the top level heading (h2 is the title of the info drawer), and <h4> for subheadings
        All heading tags are automatically bolded, so no <span> tag is necessary
        Avoid use of <br/> tags, instead group text into a new <p> tag to achieve a break line for consistency. 
    */
  return (
    <div className="guide">
      <h2>Applications Guide</h2>
      <p>
        Applications provide a way to seperate groups of data and settings inside of Tombolo. Each application has its
        own set of Assets, Dataflows, Jobs, Monitorings, and Notifications as well as administration settings. You can
        switch application instances at any time by utilizing the selector in the top left corner of the navigation bar,
        by the Tombolo logo.
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
};

export default ApplicationsGuide;
