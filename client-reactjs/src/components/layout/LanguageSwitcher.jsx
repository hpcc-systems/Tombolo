import React, { useState, useEffect } from 'react';
import { Menu, Dropdown } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import i18next from 'i18next';

import { languages } from '../../i18n/languages';

function LanguageSwitcher({ setLocale }) {
  const [language, setLanguage] = useState('EN');

  useEffect(() => {
    let selectedLanguage = localStorage.getItem('i18nextLng');
    if (selectedLanguage) {
      selectedLanguage = selectedLanguage.toUpperCase();
      setLanguage(selectedLanguage);
    }
  }, []);

  // When language changed from drop down
  const changeLanguage = (language) => {
    localStorage.setItem('i18nextLng', language);
    i18next.changeLanguage(language);
    setLanguage(language.toUpperCase());
    setLocale(language);
  };

  const languageMenu = () => {
    return (
      <Menu
        onClick={(option) => {
          changeLanguage(option.key);
        }}>
        {languages.map((language) => {
          return (
            <Menu.Item className="menuOption" key={language.value}>
              {language.label}
            </Menu.Item>
          );
        })}
      </Menu>
    );
  };

  return (
    <>
      <Dropdown overlay={languageMenu} trigger={['click']}>
        <span style={{ color: 'white', fontSize: '22px', paddingLeft: '15px' }}>
          <GlobalOutlined className="languageSwitcherIcon" />
        </span>
      </Dropdown>{' '}
      <p style={{ color: 'white', paddingLeft: '5px', paddingTop: '10px' }}>{language} </p>
    </>
  );
}

export default LanguageSwitcher;