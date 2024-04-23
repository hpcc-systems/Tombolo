import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Button, Checkbox, Collapse, message } from 'antd';
import _ from 'lodash';

import FileDetailsPdf from './FileDetailsPdf';
import QueryDetailsPdf from './QueryDetailsPdf';
import IndexDetailsPdf from './IndexDetailsPdf';
import GroupDetailsPdf from './GroupDetailsPdf';
import { CollapseWrapper, PanelItems } from './pdfStyledComponents';
import JobDetailsPdf from './JobDetailsPdf';
import Text from '../../../common/Text';

function SelectDetailsForPdfDialog(props) {
  //Local States and variables
  const fileOptions = [
    { name: <Text text="Basic Information" />, value: 'filePdf_basic', active: true, checked: true },
    { name: <Text text="Layout Information" />, value: 'filePdf_layout', active: true, checked: false },
  ];
  const indexOptions = [
    { name: <Text text="Basic Information" />, value: 'indexPdf_basic', active: true, checked: true },
  ];
  const queryOptions = [
    { name: <Text text="Basic Information" />, value: 'queryPdf_basic', active: true, checked: true },
  ];
  const jobOptions = [
    { name: <Text text="Basic Information" />, value: 'jobPdf_basic', active: true, checked: true },
    { name: 'ECL', value: 'jobPdf_ecl', active: true, checked: false },
    { name: <Text text="Input Files" />, value: 'jobPdf_inputFiles', active: true, checked: false },
    { name: <Text text="Output Files" />, value: 'jobPdf_outputFiles', active: true, checked: false },
  ];
  const [classesToExportAsPdf, setClassesToExport] = useState([]);
  const [downloadPdf, setDownloadPdf] = useState(false);
  const [filteredAssets, setFilteredAssets] = useState();
  const [assetTypes, setAssetTypes] = useState();
  const { Panel } = Collapse;

  //Getting application id
  const applicationId = useSelector((state) => state.applicationReducer.application.applicationId);

  useEffect(() => {
    let assets = props.toPrintAssets.filter((item) => item.type !== 'Group');
    setFilteredAssets(assets);

    // removing duplicate file type
    const sortedAssetType = [...assets.reduce((map, obj) => map.set(obj.type, obj.type), new Map()).values()];
    setAssetTypes(sortedAssetType);
    sortedAssetType.map((item) => {
      setClassesToExport((arr) => [...arr, _.lowerCase(item) + 'Pdf_basic']);
    });
  }, []);

  //Handle checkbox change
  const handleCheckboxChange = ({ target }) => {
    const { checked, exporting } = target;
    if (checked) {
      setClassesToExport([...classesToExportAsPdf, exporting]);
    } else {
      setClassesToExport(classesToExportAsPdf.filter((item) => item !== exporting));
    }
  };
  //Checkboxes
  function renderCheckBoxes() {
    return (
      <CollapseWrapper>
        <Collapse defaultActiveKey={['0', '1', '2', '3']}>
          {assetTypes?.map((asset, index) => {
            switch (asset) {
              case 'File':
                return (
                  <Panel header={asset} key={index}>
                    {fileOptions.map((option, index) => {
                      return (
                        <PanelItems key={index}>
                          <Checkbox
                            key={option.value}
                            exporting={option.value}
                            disabled={!option.active}
                            onChange={handleCheckboxChange}
                            defaultChecked={option.checked}>
                            {option.name}
                          </Checkbox>
                        </PanelItems>
                      );
                    })}
                  </Panel>
                );

              case 'Query':
                return (
                  <Panel header={asset} key={index}>
                    {queryOptions.map((option, index) => {
                      return (
                        <PanelItems key={index}>
                          <Checkbox
                            key={option.value}
                            exporting={option.value}
                            disabled={!option.active}
                            onChange={handleCheckboxChange}
                            defaultChecked={option.checked}>
                            {option.name}
                          </Checkbox>
                        </PanelItems>
                      );
                    })}
                  </Panel>
                );

              case 'Index':
                return (
                  <Panel header={asset} key={index}>
                    {indexOptions.map((option, index) => {
                      return (
                        <PanelItems key={index}>
                          <Checkbox
                            key={option.value}
                            exporting={option.value}
                            disabled={!option.active}
                            onChange={handleCheckboxChange}
                            defaultChecked={option.checked}>
                            {option.name}
                          </Checkbox>
                        </PanelItems>
                      );
                    })}
                  </Panel>
                );

              case 'Job':
                return (
                  <Panel header={asset} key={index}>
                    {jobOptions.map((option, index) => {
                      return (
                        <PanelItems key={index}>
                          <Checkbox
                            key={option.value}
                            exporting={option.value}
                            disabled={!option.active}
                            onChange={handleCheckboxChange}
                            defaultChecked={option.checked}>
                            {option.name}
                          </Checkbox>
                        </PanelItems>
                      );
                    })}
                  </Panel>
                );
            }
          })}
        </Collapse>
      </CollapseWrapper>
    );
  }

  //What  to print based asset selection
  const divToPrint = (filteredAssets) => {
    if (filteredAssets.length == 1) {
      switch (filteredAssets[0].type) {
        case 'File':
          return (
            <div>
              <FileDetailsPdf
                assets={filteredAssets}
                selectedAssetId={filteredAssets[0].id}
                applicationId={applicationId}
                classesToExport={classesToExportAsPdf}
                setVisiblity={props.setVisiblity}
                printingTaskCompleted={props.printingTaskCompleted}
              />
            </div>
          );

        case 'Query':
          return (
            <div>
              <QueryDetailsPdf
                assets={filteredAssets}
                selectedAssetId={filteredAssets[0].id}
                applicationId={applicationId}
                classesToExport={classesToExportAsPdf}
                setVisiblity={props.setVisiblity}
                printingTaskCompleted={props.printingTaskCompleted}
              />
            </div>
          );

        case 'Index':
          return (
            <div>
              <IndexDetailsPdf
                assets={filteredAssets}
                selectedAssetId={filteredAssets[0].id}
                applicationId={applicationId}
                classesToExport={classesToExportAsPdf}
                setVisiblity={props.setVisiblity}
                printingTaskCompleted={props.printingTaskCompleted}
              />
            </div>
          );

        case 'Job':
          return (
            <div>
              <JobDetailsPdf
                assets={filteredAssets}
                selectedAssetId={filteredAssets[0].id}
                applicationId={applicationId}
                classesToExport={classesToExportAsPdf}
                setVisiblity={props.setVisiblity}
                printingTaskCompleted={props.printingTaskCompleted}
              />
            </div>
          );
      }
    } else if (filteredAssets.length > 1) {
      return (
        <GroupDetailsPdf
          assets={filteredAssets}
          nestedAssets={filteredAssets}
          applicationId={applicationId}
          classesToExport={classesToExportAsPdf}
          setVisiblity={props.setVisiblity}
          printingTaskCompleted={props.printingTaskCompleted}
        />
      );
    }
  };

  //When download PDF button is clicked
  const downloadDoc = () => {
    if (classesToExportAsPdf.length == 0) {
      message.config({ top: 100 });
      message.error('Select one or more options');
    } else {
      setDownloadPdf(true);
    }
  };

  return (
    <Modal
      open={props.visible}
      title={<Text text="Select items to include in PDF" />}
      onOk={downloadDoc}
      onCancel={() => props.setVisiblity(false)}
      width={650}
      footer={[
        <Button key="back" onClick={() => props.setVisiblity(false)} type="primary" ghost>
          {<Text text="Cancel" />}
        </Button>,
        <Button key="submit" onClick={downloadDoc} type="primary" loading={downloadPdf}>
          {downloadPdf ? <Text text="Downloading" /> : <Text text="Download PDF" />}
        </Button>,
      ]}>
      {renderCheckBoxes()}
      <div style={{ position: 'absolute', left: '-999em' }}>{downloadPdf ? divToPrint(filteredAssets) : null}</div>
    </Modal>
  );
}

export default SelectDetailsForPdfDialog;
