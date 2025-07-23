import React from 'react';

const MaximumDepthGuide = () => {
  return (
    <div className="guide">
      <h2>Maximum Depth</h2>
      <p>
        The Maximum Depth setting controls <span>how deep into the directory structure</span> the monitoring will search
        for files.
      </p>

      <h3>Understanding Directory Depth</h3>
      <p>
        Directory depth refers to the number of subdirectory levels below the selected monitoring directory that will be
        included in the monitoring scope.
      </p>

      <h4>Depth Values</h4>
      <ul>
        <li>
          <span>Depth 0:</span> Only monitor files in the selected directory itself (no subdirectories)
        </li>
        <li>
          <span>Depth 1:</span> Monitor files in the selected directory and one level of subdirectories
        </li>
        <li>
          <span>Depth 2:</span> Monitor files in the selected directory and up to two levels of subdirectories
        </li>
        <li>
          <span>And so on...</span> The higher the number, the deeper the monitoring will search
        </li>
      </ul>

      <h3>Example</h3>
      <p>If your directory structure looks like this:</p>
      <ul>
        <li>
          <span>/data/landing/</span> (selected directory)
          <ul>
            <li>
              <span>file1.txt</span> (depth 0)
            </li>
            <li>
              <span>folder1/</span> (depth 1)
              <ul>
                <li>
                  <span>file2.txt</span> (depth 1)
                </li>
                <li>
                  <span>subfolder/</span> (depth 2)
                  <ul>
                    <li>
                      <span>file3.txt</span> (depth 2)
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
      <p>
        Setting Maximum Depth to <span>1</span> would monitor <span>file1.txt and file2.txt</span>, but not file3.txt.
      </p>

      <h3>Performance Considerations</h3>
      <p>
        <span>Higher depth values may impact performance</span> as the monitoring system needs to scan more directories
        and files. Choose the minimum depth necessary for your monitoring requirements.
      </p>
    </div>
  );
};

export default MaximumDepthGuide;
