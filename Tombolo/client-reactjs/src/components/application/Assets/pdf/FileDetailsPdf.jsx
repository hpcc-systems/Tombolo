import React, { useState, useEffect } from 'react';
import { authHeader, handleError } from '../../../common/AuthHeader';
import ReactMarkdown from 'react-markdown';
import { downloadPdf } from './downloadPdf';
import { useSelector } from 'react-redux';
import { message } from 'antd';
import { PdfContainer, Heading, SectionTitle, TableContainer, Table } from './pdfStyledComponents';

function FileDetailsPdf(props) {
  //Local States
  const [basicData, setBasicData] = useState({});
  const [fileLayouts, setFileLayouts] = useState([]);
  const consumers = useSelector((state) => state.applicationReducer.consumers);
  const th = ['Field', 'Type', 'Description'];

  //Get consumer name
  const getConsumerName = (consumers, consumerType, consumerId) => {
    let name = '';
    consumers.map((consumer) => {
      if (consumer.assetType === consumerType && consumer.id === consumerId) {
        name = consumer.name;
      }
    });
    return name;
  };

  //Remove elements from DOM
  const removeElements = (elms) => elms.forEach((el) => el.remove());

  //Remove all elements except the ones selected
  useEffect(() => {
    if (props.selectedAssetType !== 'Group') {
      let elements = document.querySelector('.pdfContainer');
      let childElements = Array.from(elements.childNodes).map((item) => item.className);
      const exportClasses = props.classesToExport;

      childElements = childElements.filter((item) => !exportClasses.includes(item));

      childElements.map((item) => {
        removeElements(document.querySelectorAll(`.${item}`));
      });
    }
  }, []);

  //Make call to get data when component loads
  useEffect(() => {
    fetch('/api/file/read/file_details?file_id=' + props.selectedAssetId + '&app_id=' + props.applicationId, {
      headers: authHeader(),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((data) => {
        setBasicData(data.basic);
        return data;
      })
      .then((data) => {
        setFileLayouts(data.file_layouts);
        if (props.assets?.length == 1) {
          setTimeout(() => {
            downloadPdf(data.basic.title, 'pdfContainer');
            props.printingTaskCompleted();
          }, 1000);
        }
      })
      .catch((error) => {
        console.log('error', error);
        message.error('Unable to fetch data to create pdf');
        props.printingTaskCompleted();
      });
  }, []);

  return (
    <PdfContainer className="pdfContainer">
      <div className="filePdf_basic">
        <Heading> File - {basicData?.title}</Heading>
        <SectionTitle>Basic Details</SectionTitle>

        <div>
          <strong>Title : </strong> {basicData.title}
        </div>
        <div>
          <strong>Name : </strong> {basicData.name}
        </div>
        <div>
          <strong>Scope : </strong> {basicData.scope}
        </div>
        <div>
          <strong>service URL : </strong>
          <a href={basicData.serviceURL}>{basicData.serviceURL}</a>
        </div>
        <div>
          <strong>Path : </strong>
          <a href={basicData.qualifiedPath}>{basicData.qualifiedPath}</a>
        </div>
        <div>
          <strong>Is Super File : </strong>
          {basicData.isSuperFile ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Supplier : </strong>
          {getConsumerName(consumers, 'Supplier', basicData.supplier)}
        </div>
        <div>
          <strong>Consumer : </strong>
          {getConsumerName(consumers, 'Consumer', basicData.consumer)}
        </div>
        <div>
          <strong> Owner : </strong>
          {getConsumerName(consumers, 'Owner', basicData.owner)}
        </div>
        <div className="read-only-markdown">
          <strong>Description : </strong>
          <ReactMarkdown className="reactMarkdown" source={basicData.description}></ReactMarkdown>
        </div>
      </div>

      <div className="filePdf_layout">
        <SectionTitle style={{ marginTop: '50px' }}>Layout</SectionTitle>
        {fileLayouts.length > 0 ? (
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
                {fileLayouts.map((value, index) => {
                  return (
                    <tr key={index}>
                      <td>{value.name}</td>
                      <td>{value.type}</td>
                      <td>{value.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableContainer>
        ) : (
          <div style={{ color: 'gray' }}> No Layout data </div>
        )}
      </div>
    </PdfContainer>
  );
}

export default FileDetailsPdf;
