exports.createMessageCard = ({
 facts,
message,
notification_id,
filemonitoring_id
}) => {
  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: "0076D7",
    summary: "Hello world", // : `${fileName} stuck at  landingzone ${currentlyMonitoringDir}`,
    sections: facts.map((fact) => {
      return {
        activityTitle: fact.activity.toUpperCase(),
        facts: fact.facts,
      };
    }),

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
            body: `{"comment":"{{comment.value}}", "notification_id": "${notification_id}","filemonitoring_id": "${filemonitoring_id}"}`,
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
                display: "Investigating",
                value: "Investigating",
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
            body: `{"status":"{{list.value}}","notification_id": "${notification_id}", "filemonitoring_id": "${filemonitoring_id}"}`,
            isRequired: true,
            errorMessage: "Select an option",
          },
        ],
      },
    ],
  };
};
