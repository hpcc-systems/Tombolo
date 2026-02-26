import React, { useMemo } from 'react';
import { Breadcrumb } from 'antd';
import { useLocation } from 'react-router-dom';

import { useAppSelector } from '@/redux/store/hooks';
import styles from './common.module.css';

interface Props {
  extraContent?: React.ReactNode;
}

const BreadCrumbs: React.FC<Props> = ({ extraContent }) => {
  const location = useLocation();
  const application = useAppSelector(state => state.application.application);
  const applicationId = (application as any)?.applicationId;

  const breadcrumbItems = useMemo(() => {
    const pathSnippets = location.pathname.split('/');

    // Rebuild pathSnippets with label and value
    const newPathSnippets = pathSnippets.map((item: string, index: number) => {
      if (item === applicationId || item === 'admin' || index === 1) {
        return { label: 'Home', value: item };
      }
      return { label: item, value: item };
    });

    let count = 2;
    const items: { key: number; href: string; title: string }[] = [];

    for (const snippet of newPathSnippets) {
      if (snippet.value === '') {
        continue;
      }

      // Build href from segments up to the current count
      let href = '/' + newPathSnippets[1].value;
      for (let i = 2; i < count; i++) {
        href += '/' + newPathSnippets[i].value;
      }

      if (snippet.value !== 'dashboard') {
        items.push({
          key: count - 1,
          href,
          title: snippet.label.charAt(0).toUpperCase() + snippet.label.slice(1),
        });
      }

      count++;
    }

    return items;
  }, [location.pathname, applicationId]);

  return (
    <div className={styles.breadcrumbContainer}>
      <Breadcrumb items={breadcrumbItems} />
      {extraContent || null}
    </div>
  );
};

export default BreadCrumbs;
