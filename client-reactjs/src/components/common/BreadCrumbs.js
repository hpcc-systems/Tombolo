import React, { Component } from 'react';
import { Breadcrumb } from 'antd';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
class BreadCrumbs extends Component {
  render() {
    // const { t } = this.props; // translation

    const getBreadCrumbs = () => {
      const { location, application } = this.props;

      const pathSnippets = location.pathname.split('/');

      //rebuild pathSnippets with label and value
      const newPathSnippets = pathSnippets.map((item) => {
        if (item === application.applicationId || item === 'admin') return { label: 'Home', value: item };
        return { label: item, value: item };
      });

      let count = 2;

      let newBreadCrumbItems = [];

      //map through path snippets and add new breadcrumb items
      newPathSnippets.map((item) => {
        //if there is no path, just return
        if (item.value === '') return;

        //define new variables
        let newItem = {};
        let href = '/' + newPathSnippets[1].value;

        //add '/' and newPathSnippets[count] to href for each count less than the current count
        for (let i = 2; i < count; i++) {
          href += '/' + newPathSnippets[i].value;
        }
        newItem.key = count - 1;
        newItem.href = href;
        newItem.title = item.label;

        //iterate count and add item to return array
        count++;
        newBreadCrumbItems.push(newItem);
      });

      return newBreadCrumbItems;
    };

    return (
      <div style={{ padding: '5px', display: 'flex', justifyContent: 'space-between' }}>
        <Breadcrumb items={getBreadCrumbs()} />
        {this.props.extraContent || null}
      </div>
    );
  }
}

function mapStateToProps(state) {
  const application = state.applicationReducer.application;
  const dataflow = state.dataflowReducer;

  return { application, dataflow };
}

let connectedBreadCrumbs = connect(mapStateToProps)(withRouter(BreadCrumbs));
connectedBreadCrumbs = withTranslation('common')(connectedBreadCrumbs);

export default connectedBreadCrumbs;
