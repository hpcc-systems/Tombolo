import React from "react";
import { PdfContainer, Heading, BasicTitle } from "./pdfStyledComponents";

function JobDetailsPdf() {
  return (
    <PdfContainer className="pdfContainer">
      <div className="jobPdf_basic">
        <div><strong>Job Type :</strong></div>
        <div><strong>Name : </strong></div>
        <div><strong>Title : </strong></div>
        <div><strong>Git Repo : </strong></div>
        <div><strong>Entry BWR : </strong></div>
        <div><strong>Contact E-mail : </strong></div>
        <div><strong>Author</strong></div>
        <div className="read-only-markdown"><strong>Description :</strong>
          <ReactMarkdown className="reactMarkdown" source={}></ReactMarkdown></div>
        </div>
    </PdfContainer>
  );
}

export default JobDetailsPdf;
