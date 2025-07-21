import React from 'react';

function JobNamePattern() {
  return (
    <div className="guide">
      <h2>Job Name Pattern</h2>

      <p>The job name you wish to monitor on the Thor server can be specified in a few ways:</p>

      <h3>Exact Job Name or Wildcard String</h3>
      <p>
        You can provide the exact name of the job or a wildcard string representing a job name. If the job name is
        dependent on dates or other variable values, replace the actual date with one of the valid options or replace
        variable values with &apos;*&apos;.
      </p>

      <p>
        Note: The date options will be replaced by the exact format specified below and &apos;*&apos; will match 0 to n
        characters in the job name.
      </p>

      <div className="appendix">
        <h3> Date Terms and Formats</h3>

        <h3>&lt;DATE&gt;</h3>
        <p>
          This will be replaced by the current date, in YYYYMMDD format. For example, if &quot;Launch &lt;DATE&gt;
          Current Carrier&quot; is specified, the system will replace &lt;DATE&gt; with the current date. If
          today&apos;s date is Mar 16th, 2021, the replaced value will be &quot;Launch 20210316 Current Carrier&quot;.
        </p>

        <h3>&lt;DATE,ADJUSTMENT,FORMAT&gt;</h3>
        <p>
          This will be replaced by the current date adjusted by the number of days specified in the
          &quot;ADJUSTMENT&quot; option, as per the format specified in the &quot;FORMAT&quot; option.
        </p>

        <h4>ADJUSTMENT options:</h4>
        <ul>
          <li>Positive number: current date plus the number of days specified</li>
          <li>Negative number: current date minus the number of days specified</li>
          <li>0: current date</li>
        </ul>

        <p>
          If the user-provided ADJUSTMENT value cannot be parsed by the system, the default value (current date) will be
          used.
        </p>

        <h4>FORMAT options:</h4>
        <ul>
          <li>%Y: Full year (yyyy)</li>
          <li>%m: Month (two digits)</li>
          <li>%d: Day of month (two digits)</li>
          <li>%t: Whitespace</li>
          <li>%y: Year within century (00-99)</li>
          <li>%B: Full month name</li>
          <li>%b or %h: Abbreviated month name</li>
          <li>%e: Day of month (two digits, or a space followed by a single digit)</li>
          <li>%j: Julian day (1-366)</li>
        </ul>

        <p>
          These options can be specified with or without separators (hyphen (-), forward slash (/), underscore (_) or
          space). The common supported date formats are:
        </p>

        <ul>
          <li>%m/%d/%Y: mm/dd/yyyy</li>
          <li>%d/%m/%Y: dd/mm/yyyy</li>
          <li>%Y-%m-%d: yyyy-mm-dd</li>
          <li>%Y%m%d: yyyymmdd</li>
          <li>%d-%b-%Y: dd-mon-yyyy</li>
        </ul>

        <p>
          For example, if &quot;Launch &lt;DATE,1,%Y_%m_%d&gt; Alirts Despray&quot; is specified, the system will
          replace &lt;DATE&gt; with the current date and adjust by the number of days and format as specified. If
          today&apos;s date is Mar 16th, 2021, the replaced value will be &quot;Launch 20210317 Alirts Despray&quot;.
        </p>
      </div>

      <h3>Examples</h3>
      <p>Here are some examples of how to specify the job name:</p>

      <ul>
        <li>Launch &lt;DATE&gt; Current Carrier</li>
        <li>Launch*Alirts Despray</li>
        <li>Launch &lt;DATE&gt;*Alirts Despray</li>
        <li>Launch &lt;DATE,-1,%Y-%m-%d&gt; FCRA DL Key Build*</li>
        <li>Launch &lt;DATE,0,%y/%m/%d&gt;* Alirts Despray</li>
        <li>Launch &lt;DATE,1,%Y_%m_%d&gt; Alirts Despray</li>
      </ul>

      <p>
        If &quot;Launch &lt;DATE&gt; Current Carrier&quot; is specified, the system will replace the &lt;DATE&gt; term
        with today&apos;s date (e.g., Mar 16th, 2021), resulting in the final job name &quot;Launch 20210316 Current
        Carrier&quot; for monitoring.
      </p>

      <p>
        If &quot;Launch &lt;DATE,1,%Y_%m_%d&gt; Alirts Despray&quot; is specified, the system will replace the
        &lt;DATE&gt; term with today&apos;s date (e.g., Mar 16th, 2021), adjust the number of days and format as
        specified, resulting in the final job name &quot;Launch 20210317 Alirts Despray&quot; for monitoring.
      </p>

      <h3>Invalid Job Name</h3>
      <p>
        If an invalid job name or pattern is provided, Tombolo won&apos;t be able to monitor the job correctly. It may
        search for a non-existent name or mistakenly monitor a wrong job that matches the pattern. Therefore, please
        ensure the name or pattern you provide is correct.
      </p>
    </div>
  );
}

export default JobNamePattern;
