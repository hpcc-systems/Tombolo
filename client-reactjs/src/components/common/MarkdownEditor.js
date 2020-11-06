import React, { Component, Fragment } from 'react';
import { debounce } from 'lodash';
import { MarkdownEditor as mdCodemirror } from '@hpcc-js/codemirror';

class MarkdownEditor extends Component {

  mdEditor = null;

  constructor(props) {
    super(props);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.value == prevProps.value) {
      return;
    }
    this.name = this.props.name;
    this.value = this.props.value;
    this.mdEditor.markdown(this.props.value);
  }

  componentDidMount() {
    this.mdEditor = new mdCodemirror()
      .target(this.props.targetDomId)
      .render();

    this.mdEditor._codemirror.doc.on('change', debounce(() => {
      this.value = this.mdEditor.markdown();
      this.props.onChange({ target: this });
    }, 500));
  }

  render() {
    return (
      <Fragment>
        <div id={this.props.targetDomId}></div>
      </Fragment>
    );
  }

}

export { MarkdownEditor };