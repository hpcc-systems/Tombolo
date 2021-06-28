import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { Modal, Button, Checkbox, Collapse, message } from "antd";
import { authHeader, handleError } from "../../../common/AuthHeader";
import _ from "lodash";
import FileDetailsPdf from "./FileDetailsPdf";
import QueryDetailsPdf from "./QueryDetailsPdf";
import IndexDetailsPdf from "./IndexDetailsPdf";
import GroupDetailsPdf from "./GroupDetailsPdf";
import { CollapseWrapper, PanelItems } from "./pdfStyledComponents";
import JobDetailsPdf from "./JobDetailsPdf";

function SelectDetailsForPdfDialog(props) {
  //Local States and variables
  const fileOptions = [{name: "Basic Information",value: "filePdf_basic",active: true,checked: true,},
                       {name: "Layout Information", value: "filePdf_layout",active: true,checked: false,},];
  const indexOptions = [{name: "Basic Information",value: "indexPdf_basic",active: true,checked: true,}];
  const queryOptions = [{name: "Basic Information", value: "queryPdf_basic",active: true,checked: true, }];
  const jobOptions = [{name: "Basic Information",value: "jobPdf_basic", active: true,checked: true,},
                      { name: "ECL", value: "jobPdf_ecl", active: true, checked: false },
                      {name: "Input Files",value: "jobPdf_inputFiles",active: true,checked: false,},
                      { name: "Output Files",value: "jobPdf_outputFiles", active: true,checked: false, }, ];
  const [classesToExportAsPdf, setClassesToExport] = useState([]);
  const [nestedAssets, setNestedAssets] = useState([]);
  const [downloadPdf, setDownloadPdf] = useState(false);
  const directoryTree = useSelector(state => state.directoryTreeReducer)
  const { Panel } = Collapse;

  //Getting application id
  const applicationId = useSelector(
    (state) => state.applicationReducer.application.applicationId
  );

  //Function to fetch nested assets if props.selectedAsset.type is Group
  const fetchNestedAssets = ( applicationId, assetId, callback) => {
    let url = `/api/groups/assets?app_id=${applicationId}&group_id=${assetId}`;
    return fetch(url, {
      headers: authHeader(),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .catch((error) => {
        console.log(error);
      });
  };


  //Flatten tree
  let list = [];
  const generateList = (data) => {
    for (let i = 0; i < data.length; i++) {
      const node = data[i];
      const { key, title, id } = node;
      list.push({ key, title, id });
      if (node.children) {
        generateList(node.children);
      }
    }
    return list;
  };

  //Find correct node
  const findCorrectNode = (data, assetId) =>{
    for(let i=0; i < data.length; i++){
      let item = data[i];
      if(item.id == assetId){
         generateList([item])
      }else if (item.children){
        findCorrectNode(item.children, assetId);
      }   
    }
  }


  useEffect(() => {
    const abortFetch = new AbortController();
    const { type } = props.selectedAsset;
    findCorrectNode(directoryTree.tree, props.selectedAsset.id);
   
    //Set default export classes for individual assets
    if (props.selectedAsset.type !== "Group") {
      setClassesToExport([_.lowerCase(type) + "Pdf_basic"]);
    }

    list.map(item => {
      fetchNestedAssets(applicationId, item.id, abortFetch ).then(data => {
        setNestedAssets(existingAssets => [...existingAssets, ...data])

      });
    })

    //Clean up
    return () => abortFetch.abort();
  }, []);

  // Classes to export for assets that are grouped
  useEffect(() => {
    if (nestedAssets.length > 0) {
      const assets = [
        ...nestedAssets
          .reduce((map, obj) => map.set(obj.type, obj.type), new Map())
          .values(),
      ];
      assets.map((item) => {
        setClassesToExport((arr) => [...arr, _.lowerCase(item) + "Pdf_basic"]);
      });
    }
  }, [nestedAssets]);

  //Handle checkbox change
  const handleCheckboxChange = ({ target }) => {
    const { checked, exporting } = target;
    if (checked) {
      setClassesToExport([...classesToExportAsPdf, exporting]);
    } else {
      setClassesToExport(
        classesToExportAsPdf.filter((item) => item !== exporting)
      );
    }
  };

  //What checkboxes to show in Modal based on props
  function renderOptions(props) {
    switch (props.selectedAsset.type) {
      case "File":
        return (
          <div>
            {fileOptions.map((option, index) => (
              <div key={index}>
                <Checkbox
                  key={option.id}
                  exporting={option.value}
                  onChange={handleCheckboxChange}
                  disabled={!option.active}
                  defaultChecked={option.checked}
                >
                  {option.name}
                </Checkbox>
              </div>
            ))}
          </div>
        );

      case "Index":
        return (
          <div>
            {indexOptions.map((option, index) => (
              <div key={index}>
                <Checkbox
                  key={option.value}
                  exporting={option.value}
                  onChange={handleCheckboxChange}
                  disabled={!option.active}
                  defaultChecked={option.checked}
                >
                  {option.name}
                </Checkbox>
              </div>
            ))}
          </div>
        );

      case "Query":
        return (
          <div>
            {queryOptions.map((option, index) => (
              <div key={index}>
                <Checkbox
                  key={option.value}
                  exporting={option.value}
                  onChange={handleCheckboxChange}
                  disabled={!option.active}
                  defaultChecked={option.checked}
                >
                  {option.name}
                </Checkbox>
              </div>
            ))}
          </div>
        );

      case "Job":
        return (
          <div>
            {jobOptions.map((option, index) => (
              <div key={index}>
                <Checkbox
                  key={option.value}
                  exporting={option.value}
                  onChange={handleCheckboxChange}
                  disabled={!option.active}
                  defaultChecked={option.checked}
                >
                  {option.name}
                </Checkbox>
              </div>
            ))}
          </div>
        );

      case "Group":
        // removing duplicate file type
        const sortedNestedAssets = [
          ...nestedAssets
            .reduce((map, obj) => map.set(obj.type, obj.type), new Map())
            .values(),
        ];

        return (
          <CollapseWrapper>
            <Collapse defaultActiveKey={["0", "1", "2", "3"]}>
              {sortedNestedAssets.map((asset, index) => {
                switch (asset) {
                  case "File":
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
                                defaultChecked={option.checked}
                              >
                                {option.name}
                              </Checkbox>
                            </PanelItems>
                          );
                        })}
                      </Panel>
                    );

                  case "Query":
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
                                defaultChecked={option.checked}
                              >
                                {option.name}
                              </Checkbox>
                            </PanelItems>
                          );
                        })}
                      </Panel>
                    );

                  case "Index":
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
                                defaultChecked={option.checked}
                              >
                                {option.name}
                              </Checkbox>
                            </PanelItems>
                          );
                        })}
                      </Panel>
                    );

                  case "Job":
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
                                defaultChecked={option.checked}
                              >
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
  }

  //What  to print based asset selection
  const assetToPrint = (selectedAsset, props) => {
    switch (selectedAsset.type) {
      case "File":
        return (
          <div>
            <FileDetailsPdf
              selectedAssetType={props.selectedAsset.type}
              selectedAssetId={props.selectedAsset.id}
              applicationId={applicationId}
              classesToExport={classesToExportAsPdf}
              setVisiblity={props.setVisiblity}
              printingTaskCompleted={props.printingTaskCompleted}
            />
          </div>
        );

      case "Query":
        return (
          <div>
            <QueryDetailsPdf
              selectedAssetType={props.selectedAsset.type}
              selectedAssetId={props.selectedAsset.id}
              applicationId={applicationId}
              classesToExport={classesToExportAsPdf}
              setVisiblity={props.setVisiblity}
              printingTaskCompleted={props.printingTaskCompleted}
            />
          </div>
        );

      case "Index":
        return (
          <div>
            <IndexDetailsPdf
              selectedAssetType={props.selectedAsset.type}
              selectedAssetId={props.selectedAsset.id}
              applicationId={applicationId}
              classesToExport={classesToExportAsPdf}
              setVisiblity={props.setVisiblity}
              printingTaskCompleted={props.printingTaskCompleted}
            />
          </div>
        );

      case "Job":
        return (
          <div>
            <JobDetailsPdf
              selectedAssetType={props.selectedAsset.type}
              selectedAssetId={props.selectedAsset.id}
              applicationId={applicationId}
              classesToExport={classesToExportAsPdf}
              setVisiblity={props.setVisiblity}
              printingTaskCompleted={props.printingTaskCompleted}
            />
          </div>
        );

      case "Group":
        return (
          <GroupDetailsPdf
            selectedAssetType={props.selectedAsset.type}
            nestedAssets={nestedAssets}
            applicationId={applicationId}
            classesToExport={classesToExportAsPdf}
            setVisiblity={props.setVisiblity}
            printingTaskCompleted={props.printingTaskCompleted}
          ></GroupDetailsPdf>
        );
    }
  };

  //When download PDF button is clicked
  const downloadDoc = () => {
    if (classesToExportAsPdf.length == 0) {
      message.config({ top: 100 });
      message.error("Select one or more options");
    } else {
      setDownloadPdf(true);
    }
  };

  return (
    <Modal
      visible={props.visible}
      title="Select items to include in PDF"
      onOk={downloadDoc}
      onCancel={() => props.setVisiblity(false)}
      width={650}
      footer={
         [
              <Button
                key="back"
                onClick={() => props.setVisiblity(false)}
                type="primary"
                ghost
              >
                Cancel
              </Button>,
              <Button
                key="submit"
                onClick={downloadDoc}
                type="primary"
                loading={downloadPdf}
              >
                {downloadPdf ? "Downloading" : "Download PDF"}
              </Button>,
            ]
      }
    >
      { renderOptions(props)}
      <div style={{position:"absolute", left:"-999em"}}>
        {downloadPdf ? assetToPrint(props.selectedAsset, props) : null}
      </div>
    </Modal> 
  );
}

export default SelectDetailsForPdfDialog;
