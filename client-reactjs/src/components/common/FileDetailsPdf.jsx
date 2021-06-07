import React, { useState, useEffect } from "react";
// import { getFileDetails } from "./assetDetailsForPdf";
import styled, { createGlobalStyle } from "styled-components";
import { authHeader, handleError } from "./AuthHeader";
import ReactMarkdown from "react-markdown";
import { downloadPdf } from "./downloadPdf";

function FileDetailsPdf(props) {
  //Local States
  const [basicData, setBasicData] = useState({});
  const [fileLayouts, setFileLayouts] = useState([]);

  useEffect(() => {
    //Make call to get data when component loads
    fetch(
      "/api/file/read/file_details?file_id=" +
        props.selectedAssetId +
        "&app_id=" +
        props.applicationId,
      {
        headers: authHeader(),
      }
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((data) => {
        console.log("<<<< Final Data ", data);
        setBasicData(data.basic);
        setFileLayouts(data.file_layouts);
        downloadPdf();
        props.printingTaskCompleted();
      });
  }, []);

  return (
    <FileDetailsPdfContainer className="exportAsPdf">
      <h3> Basic Deails</h3>
      <p>
        <label>Title : </label> {basicData.title}
      </p>
      <p>Name : {basicData.name}</p>
      <p>Scope : {basicData.scope}</p>
      <div className="read-only-markdown">
        Description :{" "}
        <ReactMarkdown source={basicData.description}>
          {/* Description : {basicData.description} */}
        </ReactMarkdown>
      </div>

      <p>
        service URL : <a href={basicData.serviceURL}>{basicData.serviceURL}</a>
      </p>
      <p>
        Path : <a href={basicData.qualifiedPath}>{basicData.qualifiedPath}</a>
      </p>
      <p>Is Super File : {basicData.isSuperFile ? "Yes" : "No"}</p>
      <p>Supplier : {basicData.Supplier}</p>
      <p>Consumer : {basicData.consumer}</p>
      <p>Owner : {basicData.owner}</p>

      <TableContainer>
        <h3>Layout</h3>
        <Table>
          <tbody>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </tbody>

          {fileLayouts.map((value, index) => {
            return (
              // <tbody key={index}>
              <tr key={index}>
                <td>{value.name}</td>
                <td>{value.type}</td>
                <td>{value.description}</td>
              </tr>
              // </tbody>
            );
          })}
          {fileLayouts.map((value, index) => {
            return (
              // <tbody key={index}>
              <tr key={index}>
                <td>{value.name}</td>
                <td>{value.type}</td>
                <td>{value.description}</td>
              </tr>
              // </tbody>
            );
          })}
        </Table>
      </TableContainer>
    </FileDetailsPdfContainer>
  );
}

export default FileDetailsPdf;

//Styled components
const FileDetailsPdfContainer = styled.div`
  height: 842px;
  width: 595px;
  margin-right: 10px;
  margin-top: 50px;
  padding: 50px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 12px;

  > h3 {
    font-size: 18px;
    font-weight: bold;
  }

  > p {
    > label : {
      font-weight: bold;
    }
  }
`;

const TableContainer = styled.div`
  margin-top: 30px;

  > h3 {
    font-size: 18px;
    font-weight: bold;
  }
`;

const Table = styled.table`
  width: 100%;
  border-style: solid
  border-width: thin;
  page-break-inside : auto

  th,
  td,
  tr {
    // border-style: solid;
    // border-width: thin;
    // border-collapse: collapse;
    width: 100%;
  }
  th,
  td,
  tr {
    padding: 5px;
    border: 1px solid gray;
    
  }
  th {
    text-align: left;
    
  }
  td {
    width: 198px;
  }
`;
