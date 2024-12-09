const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

const emailNotificationHtmlCode = ({ templateName, data }) => {
  const templatePath = path.join(
    __dirname,
    "..",
    "notificationTemplates",
    "email",
    `${templateName}.ejs`
  );
  const template = fs.readFileSync(templatePath, "utf-8");
  return ejs.render(template, data);
};

module.exports = emailNotificationHtmlCode;
