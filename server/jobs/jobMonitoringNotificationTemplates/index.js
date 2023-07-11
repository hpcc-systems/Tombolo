// E-mail Template -------------------------------------------------
function jobMonitoringEmailBody({
  notificationsToSend,
  timeStamp,
  jobName,
  monitoringName,
}) {
  let tableHTML =
    '<table style="border-collapse: collapse; width: 100%; max-width: 800px" className="sentNotificationTable"> ';

  // Extract name and cluster name
  const { clusterName } = notificationsToSend[0];

  // Add name and cluster name as h3 elements
  tableHTML +=
    '<tr><td colspan="2" style="border: 1px solid #D3D3D3; padding: 5px;">';
  tableHTML += "<div>Job name: " + jobName + "</div>";
  tableHTML += "<div>Monitoring name: " + monitoringName + "</div>";
  tableHTML += "<div>Cluster: " + clusterName + "</div>";
  tableHTML += "<div>Date/Time: " + timeStamp + "</div>";

  tableHTML += "</td></tr>";

  // Add table headers
  tableHTML += "<tr>";
  tableHTML +=
    '<th style="border: 1px solid #D3D3D3; text-align: left; padding-left: 5px;">WuID</th>';
  tableHTML +=
    '<th style="border: 1px solid #D3D3D3; text-align: left; padding-left: 5px;">Alert(s)</th>';
  tableHTML += "</tr>";

  // Iterate over each object in the data array
  notificationsToSend.forEach((obj) => {
    // Extract object properties
    const { wuId, issues } = obj;

    // Add table row for wuId
    tableHTML += "<tr>";
    tableHTML +=
      '<td style="border: 1px solid #D3D3D3; text-align: left; padding-left: 5px;">' +
      wuId +
      "</td>";

    // Add table row for each issue
    tableHTML +=
      '<td style="border: 1px solid #D3D3D3; text-align: left; padding-left: 5px;">';
    issues.forEach((issue) => {
      const [key, value] = Object.entries(issue)[0];
      tableHTML += key + ": " + value + "<br>";
    });
    tableHTML += "</td>";
    tableHTML += "</tr>";
  });

  tableHTML +=
    '</table> <p className="sentNotificationSignature">- Tombolo</p>';

  return tableHTML;
}
// Teams message template ------------------------------------------
const msTeamsCardBody = (tableHtml) => {
  const cardBody = JSON.stringify({
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: "0076D7",
    summary: "Hello world",
    sections: [
      {
        type: "MessageCard",
        contentType: "text/html",
        text: tableHtml,
      },
    ],
    potentialAction: [
      {
        "@type": "ActionCard",
        name: "Add a comment",
        inputs: [
          {
            "@type": "TextInput",
            id: "comment",
            isMultiline: false,
            title: "Add a comment here for this task",
          },
        ],
        actions: [
          {
            "@type": "HttpPOST",
            name: "Add comment",
            target: process.env.API_URL + "/api/updateNotification/update",
            body: `{"comment":"{{comment.value}}"}`,
            isRequired: true,
            errorMessage: "Comment cannot be blank",
          },
        ],
      },
      {
        "@type": "ActionCard",
        name: "Change status",
        inputs: [
          {
            "@type": "MultichoiceInput",
            id: "list",
            title: "Select a status",
            isMultiSelect: "false",
            choices: [
              {
                display: "Triage",
                value: "triage",
              },
              {
                display: "In Progress",
                value: "inProgress",
              },
              {
                display: "Completed",
                value: "completed",
              },
            ],
          },
        ],
        actions: [
          {
            "@type": "HttpPOST",
            name: "Save",
            target: process.env.API_URL + "/api/updateNotification/update",
            body: `{"status":"{{list.value}}"`,
            isRequired: true,
            errorMessage: "Select an option",
          },
        ],
      },
    ],
  });
  return cardBody;
};
// ------------------------------------------------------------------

module.exports = {
  jobMonitoringEmailBody,
  msTeamsCardBody,
};