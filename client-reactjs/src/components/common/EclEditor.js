import React, {useEffect, useState } from 'react';
import Editor from "@monaco-editor/react";
import { Switch } from 'antd';

const EclEditor = ({ ecl, handleECLChange }) => {
  const defaultTheme = 'light';
  
  const [theme, setTheme] = useState('');

  useEffect(() => {
    const editorTheme = localStorage.getItem('editorTheme');
    setTheme(editorTheme || defaultTheme);
  }, []);

  const handleEditorChange = (value) => {
    console.log('-value-----------------------------------------');
    console.dir({ value }, { depth: null });
    console.log('------------------------------------------');
    // handleECLChange(value) // -- will pass value to parent state, will be saved to db
  };

  const handleSwitchTheme = (checked) => {
    const currentTheme = checked ? 'light' : 'vs-dark';
    setTheme(() => currentTheme);
    localStorage.setItem('editorTheme', currentTheme);
  };

  if (!theme) return null;

  return (
    <>
      <div style={{ padding: '5px' }}>
        <Switch
          checked={theme === 'light'}
          onChange={handleSwitchTheme}
          checkedChildren={<i class="fa fa-sun-o" />}
          unCheckedChildren={<i class="fa fa-moon-o" />}
        />
      </div>
      <Editor
        theme={theme}
        height="60vh"
        defaultValue={ecl}
        defaultLanguage="ecl"
        onChange={handleEditorChange}
      />
    </>
  );
};
export { EclEditor };






// class EclEditorDDDDD extends Component {

//   eclEditor = null;

//   constructor(props) {
//     super(props);
//     this.state = { ecl: '' };
//   }

//   componentDidUpdate(prevProps, prevState, snapshot) {
//     if (this.value != prevProps.value) {
//       this.name = this.props.name;
//       this.value = this.props.value;
//       this.eclEditor.ecl(this.props.value);
//     }
//   }

//   componentDidMount() {
//     this.setState((state, props) => {
//       return { ecl: props.value }
//     });
//     this.eclEditor = new eclCodemirror()
//       .target(this.props.targetDomId)
//       .readOnly(this.props.disabled)
//       .render();



//     this.eclEditor?._codemirror?.doc?.on('change', debounce(() => {
//       this.value = this.eclEditor.ecl();
//       this.props.onChange({ target: this });
//     }, 500));
//   }

//   render() {
//     return (
//       <Fragment>
//         <div id={this.props.targetDomId}></div>
//       </Fragment>
//     );
//   }

// }

// export { EclEditor };
