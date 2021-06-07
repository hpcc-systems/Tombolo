import { authHeader, handleError } from "./AuthHeader";

//Get file Details for creating pdf
export function getFileDetails(selectedAssetId, applicationId) {
  console.log("<<<< Making Api call ....");
  return fetch(
    "/api/file/read/file_details?file_id=" +
      selectedAssetId +
      "&app_id=" +
      applicationId,
    {
      headers: authHeader(),
    }
  ).then((response) => {
    response.json();
  });
}
