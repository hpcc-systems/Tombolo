import jsPDF from "jspdf";
import { authHeader, handleError } from "../../../common/AuthHeader";
import {message} from "antd/lib";


// Download pdf file
export function downloadPdf(fileName, targetClass) {
  const doc = new jsPDF("p", "pt", "a4", true);

  const target = document.getElementsByClassName(targetClass);
 
  doc.html(target[0],  {
    margin: [400, 60, 40, 60],
    callback: function (doc) {
      // let pageCount = doc.internal.getNumberOfPages();
      // doc.deletePage(pageCount);
      doc.save(`${fileName}.pdf`);
    },
  });
}


export const getNestedAssets = (applicationId, setSelectedAsset, setSelectDetailsforPdfDialogVisibility, record, setToPrintAssets) => {
  if(record.type === "Group"){
    let url = `/api/groups/nestedAssets?app_id=${applicationId}&group_id=${record.id}`;
    fetch(url,  {
      headers: authHeader(),
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
      handleError(response);
    }).then((data) => {
      let allGroups = data.every(item => item.type === "Group");
      if(allGroups || data.length < 1){ message.error("No assets found to Print in the selected group")}
      else{
       setSelectedAsset({ id: record.id, type: "Group" });      
      setToPrintAssets(data);
       setSelectDetailsforPdfDialogVisibility(true);
      }
    } ).catch((error) => {
      console.log(error)
    });
  }else{
    setSelectedAsset({ id: record.id, type: record.type });
    setToPrintAssets([{id: record.id, type: record.type}])

    setSelectDetailsforPdfDialogVisibility(true)
  }
}
