import React from 'react';
import { default as Monaco } from '@monaco-editor/react';

const MonacoEditor = ({ onChange, value = '', targetDomId = '', lang = 'markdown', ...rest }) => {
  const config = {
    markdown: {
      height: '300px',
      onChange: (text) => onChange({ target: { name: 'description', value: text } }),
      options: {
        lineNumbers: 'off',
        glyphMargin: false,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 0,
        renderLineHighlight: 'none',
        cursorBlinking: 'smooth',
        minimap: { enabled: false },
        scrollbar: {
          horizontalScrollbarSize: 3,
          verticalScrollbarSize: 3,
        },
      },
    },
    ecl: {
      height: '60vh',
      options: {
        readOnly: true,
      },
    },
  };

  return (
    <Monaco
      value={value}
      language={lang}
      {...config[lang]} // get rest of config depending on editor type
      {...rest} // all other props
      className="ant-input" // give ant input field styles
      path={lang + targetDomId} // will make this model unique
    />
  );
};

export default MonacoEditor;
