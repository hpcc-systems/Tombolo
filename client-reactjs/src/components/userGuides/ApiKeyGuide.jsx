import React from 'react';

const ApiKeyGuide = () => {
  return (
    <>
      <h3>
        <span style={{ fontWeight: '700' }}>URL Structure</span>
      </h3>
      <p>The basic URL structure is</p>
      <p>
        <span style={{ fontWeight: '700' }}>BASEURL/api/apikeys/APPLICATIONID/KEY?PARAMETERS</span>
      </p>
      <p>Below are descriptions of each portion of the URL.</p>
      <ul>
        <li>
          <h4>
            <span style={{ fontWeight: '700' }}>BASEURL</span>
          </h4>

          <p>
            The base URL of your tombolo instance can be found by looking at your current tombolo instance URL and
            selecting everything before the application ID.
          </p>
          <p>In the following example: </p>
          <p>https://tombolo.com/b8431e6e-2b5e-4889-9127-9bdaa0a09d71/dashboard</p>
          <p>the base url is https://tombolo.com</p>
        </li>
        <li>
          <h4>
            <span style={{ fontWeight: '700' }}>APPLICATIONID</span>
          </h4>

          <p>
            The APPLICATIONID can be found by looking at your current tombolo instance URL and selecting everything
            between the base url and your current page directory.
          </p>
          <p>In the following example: </p>
          <p>https://tombolo.com/b8431e6e-2b5e-4889-9127-9bdaa0a09d71/dashboard</p>
          <p>the application ID is b8431e6e-2b5e-4889-9127-9bdaa0a09d71</p>
        </li>
        <li>
          <h4>
            <span style={{ fontWeight: '700' }}>KEY</span>
          </h4>
          <p>Replace KEY with your generated API key.</p>
        </li>
        <li>
          <h4>
            <span style={{ fontWeight: '700' }}>PARAMETERS</span>
          </h4>
          <p>Paramter options are as follows</p>
          <p>
            <span style={{ fontWeight: '700' }}>first</span> - Selects only the first provided number of results.
          </p>
          <p>Example: ?first=10 will only return the first 10 results.</p>
          <p>
            <span style={{ fontWeight: '700' }}>offset</span> - Offsets the start of results returned, can be utilized
            in conjunction with first for pagination.
          </p>
          <p>Example: ?offset=10 will return all results after the first 10.</p>
          <p>
            <span style={{ fontWeight: '700' }}>Multiple Parameters</span> - Multiple parameters can be set for the same
            query. Each parameter will be seperated by the & character.
          </p>
          <p>
            Example: ?first=10&offset=10 will return the first 10 results after the first 10 are skipped. This structure
            can be utilized to return paginated results.
          </p>
        </li>
      </ul>
      <h3>
        <span style={{ fontWeight: '700' }}>Usage Limits</span>
      </h3>
      <p>To protect the integerity and security of our data, we have set usage limits on each key</p>
      <ul>
        <li>
          <h4>
            <span style={{ fontWeight: '700' }}>Every 15 minutes</span>
          </h4>
          <p>
            API Keys are limited to <span style={{ fontWeight: 700 }}>400</span> calls every 15 minutes.
          </p>
        </li>
        <li>
          <h4>
            <span style={{ fontWeight: 700 }}>Key Lifespan</span>
          </h4>
          <p>
            API Keys are limited to{' '}
            <span style={{ fontWeight: 700 }}>1000 multiplied by the total number of days the key is active for</span>
            calls.
          </p>
          <p>
            Example: Keys expire after 14 days. The total number of calls the key will be able to make is 1000 * 14 =
            14000.
          </p>
        </li>
      </ul>
      <h3>
        <span style={{ fontWeight: '700' }}>Expiration Date</span>
      </h3>
      <p>
        To protect the integerity and security of our data, we have set a default active time period for each key of{' '}
        <span style={{ fontWeight: '700' }}>14 days</span>. Each key will have an expiration date set 14 days from the
        creation time of said key. You{`'`}ll need to speak with an administrator to adjust the default length, with a
        maximum possible value of 365 days.
      </p>
    </>
  );
};

export default ApiKeyGuide;
