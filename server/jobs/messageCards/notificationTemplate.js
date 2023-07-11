const _ = require("lodash");

module.exports = {
  //E-mail body
  emailBody: function (notificationDetails, metaDifference) {
    const { details, text } = notificationDetails;

    let tableRows = "";

    if (metaDifference && metaDifference.length > 0) {
      metaDifference.forEach((meta) => {
        tableRows += `<tr>
            <td>${meta.attribute}</td>
            <td>${meta.oldValue}</td>
            <td> ${meta.newValue}</td>
          </tr>`;
      });
    }

    const table = `<div style="margin-top: 10px"> <table border="1" cellpadding="2" cellspacing="0" width="100%" style="border-collapse:collapse" >
              <tr><td> Attribute </td><td> Old Value </td><td> New Value</td></tr>
                ${tableRows}
              </table></div>`;

    let body = "";

    for (let keys in details) {
      body += `<div>${keys}: ${details[keys]}</div>`;
    }

    if (tableRows !== "") {
      body = body + table;
    }

    body = `<div><div>${text}</div>${body}<p>-Tombolo </p></div>`;
    return body;
  },

  //Cluster monitoring email body
  clusterMonitoringEmailBody: function (facts) {
    let body = "<div>";
    facts.forEach((fact) => {
      for (let key in fact) {
        body += `<div>${_.capitalize(key)} : ${fact[key]}`;
      }
      body += `</br></br>`;
    });
    body += `<p>-Tombolo </p> </div>`;
    return body;
  },

  //Cluster monitoring teams card
  // TODO  make this message card general by changing the key name
  clusterMonitoringMessageCard: function (title, facts, notification_id) {
    let allFacts = [];
    cardData = `"notification_id": "${notification_id}"`;
    facts.forEach((fact) => {
      for (let key in fact) {
        allFacts.push({ name: key, value: fact[key] });
      }
      allFacts = [...allFacts];
    });
    const body = JSON.stringify({
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: title,
      themeColor: "0072C6",
      title: title,
      sections: [
        {
          facts: allFacts,
        },
        {
          type: "MessageCard",
          contentType: "text/html",
          text: " ",
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
              body: `{"comment":"{{comment.value}}", ${cardData}}`,
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
              body: `{"status":"{{list.value}}", ${cardData}}`,
              isRequired: true,
              errorMessage: "Select an option",
            },
          ],
        },
      ],
    });

    return body;
  },


  //Message card for landing zone
  messageCardBody: function ({
    notificationDetails,
    notification_id,
    filemonitoring_id,
    fileName,
    metaDifference,
  }) {
    const { details, title } = notificationDetails;

    // -----------------------------------------------------------------------------
    let tableRows = "";

    if (metaDifference && metaDifference.length > 0) {
      metaDifference.forEach((meta) => {
        tableRows += `<tr>
            <td style="padding-left: 5px">${meta.attribute}</td>
            <td style="padding-left: 5px">${meta.oldValue}</td>
            <td style="padding-left: 5px"> ${meta.newValue}</td>
          </tr>`;
      });
    }

    const table = `<div style="margin-top: 10px"> <table border="1" cellpadding="4" cellspacing="0" width="100%" style="border-collapse:collapse" >
              <tr><td style="padding-left: 5px"> Attribute </td><td style="padding-left: 5px"> Old Value </td><td style="padding-left: 5px"> New Value</td></tr>
                ${tableRows}
              </table></div>`;
    // -----------------------------------------------------------------------------

    let cardData = "";
    if (filemonitoring_id && fileName) {
      cardData = `"notification_id": "${notification_id}","filemonitoring_id": "${filemonitoring_id}","fileName": "${fileName}"`;
    } else {
      cardData = `"notification_id": "${notification_id}"`;
    }

    const facts = [];
    for (let key in details) {
      facts.push({
        name: key,
        value: details[key],
      });
    }

    const body = JSON.stringify({
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: title,
      themeColor: "0072C6",
      title: title,
      sections: [
        {
          facts: facts,
        },
        {
          type: "MessageCard",
          contentType: "text/html",
          text: tableRows ? table : "",
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
              body: `{"comment":"{{comment.value}}", ${cardData}}`,
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
              body: `{"status":"{{list.value}}", ${cardData}}`,
              isRequired: true,
              errorMessage: "Select an option",
            },
          ],
        },
      ],
    });

    return body;
  },
};
