// Libraries
import React, { useState, useEffect } from 'react';
import { Layout, message, Card } from 'antd';

// Local Imports
const GeneralSettings = React.lazy(() => import('./GeneralSettings'));
const SupportSettings = React.lazy(() => import('./SupportSettings'));
import { fetchInstanceSettings } from './settingsUtils';
import BreadCrumbs from '../../common/BreadCrumbs';
import EditSettingsButton from './EditSettingsButton';
import EditSettingsModel from './EditSettingsModel';
import './settings.css';

// Destructuring Layout
const { Sider, Content } = Layout;

function Settings() {
  // States
  const [selectedSetting, setSelectedSetting] = useState('general');
  const [instanceSettings, setInstanceSettings] = useState({});
  const [openEditModel, setOpenEditModel] = useState(false);

  // Settings
  const settings = {
    general: {
      id: 0,
      name: 'General',
      component: <GeneralSettings instanceSettings={instanceSettings} setInstanceSettings={setInstanceSettings} />,
    },
    support: { id: 1, name: 'Support', component: <SupportSettings instanceSettings={instanceSettings} /> },
  };

  // UseEffects
  useEffect(() => {
    const fetchData = async () => {
      try {
        const instanceSettings = await fetchInstanceSettings();
        setInstanceSettings(instanceSettings);
      } catch (error) {
        message.error(error.message);
      }
    };

    fetchData();
  }, []);

  // Handle setting change
  const handleSettingChange = (setting) => {
    setSelectedSetting(setting);
  };

  return (
    <div className="settings">
      <BreadCrumbs
        extraContent={
          <EditSettingsButton
            selectedSetting={selectedSetting}
            settings={settings}
            setOpenEditModel={setOpenEditModel}
          />
        }
      />
      <Layout className="settings-layout">
        <Sider theme="light" className="settings-sider">
          <div className="setting-sider-items">
            {Object.keys(settings).map((setting) => (
              <div
                key={settings[setting].id}
                className={`setting-item ${selectedSetting === setting ? 'selected-setting' : ''}`}
                onClick={() => handleSettingChange(setting)}>
                {settings[setting].name}
              </div>
            ))}
          </div>
        </Sider>
        <Content className="settings-content">
          <Card style={{ height: '82vh' }} size="small">
            {settings[selectedSetting].component}
          </Card>
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
}

export default Settings;
