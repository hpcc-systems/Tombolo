import React from 'react';
import { useTranslation } from 'react-i18next';

// By default exporting react component React component
export default function Text({ text, children = null }) {
  const { t } = useTranslation();
  return <>{t(children || text, { ns: 'common' })}</>;
}

// alternatively we can use this function to convert values anywhere, helpful with "placeholder" react FC is not accepted
export const i18n = (text) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useTranslation();
  return t(text, { ns: 'common' });
};
