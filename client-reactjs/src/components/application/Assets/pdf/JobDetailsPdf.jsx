import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  PdfContainer,
  Heading,
  BasicTitle,
  TableContainer,
  Table,
} from "./pdfStyledComponents";
import { authHeader, handleError } from "../../../common/AuthHeader";
import { downloadPdf } from "./downloadPdf";

function JobDetailsPdf(props) {
  //Local States & vars
  const [data, setData] = useState();
  const { selectedAssetId, applicationId } = props;

  //Input params table
  const th = ["Name", "Type"];

  //Make api call and get job detail and set in local state
  useEffect(() => {
    let url = `/api/job/job_details?job_id=${selectedAssetId}&app_id=${applicationId}`;

    fetch(url, {
      headers: authHeader(),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((data) => {
        console.log(data, "<<<< Returned data");
        setData(data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  //once the job data is pulled and set in local state
  useEffect(() => {
    console.log("Props >>>>", props);
    setTimeout(() => {
      if (data && props.selectedAssetType !== "Group") {
        downloadPdf(data.title, "pdfContainer");
        props.printingTaskCompleted();
      }
    }, 1000);
  }, [data]);

  //Remove elements from DOM
  const removeElements = (elms) => elms.forEach((el) => el.remove());

  //Remove all elements except the ones selected
  useEffect(() => {
    if (props.selectedAssetType !== "Group") {
      let elements = document.querySelector(".pdfContainer");
      let childElements = Array.from(elements.childNodes).map(
        (item) => item.className
      );
      const exportClasses = props.classesToExport;

      childElements = childElements.filter(
        (item) => !exportClasses.includes(item)
      );

      childElements.map((item) => {
        removeElements(document.querySelectorAll(`.${item}`));
      });
    }
  }, []);

  return (
    <PdfContainer className="pdfContainer">
      <div className="jobPdf_basic">
        <Heading>{data?.title}</Heading>
        <BasicTitle>Baic Data</BasicTitle>
        <div>
          <strong>Job Type :</strong> {data?.jobType}
        </div>
        <div>
          <strong>Name : </strong> {data?.name}
        </div>
        <div>
          <strong>Title : </strong>
          {data?.title}
        </div>
        <div>
          <strong>Git Repo : </strong>
          {data?.gitRepo}
        </div>
        <div>
          <strong>Entry BWR : </strong>
          {data?.entryBWR}
        </div>
        <div>
          <strong>Contact E-mail : </strong>
          {data?.contact}
        </div>
        <div>
          <strong>Author</strong>
          {data?.author}
        </div>
        <div className="read-only-markdown">
          <strong>Description :</strong>
          <ReactMarkdown source={data?.description}></ReactMarkdown>
        </div>
      </div>

      <div className="jobPdf_inputParams">
        <BasicTitle>Input Params</BasicTitle>
        <TableContainer style={{ marginTop: "10px" }}>
          <Table>
            <tbody>
              <tr>
                {th.map((head, index) => (
                  <th key={index}> {head}</th>
                ))}
              </tr>
            </tbody>
            <tbody>
              {data?.jobparams.map((value, index) => {
                return (
                  <tr key={index}>
                    <td>{value.name}</td>
                    <td>{value.type}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableContainer>
      </div>
      <div className="jobPdf_inputFiles">
        <BasicTitle>Input Files</BasicTitle>
      </div>
      <div className="jobPdf_outputFiles">
        <BasicTitle>Output Files</BasicTitle>
      </div>
    </PdfContainer>
  );
}

export default JobDetailsPdf;
