// import React from 'react';
//
// const TeamsWebhookGuide = () => {
//   /*
//         Following the structure below will assist in keeping guide structure consistent throughout the project.
//         <span> tags are utilized to bold key phrases to make content more easily scannable and emphasize important pieces of information
//         Always follow a proper heading structure with <h3> as the top level heading (h2 is the title of the info drawer), and <h4> for subheadings
//         All heading tags are automatically bolded, so no <span> tag is necessary
//         Avoid use of <br/> tags, instead group text into a new <p> tag to achieve a break line for consistency.
//     */
//   return (
//     <div className="guide">
//       <h2>Microsoft Teams Webhook Guide</h2>
//
//       <p>
//         Webhooks in Microsoft Teams allow Tombolo to deliver notifications and updates directly into a Teams channel.
//         Webhooks post these updates directly into the chat stream which can be handled and responded to in order to keep
//         your team on top of important notifications.
//       </p>
//
//       <h3>Create Incoming Webhooks</h3>
//       <p>To add an Incoming Webhook to a Teams channel, follow these steps:</p>
//       <ol>
//         <li>
//           <p>
//             Open the channel in which you want to add the webhook and select <span>•••</span> from the upper-right
//             corner.
//           </p>
//         </li>
//         <li>
//           <p>
//             Select <span>Connectors</span> from the dropdown menu.
//           </p>
//         </li>
//         <li>
//           <p>
//             Select <span>Configure</span>, and provide a name for your webhook.
//           </p>
//         </li>
//         <li>
//           <p>
//             Copy and save the unique webhook URL present in the dialog. The URL maps to the channel and you can use it
//             to send information to Teams.
//           </p>
//         </li>
//         <li>
//           <p>Select Done.</p>
//         </li>
//       </ol>
//       <p>
//         The webhook is now available in the Teams channel. Simply provide the copied URL in the field inside of Tombolo,
//         and configured notifications will begin to appear in the channel.
//       </p>
//     </div>
//   );
// };
//
// export default TeamsWebhookGuide;
