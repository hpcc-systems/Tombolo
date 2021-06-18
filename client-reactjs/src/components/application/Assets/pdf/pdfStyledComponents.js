import styled from "styled-components";
//Styled components
export const PdfContainer = styled.div`
  min-height: 842px;
  width: 595px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 11.5px;
  position: relative;

  //All Asset Type 
  > .queryPdf_basic, .filePdf_basic, .indexPdf_basic {
     
      > .read-only-markdown *{
        text-align: left;
      }
      > .read-only-markdown {
        > h1,h2,h3,h4,h5,h6,h1{
          font-size: 12px;
          font-weight: 600;
        }

        > .reactMarkdown {
          padding-left: 5px;
        }
      }
    } 
  }

  //File Specific
  > .filePdf_layout {
    margin-top: -30px;
  }
  }
`;

//Basic Title - eg : Basic Details
export const BasicTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
`;

//Page Heading
export const Heading = styled.div`
  margin: 0px 0px 0px -10px;
  width: 105%;
  padding: 5px 0px 5px 15px;
  font-size: 18px;
  background: lightgray;
  font-weight: 700;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  > * {
    margin-right: 10px;
  }
`;

//Section title.Eg - basic info, layout info etc
export const SectionTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
`;

//Table
export const TableContainer = styled.div`
  margin-top: 30px;
  > h3 {
    font-size: 18px;
    font-weight: bold;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-style: solid
  border-width: thin;
  page-break-inside : auto
  th,
  td,
  tr {
    width: 100%;
  }
  th,
  td,
  tr {
    padding: 5px;
    border: 0.5px solid gray;
  }
  th {
    text-align: left;
  }
  td {
    width: 198px;
  }
`;

//Footer
export const Footer = styled.div`
  position: absolute;
  bottom: 20px;
  width: 200px;
  margin: 0px 15px 0px -15px;
  width: 90%;
  font-size: 12px;
  border-top: 1px solid lightgray;
  text-align: right;
  padding: 5px;
`;

//Styled Components For Pdf Dialog Box
export const CollapseWrapper = styled.div`
  > div .ant-collapse-header {
    font-weight: bold;
  }
`;
export const PanelItems = styled.div`
  text-align: left;
`;
