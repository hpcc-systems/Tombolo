import React from 'react';

const WildCardGuide = () => {
  /*
        Following the structure below will assist in keeping guide structure consistent throughout the project.
        <span> tags are utilized to bold key phrases to make content more easily scannable and emphasize important pieces of information
        Always follow a proper heading structure with <h3> as the top level heading (h2 is the title of the info drawer), and <h4> for subheadings
        All heading tags are automatically bolded, so no <span> tag is necessary
        Avoid use of <br/> tags, instead group text into a new <p> tag to achieve a break line for consistency. 
    */
  return (
    <div className="guide">
      <h2>Wildcard Usage Guide</h2>
      <p>
        Wildcards are special characters that can stand in for unknown characters in a text value and are handy for
        locating multiple items with similar, but not identical data. Wildcards can also help with getting data based on
        a specified pattern match. For example, finding everyone named John on Park Street.
      </p>
      <br />
      <p>
        Tombolo can use wildcards to find assets that match a specific pattern. They are specially useful if you do not
        know the complete asset name but you know the pattern, or if you want to include all the assets that are of a
        specific pattern, or assets that are not currently in the cluster but could arrive in the future.
      </p>
      <h3>Wildcards Accepted by Tombolo</h3>
      <h4>Asterisk (*)</h4>
      <p>
        Matches any number of characters. You can use the asterisk <span>(*)</span> anywhere in a character string.
      </p>
      <span>Examples</span>
      <br />
      <ul>
        <li>
          <span>wh*</span> - finds what, white, and why, but not awhile or watch.
        </li>
        <li>
          <span>*wh*</span> - finds what, white, why and awhile, but not watch.
        </li>
      </ul>
      <h4>Question Mark (?)</h4>
      <p>Matches a single character in a specific position</p>
      <span>Examples</span>
      <br />
      <ul>
        <li>
          <span>b?ll</span> - finds ball, bell, and bill, but not bal.
        </li>
        <li>
          <span>Covid??Query</span> - finds Covid19Query, Covid98Query, CovidABQuery, but not Covid1Query.
        </li>
      </ul>
    </div>
  );
};

export default WildCardGuide;
