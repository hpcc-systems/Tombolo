import jsPDF from "jspdf";
import { authHeader, handleError } from "../../../common/AuthHeader";


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

