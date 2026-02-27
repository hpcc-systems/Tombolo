import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';

const GeneralSettings = React.lazy(() => import('./GeneralSettings'));
const SupportSettings = React.lazy(() => import('./SupportSettings'));
import { handleError } from '@/components/common/handleResponse';
import instanceSettingsService from '@/services/instanceSettings.service';
import BreadCrumbs from '../../common/BreadCrumbs';
import EditSettingsButton from './EditSettingsButton';
import EditSettingsModel from './EditSettingsModel';
import styles from './settings.module.css';

const { Sider, Content } = Layout;

interface InstanceSettings {
  name?: string;
  metaData?: any;
}

const Settings: React.FC = () => {
  const [selectedSetting, setSelectedSetting] = useState<string>('general');
  const [instanceSettings, setInstanceSettings] = useState<InstanceSettings>({});
  const [openEditModel, setOpenEditModel] = useState<boolean>(false);

  const settings: Record<string, { id: number; name: string; component: React.ReactNode }> = {
    general: {
      id: 0,
      name: 'General',
      component: (<GeneralSettings instanceSettings={instanceSettings} />) as React.ReactNode,
    },
    support: {
      id: 1,
      name: 'Support',
      component: (<SupportSettings instanceSettings={instanceSettings} />) as React.ReactNode,
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const instanceSettings = await instanceSettingsService.getAll();
        setInstanceSettings(instanceSettings);
      } catch (error: any) {
        if (error.status === 404) {
          handleError('Failed to fetch instance settings');
        } else {
          handleError(error.messages || error.message || 'Failed to fetch instance settings');
        }
      }
    };

    fetchData();
  }, []);

  const handleSettingChange = (setting: string) => {
    setSelectedSetting(setting);
  };

  return (
    <div className={styles.settings}>
      <BreadCrumbs
        extraContent={
          <EditSettingsButton
            selectedSetting={selectedSetting}
            settings={settings}
            setOpenEditModel={setOpenEditModel}
          />
        }
      />
      <Layout className={styles.settingsLayout}>
        <Sider theme="light" className={styles.settingsSider}>
          <div>
            {Object.keys(settings).map(setting => (
              <div
                key={settings[setting].id}
                className={`${styles.settingItem} ${selectedSetting === setting ? styles.selectedSetting : ''}`}
                onClick={() => handleSettingChange(setting)}>
                {settings[setting].name}
              </div>
            ))}
          </div>
        </Sider>
        <Content className={styles.settingsContent}>
          <div style={{ height: '82vh' }}>{settings[selectedSetting].component}</div>
        </Content>
      </Layout>
      <EditSettingsModel
        selectedSetting={selectedSetting}
        settings={settings}
        openEditModel={openEditModel}
        setOpenEditModel={setOpenEditModel}
        instanceSettings={instanceSettings}
        setInstanceSettings={setInstanceSettings}
      />
    </div>
  );
};

export default Settings;
