import React, { Component } from 'react';
import { debounce } from 'lodash';
import { MarkdownEditor as mdCodemirror } from '@hpcc-js/codemirror';

class MarkdownEditor extends Component {
  mdEditor = null;
  classList = ['noGutters', 'noScroll'];

  constructor(props) {
    super(props);
    if (props.gutters === true) {
      this.classList = this.classList.filter((e) => e !== 'noGutters');
    }
  }

  componentDidUpdate(_prevProps, _prevState, _snapshot) {
    if (!this.props.value) {
      this.mdEditor.markdown('');
      return;
    }
    if (!this.value) {
      this.name = this.props.name;
      this.value = this.props.value;
      window.setTimeout(() => {
        this.mdEditor.markdown(this.props.value);
      }, 300);
    }
  }

  componentDidMount() {
    this.mdEditor = new mdCodemirror().target(this.props.targetDomId).render();

    if (this.mdEditor && this.mdEditor._codemirror) {
      this.mdEditor._codemirror.doc.on(
        'change',
        debounce(() => {
          this.value = this.mdEditor.markdown();
          this.props.onChange({ target: this });
        }, 500)
      );
    }

    if (!this.value) {
      this.name = this.props.name;
      this.value = this.props.value;
      window.setTimeout(() => {
        if (!this.props.value) {
          return;
        }
        this.mdEditor.markdown(this.props.value);
      }, 300);
    }
  }

  render() {
    return <div id={this.props.targetDomId} className={this.classList.join(' ')} />;
  }
}

export { MarkdownEditor };
