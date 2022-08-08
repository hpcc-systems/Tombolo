import React, { useEffect, useState } from 'react';
import { Table } from 'antd';
import { authHeader, handleError } from '../../common/AuthHeader.js';

//Table columns
const columns = [
  {
    title: 'Name',
    dataIndex: 'fileName',
  },
  {
    title: 'Type',
    dataIndex: 'fileType',
  },
];

function Files({ hpcc_queryid, cluster_id }) {
  //Local State
  const [queryFiles, setQueryFiles] = useState([]);
  const [fetchingData, setFetchingData] = useState(false);

  //Use Effect
  useEffect(() => {
    if (hpcc_queryid) {
      getQueryFiles();
    }
  }, [hpcc_queryid, cluster_id]);

  //Get query files function
  const getQueryFiles = async () => {
    try {
      setFetchingData(true);
      const response = await fetch(
        `/api/hpcc/read/getQueryFiles?hpcc_queryId=${hpcc_queryid}&clusterId=${cluster_id}`,
        { headers: authHeader() }
      );
      const data = await response.json();

      let { logicalFiles } = data;
      logicalFiles = [...logicalFiles];
      let subFiles = []; //Files that are part of super file [[array][array]]
      let superFiles = [];

      if (data?.superFiles) {
        data.superFiles.forEach((superFile) => {
          subFiles.push(superFile.SubFiles.File);
          superFiles.push({ title: superFile.Name, children: superFile.SubFiles.File });
        });
      }

      //Flattening sub-files array so it is easier to filter
      subFiles = subFiles.flat();

      //If logical files are part of super file remove them - those file will be nested under super files
      logicalFiles = logicalFiles.filter((logicalFile) => !subFiles.includes(logicalFile));

      //Converting data the way ant-d table likes
      logicalFiles = logicalFiles.map((logicalFile) => ({
        key: logicalFile,
        fileName: logicalFile,
        fileType: 'Logical File',
      }));
      superFiles = superFiles.map((superFile) => ({
        key: superFile.title,
        fileName: superFile.title,
        fileType: 'Super File',
        children: superFile.children.map((child) => ({ key: child, fileName: child, fileType: 'Logical File' })),
      }));

      setQueryFiles([...superFiles, ...logicalFiles]);
      setFetchingData(false);
    } catch (err) {
      setFetchingData(false);
      handleError(err);
    }
  };

  //JSX
  return (
    <>
      <Table columns={columns} dataSource={queryFiles} size={'small'} loading={fetchingData} />
    </>
  );
}

export default Files;
