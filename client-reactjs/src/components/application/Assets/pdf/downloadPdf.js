import jsPDF from "jspdf";
import { authHeader, handleError } from "../../../common/AuthHeader";
import {message} from "antd/lib";


// Download pdf file
export function downloadPdf(fileName, targetClass) {
  const doc = new jsPDF("p", "pt", "a4", true);

  const target = document.getElementsByClassName(targetClass);
 
  doc.html(target[0], {
    margin: [400, 60, 40, 60],
    callback: function (doc) {
      // let pageCount = doc.internal.getNumberOfPages();
      // doc.deletePage(pageCount);
      doc.save(`${fileName}.pdf`);
    },
  });
}


//Get Nested Assets from Group
export const fetchNestedAssets = (record, applicationId) => {
  let url = `/api/groups/assets?app_id=${applicationId}&group_id=${record.id}`;
  return fetch(url, {
    headers: authHeader(),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      handleError(response);
    })
};


  //Handle Generate PDF
  export function handleGeneratePdf(selectedGroup, applicationId, setSelectDetailsforPdfDialogVisibility,setSelectedAsset  ){  
    fetchNestedAssets(selectedGroup,applicationId).then(data => {
      const allNestedAssetsAreGroups = data.every( cv => cv.type === "Group");
        if(data.length < 1){
          setSelectDetailsforPdfDialogVisibility(false);  
          message.error("Empty Group");
        }else if(allNestedAssetsAreGroups){
          let nestedItems = []
          let dataLength = data.length;
          let run = 0;
        data.map(item => {
          fetchNestedAssets(item, applicationId)
          .then(data => {
                nestedItems.push(data); 
                run +=1; 
                if(dataLength == run && nestedItems.every(item => item.length < 1)){
                  return message.error("Empty Group")
                }else if(nestedItems[run -1].length > 0){
                  setSelectedAsset({ id: selectedGroup.id, type: "Group" });
                  setSelectDetailsforPdfDialogVisibility(true);
                }
              })
        })
      }else{
        setSelectedAsset({ id: selectedGroup.id, type: "Group" });
        setSelectDetailsforPdfDialogVisibility(true);
      }
    } 
    )
}