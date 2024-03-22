// This is a sample template for a Teams notification card.

const sampleOrigin = ({teamsData}) => {
  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: "0076D7",
    summary: "Test Summary",
    sections: [
      {
        activityTitle: "Lorem ipsum dolor sit amet",
        activitySubtitle:
          "Tconsectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud",
        text: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
        potentialAction: [
          {
            "@type": "ActionCard",
            name: "Comment",
            inputs: [
              {
                "@type": "TextInput",
                id: "comment",
                isMultiline: true,
                title: "Enter your comment",
              },
            ],
            actions: [
              {
                "@type": "HttpPOST",
                name: "OK",
                target: "http://...", 
              },
            ],
          },
          {
            "@type": "ActionCard",
            name: "Change Status",
            inputs: [
              {
                "@type": "MultichoiceInput",
                id: "list",
                title: "Change the status to",
                isMultiSelect: "false",
                choices: [
                  { display: "In Progress", value: "in_progress" },
                  { display: "Done", value: "done" },
                ],
              },
            ],
            actions: [
              {
                "@type": "HttpPOST",
                name: "OK",
                target: "http://...",
              },
            ],
          },
        ],
      },
    ],
  };
};

module.exports = sampleOrigin;
