import React, { useState } from 'react';
import { message, Form, Row, Col, AutoComplete, Spin } from 'antd';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import { useSelector } from 'react-redux';
import ObjectKeyValue from '../../common/ObjectKeyValue';

const BasicTab = ({ orbitBuildDetails, setOrbitBuildDetails, selectedOrbitBuild, setSelectedOrbitBuild }) => {
  // useEffect(() => {
  //   if (orbitBuildDetails === null) {
  //     return;
  //   }

  //   if (orbitBuildDetails && orbitBuildDetails.metaData) {
  //     selectOrbitBuild(orbitBuildDetails.metaData.buildInfo.Name);
  //   }
  // }, [orbitBuildDetails]);

  const {
    application: { applicationId },
  } = useSelector((state) => state.applicationReducer);

  const [orbitBuildSuggestions, setOrbitBuildSuggestions] = useState([]);
  const [displayBuildInfo, setDisplayBuildInfo] = useState();
  const [loading, setLoading] = useState(false);

  const handleOrbitBuildSelect = async (selectedOrbitBuild) => {
    setSelectedOrbitBuild(selectedOrbitBuild);
    try {
      const url = `/api/orbit/getOrbitBuildDetails/${selectedOrbitBuild} `;
      const response = await fetch(url, { headers: authHeader() });
      if (!response.ok) handleError(response);
      let buildInfo = await response.json();

      const { Name, EnvironmentName, Status_DateCreated, Status_Code, HpccWorkUnit, Substatus_Code } = buildInfo;

      buildInfo = {
        Name: Name,
        Environment: EnvironmentName,
        'Most Recent Status': Status_Code,
        'Most Recent SubStatus': Substatus_Code,
        'Date Upated': Status_DateCreated,
        WorkUnit: HpccWorkUnit,
      };

      setDisplayBuildInfo(buildInfo);

      setOrbitBuildDetails(buildInfo);
    } catch (error) {
      console.log(error);
      message.error('There was an error getting file information from the cluster. Please try again');
    }
  };

  //loader to get suggestions
  const loadOrbitBuildSuggestions = async (searchText) => {
    setLoading(true);
    setSelectedOrbitBuild(searchText);
    if (searchText.length <= 3) {
      setLoading(false);
      return;
    }
    if (!searchText.match(/^[a-zA-Z0-9:_ -]*$/)) {
      return message.error('Invalid search keyword. Please remove any special characters from the keyword.');
    }
    try {
      const options = {
        method: 'GET',
        headers: authHeader(),
      };
      const response = await fetch(`/api/orbit/search/${applicationId}/${searchText}`, options);
      if (!response.ok) handleError(response);

      const suggestions = await response.json();

      const finalSuggestions = [];

      await suggestions.map((build) => {
        finalSuggestions.push({ value: build.Name, label: build.Name });
      });

      setOrbitBuildSuggestions(finalSuggestions);
      setLoading(false);
    } catch (error) {
      console.log(error);
      message.error('There was an error getting Builds from Orbit');
    }
  };

  return (
    <>
      <Form.Item label="Search For Build" name="build" required rules={[{ required: true, message: 'Required field' }]}>
        <Row gutter={[8, 0]}>
          <Col style={{ width: 'calc(75% - 8px)' }}>
            <AutoComplete
              options={orbitBuildSuggestions}
              onSelect={handleOrbitBuildSelect}
              onSearch={(searchText) => loadOrbitBuildSuggestions(searchText)}
              value={selectedOrbitBuild}
              status={loading ? 'warning' : null}></AutoComplete>
            <Spin spinning={loading} style={{ marginTop: '-1.6rem', float: 'right', marginRight: '1rem' }}></Spin>
          </Col>
        </Row>
      </Form.Item>

      {orbitBuildDetails ? (
        <>
          {displayBuildInfo ? (
            <>
              <div style={{ padding: '10px 18px', fontWeight: 'bold', border: '1px solid whitesmoke' }}>
                Build Details
              </div>
              <div
                style={{
                  height: 'fit-content',
                  padding: '10px 18px',
                  border: '1px solid whitesmoke',
                }}>
                <ObjectKeyValue obj={displayBuildInfo} />
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </>
  );
};

export default BasicTab;
