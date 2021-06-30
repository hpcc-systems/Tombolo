import React, { useState, useEffect } from "react";
import { PdfContainer, Heading, BasicTitle } from "./pdfStyledComponents";
import { authHeader, handleError } from "../../../common/AuthHeader";
import ReactMarkdown from "react-markdown";
import { downloadPdf } from "./downloadPdf";
import { message } from "antd";

function QueryDetailsPdf(props) {
  //Local state
  const [queryData, setQueryData] = useState();

  //Load query details when component loads and store in local state
  useEffect(() => {
    const abortFetch = new AbortController();
    fetch(
      "/api/query/query_details?query_id=" +
        props.selectedAssetId +
        "&app_id=" +
        props.applicationId,
      {
        headers: authHeader(),
      },
      { signal: abortFetch }
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((data) => {
        setQueryData(data);
      })
      .catch((error) => {
        console.log(error);
        message.error("Unable to fetch data to create pdf");
        props.printingTaskCompleted();
      });

    //Clean up
    return () => {
      abortFetch.abort();
    };
  }, []);

  //Print when fetching and set state is complete
  useEffect(() => {
    setTimeout(() => {
      if (queryData && props.assets?.length == 1) {
        downloadPdf(queryData.title, "pdfContainer");
        props.printingTaskCompleted();
      }
    }, 1000);
  }, [queryData]);

  return (
    <PdfContainer className="pdfContainer">
      <div className="queryPdf_basic">
        <Heading>Query - {queryData?.title}</Heading>
        <BasicTitle>Basic Details</BasicTitle>

        <div>
          <strong>Title :</strong> {queryData?.title}
        </div>
        <div>
          <strong>Name :</strong> {queryData?.name}
        </div>
        <div>
          <strong>URL :</strong>{" "}
          <a href={queryData?.url}>
            {" "}
            <span>&nbsp; </span>
            {queryData?.url}
          </a>
        </div>
        <div>
          <strong>Git Repo :</strong> <span>&nbsp;</span>
          <a href={queryData?.gitRepo}>{queryData?.gitRepo}</a>
        </div>
        <div className="read-only-markdown">
          <strong>Description :</strong>
          <ReactMarkdown
            className="reactMarkdown"
            source={queryData?.description}
          ></ReactMarkdown>
        </div>
      </div>
    </PdfContainer>
  );
}

export default QueryDetailsPdf;
