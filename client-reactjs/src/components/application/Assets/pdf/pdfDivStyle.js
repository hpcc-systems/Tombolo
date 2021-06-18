export const addPageMargin = () => {
  console.log("<<<< Adding Margin ..");
  let area = document.getElementsByClassName("pdfContainer")[0];
  let height = area.offsetHeight;
  console.log("div <<<<", area);
  //   Get the needed amout of spans needed
  let count = Math.floor(height / 10);
  console.log("<<<< Count", count);
  // Adding a span for each 50px
  //   for (let i = 0; i < count; i++) {
  //     let span = document.createElement("span");
  //     span.className = "spans";
  //     span.innerText = "Span WOHOO :D";

  //     area.appendChild(span);
  //     console.log(span, "<<<< Span ");
  //   }
};
