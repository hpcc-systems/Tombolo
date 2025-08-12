import React from 'react';

const CostMonitoringSumGuide = () => {
  /*
        Following the structure below will assist in keeping guide structure consistent throughout the project.
        <span> tags are utilized to bold key phrases to make content more easily scannable and emphasize important pieces of information
        Always follow a proper heading structure with <h3> as the top level heading (h2 is the title of the info drawer), and <h4> for subheadings
        All heading tags are automatically bolded, so no <span> tag is necessary
        Avoid use of <br/> tags, instead group text into a new <p> tag to achieve a break line for consistency.
    */
  return (
    <div className="guide">
      <h2>Sum Cost Monitoring</h2>
      <p>What summing actually does depends on the monitoring scope.</p>
      <h3>Sum for Cluster cost monitoring:</h3>
      <p>The total cost of all clusters selected will be summed and checked against the threshold.</p>
      {/*<p>*/}
      {/*  <span>Span will make text bold for highlighting key information</span>*/}
      {/*</p>*/}
      {/*<ul>*/}
      {/*  <li>*/}
      {/*    <h4>First Sub Heading</h4>*/}
      {/*    <p>Description of sub heading content</p>*/}
      {/*    <p>Line break to next description of first subheading</p>*/}
      {/*  </li>*/}
      {/*  <li>*/}
      {/*    <h4>Second Sub Heading</h4>*/}
      {/*    <p>Description of sub heading content</p>*/}
      {/*  </li>*/}
      {/*  <li>*/}
      {/*    <h4>Third Sub Heading</h4>*/}
      {/*    <p>Description of sub heading content</p>*/}
      {/*  </li>*/}
      {/*</ul>*/}
      <h3>Sum for User cost monitoring:</h3>
      <p>The total cost of selected users across selected clusters will be summed and checked against the threshold.</p>
      {/*<ul>*/}
      {/*  <li>*/}
      {/*    <h4>First Sub Heading</h4>*/}
      {/*    <p>Description of sub heading content</p>*/}
      {/*  </li>*/}
      {/*  <li>*/}
      {/*    <h4>Second Sub Heading</h4>*/}
      {/*    <p>Description of sub heading content</p>*/}
      {/*  </li>*/}
      {/*  <li>*/}
      {/*    <h4>Third Sub Heading</h4>*/}
      {/*    <p>Description of sub heading content</p>*/}
      {/*  </li>*/}
      {/*</ul>*/}
    </div>
  );
};

export default CostMonitoringSumGuide;
