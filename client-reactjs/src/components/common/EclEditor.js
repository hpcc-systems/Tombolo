import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Switch } from 'antd';

const EclEditor = ({ ecl, handleECLChange }) => {
  const defaultTheme = 'vs-dark';

  const [theme, setTheme] = useState('');

  useEffect(() => {
    const editorTheme = localStorage.getItem('editorTheme');
    setTheme(editorTheme || defaultTheme);
  }, []);

  const handleSwitchTheme = (checked) => {
    const currentTheme = checked ? 'light' : 'vs-dark';
    setTheme(() => currentTheme);
    localStorage.setItem('editorTheme', currentTheme);
  };

  if (!theme) return null;

  return (
    <>
      <div style={{ paddingBottom: '5px', display: 'flex', justifyContent: 'flex-end' }}>
        <Switch
          checked={theme === 'light'}
          onChange={handleSwitchTheme}
          checkedChildren={<i className="fa fa-sun-o" />}
          unCheckedChildren={<i className="fa fa-moon-o" />}
        />
      </div>
      <div style={{ border: '1px solid grey', padding: '3px', borderRadius: '2px' }}>
        <Editor
          theme={theme}
          height="60vh"
          defaultValue={ecl}
          defaultLanguage="ecl"
          // onChange={handleECLChange} // wil change ecl in upper state
        />
      </div>
    </>
  );
};
export { EclEditor };
