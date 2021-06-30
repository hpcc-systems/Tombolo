import React, { useState, useEffect } from "react";
import { PdfContainer, SectionTitle, Heading } from "./pdfStyledComponents";
import { authHeader, handleError } from "../../../common/AuthHeader";
import { downloadPdf } from "./downloadPdf";
import ReactMarkdown from "react-markdown";
import { message } from "antd";

function IndexDetailsPdf(props) {
  //Local State & variables
  const { selectedAssetId, applicationId, printingTaskCompleted } = props;
  const [indexData, setIndexData] = useState();

  //Fetch Index details and store in local state when componnet loads
  useEffect(() => {
    const abortFetch = new AbortController();
    fetch(
      "/api/index/read/index_details?index_id=" +
        selectedAssetId +
        "&app_id=" +
        applicationId,
      {
        headers: authHeader(),
      },
      {
        signal: abortFetch,
      }
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((data) => {
        setIndexData(data);
      })
      .catch((error) => {
        console.log(error);
        message.error("Unable to fetch data to create pdf");
        printingTaskCompleted();
      });

    //Clean up
    return () => {
      abortFetch.abort();
    };
  }, []);

  //Once data is set in state
  useEffect(() => {
    if (indexData && props.assets?.length == 1) {
      downloadPdf(indexData.basic.title, "pdfContainer");
      printingTaskCompleted();
    }
  }, [indexData]);

  return (
    <PdfContainer className="pdfContainer">
      <div className="indexPdf_basic">
        <Heading>Index - {indexData?.basic.title}</Heading>
        <SectionTitle>Basic Details</SectionTitle>
        <div>
          <strong>Title :</strong> {indexData?.basic.title}
        </div>
        <div>
          <strong> Name :</strong> {indexData?.basic.name}
        </div>
        <div>
          <strong> Primary Service :</strong> {indexData?.basic.primaryService}
        </div>
        <div>
          <strong> Backup Service :</strong> {indexData?.basic.backupService}
        </div>
        <div>
          <strong> Path :</strong> {indexData?.basic.qualifiedPath}
        </div>
        <div className="read-only-markdown">
          <strong>Description :</strong>
          <ReactMarkdown
            className="reactMarkdown"
            source={indexData?.basic.description}
          ></ReactMarkdown>
        </div>
      </div>
    </PdfContainer>
  );
}

export default IndexDetailsPdf;
