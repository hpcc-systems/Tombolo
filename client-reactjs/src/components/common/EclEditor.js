import React, { Component, Fragment } from 'react';
import { debounce } from 'lodash';
import { ECLEditor as eclCodemirror } from '@hpcc-js/codemirror';

class EclEditor extends Component {

  eclEditor = null;

  constructor(props) {
    super(props);
    this.state = { ecl: '' };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.value != prevProps.value) {
      this.name = this.props.name;
      this.value = this.props.value;
      this.eclEditor.ecl(this.props.value);
    }
  }

  componentDidMount() {
    this.setState((state, props) => {
      return { ecl: props.value }
    });
    this.eclEditor = new eclCodemirror()
      .target(this.props.targetDomId)
      .readOnly(this.props.disabled)
      .render();



    this.eclEditor._codemirror.doc.on('change', debounce(() => {
      this.value = this.eclEditor.ecl();
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

export { EclEditor };