import jsPDF from "jspdf";

// Download pdf file
export function downloadPdf(fileName, targetClass) {
  const doc = new jsPDF("p", "pt", "a4", true);

  const target = document.getElementsByClassName(targetClass);
 


  doc.html(target[0], {
    margin: [400, 60, 40, 60],
    callback: function (doc) {
      let pageCount = doc.internal.getNumberOfPages();
      // doc.deletePage(pageCount);
      doc.save(`${fileName}.pdf`);
    },
  });
}
