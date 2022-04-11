import React, { Component } from "react";
import {Breadcrumb, Layout} from 'antd/lib';
import {withRouter} from "react-router-dom";

class BreadCrumbs extends Component {

  render() {
    const getBreadCrumbs = () => {
        const { location } = this.props;
        const pathSnippets = location.pathname.split('/');
        let breadCrumbItems = [];
        let path = '';        
        if((location.pathname === '/') || (location.pathname.includes('/file/')))
          path = 'files'
        else if(location.pathname.includes('/shareApp'))
          path = 'share an application'
        else if(location.pathname.includes('/chart'))
          path = 'report'
        else
          path = pathSnippets[2];
        if(this.props.applicationId && this.props.applicationId !== '') {
            breadCrumbItems.push(<Breadcrumb.Item key={this.props.applicationTitle}>{this.props.applicationTitle}</Breadcrumb.Item>);
            breadCrumbItems.push(<Breadcrumb.Item key={path}>{path}</Breadcrumb.Item>);
        } else {
            breadCrumbItems.push(<Breadcrumb.Item key={pathSnippets[1]}>{pathSnippets[1]}</Breadcrumb.Item>);
            breadCrumbItems.push(<Breadcrumb.Item key={pathSnippets[2]}>{pathSnippets[2]}</Breadcrumb.Item>);
        }
        return breadCrumbItems;
    };
    
    return (

     <Layout style={{ padding: '0 5px 5px' }}>
        <Breadcrumb>
          {getBreadCrumbs()}
        </Breadcrumb>
     </Layout>   
    )
  }
}


export default withRouter(BreadCrumbs);