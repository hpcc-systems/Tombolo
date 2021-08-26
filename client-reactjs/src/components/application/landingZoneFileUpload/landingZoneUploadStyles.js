import styled from "styled-components";

export const LandingZoneUploadContainer = styled.div`
  place-items: center;
  width: 600px;
  > * {
    display: block;
    margin-top: 5px;
   }
`

//Tabel columns
export const columns = [
    {
      title: '#',
      dataIndex: 'sno',
    },
    {
      title: 'File Name',
      dataIndex: 'fileName',
    },
    {
      title: 'Size',
      dataIndex: 'fileSize',
    },
    {
      title: '',
      dataIndex: 'uploading',
    },
  ];