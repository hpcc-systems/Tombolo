import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { getDirname } from './polyfills.js';

const __dirname = getDirname(import.meta.url);

interface EmailTemplateOptions {
  templateName: string;
  data: any;
}

const emailNotificationHtmlCode = ({
  templateName,
  data,
}: EmailTemplateOptions): string => {
  // Check if running from compiled dist or source
  const isCompiledVersion = __dirname.includes('/dist/');
  const templatePath = isCompiledVersion
    ? path.join(
        __dirname,
        '..',
        '..',
        'notificationTemplates',
        'email',
        `${templateName}.ejs`
      )
    : path.join(
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
