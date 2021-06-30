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
  const [ input, setInput] = useState();
  const [output, setOutput] = useState();

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
        setData(data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  //once the job data is pulled and set in local state
  useEffect(() => {
    //Saperate input and output files 
    if(data){
      setInput(data.jobfiles.filter(item => item.file_type === "input"));
      setOutput(data.jobfiles.filter(item => item.file_type === "output"));
    }
  
    setTimeout(() => {
      if(data){
    //Break lines for ecl code
    const ele = document.getElementById("ecl_render");
    if(ele){
      ele.innerHTML = ele.innerHTML.replace(/;/g, ";<br/>");
    }
      }
     
      if (data && props.assets?.length == 1) {
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


  
  //Table Headers
  const th = ["Name", "Description"]

  return (
    <PdfContainer className="pdfContainer" id="pdfContainer">
      <div className="jobPdf_basic">
        <Heading> Job - {data?.title}</Heading>
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
      <div className="jobPdf_ecl" style={{width: "550px" }}>
        <BasicTitle>ECL</BasicTitle>
       <code className ="ecl_render" id="ecl_render" style={{color: "black"}}>
       {data?.ecl}
       </code>
       

       {/* </code> */}
      </div>

      <div className="jobPdf_inputFiles">
        <BasicTitle>Input Files</BasicTitle>
        {input?.length > 0 ? 
        <TableContainer>
          <Table>
            <tbody>
              <tr>
                {th.map((head, index) => (
                  <th key={index}> {head}</th>
                ))}
              </tr>
            </tbody>
            <tbody>
              {input?.map((value, index) => {
                return (
                  <tr key={index}>
                    <td>{value.name}</td>
                    <td>{value.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableContainer> : <div style={{color: "gray"}}> No input Files </div>}
      </div>
      <div className="jobPdf_outputFiles">
        <BasicTitle>Output Files</BasicTitle>
        {output?.length > 0 ?
        <TableContainer>
          <Table>
            <tbody>
              <tr>
                {th.map((head, index) => (
                  <th key={index}> {head}</th>
                ))}
              </tr>
            </tbody>
            <tbody>
              {output?.map((value, index) => {
                return (
                  <tr key={index}>
                    <td>{value.name}</td>
                    <td>{value.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableContainer> :  <div style={{color: "gray"}}> No output Files </div>}
      </div>
    </PdfContainer>
  );
}

export default JobDetailsPdf;
