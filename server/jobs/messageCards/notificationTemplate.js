module.exports = {
  //E-mail body
  emailBody: function (notificationDetails) {
    const { details, text } = notificationDetails;

    let body = "";

    for (let keys in details) {
      body += `<div>${keys}: ${details[keys]}</div>`;
    }

    body = `<div><p>${text}</p>${body}</div>`;
    return body;
  },

  //Message card
  messageCardBody: function ({
    notificationDetails,
    notification_id,
    filemonitoring_id,
    fileName,
  }) {

    const { details, title } = notificationDetails;

    let cardData = '';
    if(filemonitoring_id && fileName){
      cardData = `"notification_id": "${notification_id}","filemonitoring_id": "${filemonitoring_id}","fileName": "${fileName}"`
    }else{
      cardData = `"notification_id": "${notification_id}"`
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
              target: process.env.WEB_URL + "/api/updateNotification/update",
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
                  display: "In Progress",
                  value: "In Progress",
                },
                {
                  display: "Closed",
                  value: "Closed",
                },
              ],
            },
          ],
          actions: [
            {
              "@type": "HttpPOST",
              name: "Save",
              target: process.env.WEB_URL + "/api/updateNotification/update",
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
