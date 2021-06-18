import React, { useEffect } from "react";
import FileDetailsPdf from "./FileDetailsPdf";
import IndexDetailsPdf from "./IndexDetailsPdf";
import QueryDetailsPdf from "./QueryDetailsPdf";
import { downloadPdf } from "./downloadPdf";

function GroupDetailsPdf(props) {
  //Local state and variables
  const { nestedAssets: assets, applicationId } = props;

  useEffect(() => {
    console.log("Class to print in group level >>>>", props.classesToExport);
    //Remove unchecked elements from DOM
    const removeElements = (elms) => elms.forEach((el) => el.remove());
    let elements = document.querySelectorAll(".pdfContainer");
    let elementArray = Array.from(elements);
    let childNodes = [];
    let childNodesArray = [];
    elementArray.map((item) => childNodes.push(item.childNodes));
    childNodes.map((item) => childNodesArray.push(Array.from(item)));
    let flattenNodesArray = childNodesArray.flat();
    let childElements = flattenNodesArray.map((item) => item.className);
    const exportClasses = props.classesToExport;

    let sortedElements = childElements.filter(
      (item) => !exportClasses.includes(item)
    );

    console.log("<<<< Sorted Elements", sortedElements);
    sortedElements.map((item) => {
      console.log("<<<< item", item);
      removeElements(document.querySelectorAll(`.${item}`));
    });
  }, []);

  useEffect(() => {
    setTimeout(() => {
      downloadPdf("assetDetails", "pdfContainerWraper");
      props.printingTaskCompleted();
    }, 2000);
  }, []);

  return (
    <div className="pdfContainerWraper">
      {assets.map((asset, index) => {
        switch (asset.type) {
          case "File":
            return (
              <>
                <FileDetailsPdf
                  key={index}
                  selectedAssetType={props.selectedAssetType}
                  selectedAssetId={asset.id}
                  applicationId={applicationId}
                  classesToExport={props.classesToExport}
                  setVisiblity={props.setVisiblity}
                  printingTaskCompleted={props.printingTaskCompleted}
                ></FileDetailsPdf>
                <hr />
              </>
            );

          case "Index":
            return (
              <IndexDetailsPdf
                selectedAssetType={props.selectedAssetType}
                key={index}
                selectedAssetId={asset.id}
                applicationId={applicationId}
                classesToExport={props.classesToExport}
                setVisiblity={props.setVisiblity}
                printingTaskCompleted={props.printingTaskCompleted}
              ></IndexDetailsPdf>
            );

          case "Query":
            return (
              <QueryDetailsPdf
                selectedAssetType={props.selectedAssetType}
                key={index}
                selectedAssetId={asset.id}
                applicationId={applicationId}
                classesToExport={props.classesToExport}
                setVisiblity={props.setVisiblity}
                printingTaskCompleted={props.printingTaskCompleted}
              ></QueryDetailsPdf>
            );

          // case "Job":
        }
      })}
    </div>
  );
}

export default GroupDetailsPdf;
