import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Text({ text }) {
  const { t } = useTranslation();
  return <>{t(text, { ns: 'common' })}</>;
}
