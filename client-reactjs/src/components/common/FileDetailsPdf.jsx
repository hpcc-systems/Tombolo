import React, { useState, useEffect } from "react";
// import { getFileDetails } from "./assetDetailsForPdf";
// import styled, { createGlobalStyle } from "styled-components";
import { authHeader, handleError } from "./AuthHeader";
import ReactMarkdown from "react-markdown";

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
      });
  }, []);

  return (
    // <FileDetailsPdfContainer className="exportAsPdf"></FileDetailsPdfContainer>
    <div
      className="exportAsPdf"
      style={{
        height: "842px",
        width: "595px",
        marginRight: "10px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        placeItems: "flex-start",
      }}
    >
      <p>Title : {basicData.title}</p>
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

      <div>
        <table
          style={{
            width: "100%",
            border: "1px solid black",
            borderCollapse: "collapse",
          }}
        >
          {/* <tbody> */}
          <tr
            style={{
              border: "1px solid black",
              borderCollapse: "collapse",
              padding: "5px",
            }}
          >
            <th
              style={{
                border: "1px solid black",
                borderCollapse: "collapse",
                padding: "5px",
              }}
            >
              Field
            </th>
            <th
              style={{
                border: "1px solid black",
                borderCollapse: "collapse",
                padding: "5px",
              }}
            >
              Type
            </th>
            <th
              style={{
                border: "1px solid black",
                borderCollapse: "collapse",
                padding: "5px",
                textAlign: "left",
              }}
            >
              Description
            </th>
          </tr>
          {/* </tbody> */}

          {fileLayouts.map((value, index) => {
            return (
              // <tbody key={index}>
              <tr key={index}>
                <td
                  style={{
                    border: "1px solid black",
                    borderCollapse: "collapse",
                    padding: "5px",
                    width: "198px",
                  }}
                >
                  {value.name}
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    borderCollapse: "collapse",
                    padding: "5px",
                    width: "198px",
                  }}
                >
                  {value.type}
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    borderCollapse: "collapse",
                    padding: "5px",
                    width: "198px",
                  }}
                >
                  {value.description}
                </td>
              </tr>
              // </tbody>
            );
          })}
        </table>
      </div>
    </div>
  );
}

export default FileDetailsPdf;

//Styled components
// const FileDetailsPdfContainer = styled.div`
//   height: 842px;
//   width: 595px;
//   margin-right: 10px;
//   padding: 10px;
// `;
