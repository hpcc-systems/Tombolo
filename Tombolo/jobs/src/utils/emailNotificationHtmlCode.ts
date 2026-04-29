import fs from 'fs';
import path from 'path';
import ejs from 'ejs';

type EmailTemplateData = Record<string, unknown>;

interface EmailTemplateOptions<
  TData extends EmailTemplateData = EmailTemplateData,
> {
  templateName: string;
  data: TData;
}

const defaultTheme = {
  bg: '#f6f8fb',
  cardBg: '#ffffff',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#dbe3ec',
  primary: '#0f62fe',
  success: '#198754',
  danger: '#dc3545',
  warning: '#f59e0b',
};

const defaultTemplateData = {
  theme: defaultTheme,
  contentWidth: 640,
};

const resolveTemplatePath = (templateName: string): string | undefined => {
  const candidates = [
    path.join(
      process.cwd(),
      'notificationTemplates',
      'email',
      `${templateName}.ejs`
    ),
  ];

  return candidates.find(candidate => fs.existsSync(candidate));
};

const emailNotificationHtmlCode = <TData extends EmailTemplateData>({
  templateName,
  data,
}: EmailTemplateOptions<TData>): string | undefined => {
  const templatePath = resolveTemplatePath(templateName);
  if (!templatePath) {
    return undefined;
  }

  const template = fs.readFileSync(templatePath, 'utf-8');
  return ejs.render(
    template,
    { ...defaultTemplateData, ...data },
    { filename: templatePath }
  );
};

export const emailNotificationTextCode = <TData extends EmailTemplateData>({
  templateName,
  data,
}: EmailTemplateOptions<TData>): string | undefined => {
  const html = emailNotificationHtmlCode({ templateName, data });
  if (!html) {
    return undefined;
  }

  return html
    .replace(/<style[\s\S]*?<\/style(?:\s[^>]*)?>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script(?:\s[^>]*)?>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n\n')
    .replace(/<\/div\s*>/gi, '\n')
    .replace(/<\/tr\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
};

export default emailNotificationHtmlCode;
