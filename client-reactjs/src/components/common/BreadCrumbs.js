import React, { Component } from 'react';
import { Breadcrumb } from 'antd';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

class BreadCrumbs extends Component {
  render() {
    const getBreadCrumbs = () => {
      const { location, application, dataflow } = this.props;

      const pathSnippets = location.pathname.split('/');
      let breadCrumbItems = [];
      let path = pathSnippets[2] || '';

      if (location.pathname === '/' || location.pathname.includes('/file/')) path = 'files';
      if (location.pathname.includes('/shareApp')) path = 'share an application';

      if (application?.applicationTitle) {
        breadCrumbItems.push(application.applicationTitle);
        breadCrumbItems.push(path);
        if (dataflow.id) {
          breadCrumbItems.push(dataflow.title);
        }
      } else {
        breadCrumbItems.push(pathSnippets[1]);
        breadCrumbItems.push(pathSnippets[2]);
      }

      return breadCrumbItems;
    };

    return (
      <div style={{ padding: '5px', display: 'flex', justifyContent: 'space-between' }}>
        <Breadcrumb>
          {getBreadCrumbs().map((el, index) => {
            return <Breadcrumb.Item key={index}>{el}</Breadcrumb.Item>;
          })}
        </Breadcrumb>
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

const connectedBreadCrumbs = connect(mapStateToProps)(withRouter(BreadCrumbs));
export default connectedBreadCrumbs;
