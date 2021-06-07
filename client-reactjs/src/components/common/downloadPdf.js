import jsPDF from "jspdf";

//Download pdf file
export function downloadPdf() {
  const doc = new jsPDF("p", "pt", "a4", true);
  const margins = {
    top: 40,
    bottom: 60,
    left: 40,
    width: 522,
  };

  const target = document.getElementsByClassName("exportAsPdf");

  doc.html(target[0], {
    margin: [400, 60, 40, 60],
    callback: function (doc) {
      doc.save("sample.pdf");
    },
  });
}
