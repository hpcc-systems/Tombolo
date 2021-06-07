import jsPDF from "jspdf";

//Download pdf file
export function downloadPdf() {
  const doc = new jsPDF("p", "pt", "a4", true);

  const target = document.getElementsByClassName("exportAsPdf");
  doc.html(target[0], {
    callback: function (doc) {
      doc.save("sample.pdf");
    },
  });
}
