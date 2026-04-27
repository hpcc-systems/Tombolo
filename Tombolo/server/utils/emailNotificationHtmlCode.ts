import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { getDirname } from './polyfills.js';

const __dirname = getDirname(import.meta.url);

type EmailTemplateData = Record<string, unknown>;

interface EmailTemplateOptions<
  TData extends EmailTemplateData = EmailTemplateData,
> {
  templateName: string;
  data: TData;
}

const resolveTemplatePath = (templateName: string): string => {
  const fileName = `${templateName}.ejs`;

  // Source of truth is jobs/notificationTemplates.
  const candidates = [
    path.join(
      process.cwd(),
      'jobs',
      'notificationTemplates',
      'email',
      fileName
    ),
    path.join(
      process.cwd(),
      '..',
      'jobs',
      'notificationTemplates',
      'email',
      fileName
    ),
    path.join(
      __dirname,
      '..',
      '..',
      'jobs',
      'notificationTemplates',
      'email',
      fileName
    ),
    // Backward-compatibility fallback
    path.join(
      process.cwd(),
      'server',
      'notificationTemplates',
      'email',
      fileName
    ),
    path.join(__dirname, '..', 'notificationTemplates', 'email', fileName),
    path.join(
      __dirname,
      '..',
      '..',
      'notificationTemplates',
      'email',
      fileName
    ),
  ];

  const found = candidates.find(candidate => fs.existsSync(candidate));
  if (!found) {
    throw new Error(
      `Notification template not found: ${fileName}. Checked: ${candidates.join(', ')}`
    );
  }

  return found;
};

const emailNotificationHtmlCode = <TData extends EmailTemplateData>({
  templateName,
  data,
}: EmailTemplateOptions<TData>): string => {
  const templatePath = resolveTemplatePath(templateName);

  const template = fs.readFileSync(templatePath, 'utf-8');
  return ejs.render(template, data);
};

export default emailNotificationHtmlCode;
