import React from 'react';
import { default as Monaco } from '@monaco-editor/react';
// import { loader } from '@monaco-editor/react';

// https://github.com/suren-atoyan/monaco-react/issues/217#issuecomment-980800802
// loader.config({ paths: { vs: '/monaco-editor/min/vs' } });

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

  console.log(config);

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
