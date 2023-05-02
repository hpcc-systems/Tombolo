import React from 'react';

const GithubGuide = () => {
  /*
        Following the structure below will assist in keeping guide structure consistent throughout the project.
        <span> tags are utilized to bold key phrases to make content more easily scannable and emphasize important pieces of information
        Always follow a proper heading structure with <h3> as the top level heading (h2 is the title of the info drawer), and <h4> for subheadings
        All heading tags are automatically bolded, so no <span> tag is necessary
        Avoid use of <br/> tags, instead group text into a new <p> tag to achieve a break line for consistency. 
    */
  return (
    <div className="guide">
      <h2>Github Projects</h2>
      <p>
        Adding a Github Repository will allow files in that repository to be utilized in Dataflows. Tombolo can utilize
        ECL code within files to execute ECL queries and workloads in the designated cluster.
      </p>
      <h3>Username</h3>
      <p>
        Please provide the username of the GitHub account that has access to the repository, and that you have access to
        in order to generate an access token.
      </p>
      <h3>Access Tokens</h3>
      <p>
        In order for Tombolo to communicate with the repository, an access token must be generated. To learn how to
        generate an access token view{` `}
        <a
          target="_blank"
          rel="noreferrer"
          href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token">
          GitHubs guide
        </a>
        .
      </p>
      <h3>GitHub Link</h3>
      <p>
        Please provide the <span>full URL</span> to the desired repository{' '}
        <span>e.g. https://github.com/hpcc-systems/Tombolo.</span>
      </p>
      <h3>Branch or Tag</h3>
      <p>
        Tombolo will only pull documents from the latest commit of the selected branch or tag. Tombolo will reach out to
        GitHub to retrieve a valid list to select from.
      </p>
    </div>
  );
};

export default GithubGuide;
