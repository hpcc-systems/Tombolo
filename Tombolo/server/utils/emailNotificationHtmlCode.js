import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { getDirname } from './polyfills.js';

const __dirname = getDirname(import.meta.url);

const emailNotificationHtmlCode = ({ templateName, data }) => {
  const templatePath = path.join(
    __dirname,
    '..',
    'notificationTemplates',
    'email',
    `${templateName}.ejs`
  );
  const template = fs.readFileSync(templatePath, 'utf-8');
  return ejs.render(template, data);
};

export default emailNotificationHtmlCode;
