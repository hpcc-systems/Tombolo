import React, { Component } from "react";
import {Breadcrumb, Layout} from 'antd/lib';
import {withRouter} from "react-router-dom";

class BreadCrumbs extends Component {

  render() {
    const BreadCrumbs = withRouter((props) => {
        const { location } = props;
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
        console.log("<<< Here", this.props)
          path = pathSnippets[2];
        if(this.props.applicationId && this.props.applicationId !== '') {
          console.log("App title <<<<", this.props.applicationTitle, "<<<< Path ", path)
            breadCrumbItems.push(<Breadcrumb.Item key={this.props.applicationTitle}>{this.props.applicationTitle}</Breadcrumb.Item>);
            breadCrumbItems.push(<Breadcrumb.Item key={path}>{path}</Breadcrumb.Item>);
        } else {
            breadCrumbItems.push(<Breadcrumb.Item key={pathSnippets[1]}>{pathSnippets[1]}</Breadcrumb.Item>);
            breadCrumbItems.push(<Breadcrumb.Item key={pathSnippets[2]}>{pathSnippets[2]}</Breadcrumb.Item>);
        }
        return breadCrumbItems;
    });
    return (

     <Layout style={{ padding: '0 5px 5px' }}>
        <Breadcrumb>
          <BreadCrumbs/>
        </Breadcrumb>
     </Layout>   
    )
  }
}

export default BreadCrumbs;