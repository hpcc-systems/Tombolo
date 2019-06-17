import React, { Component } from "react";

class DataProfileHTML extends Component {

  constructor(props) {
    super(props);
  }

  createMarkup = (htmlAssets) => {
    for(var i=0; i<htmlAssets.length; i++) {
        if(htmlAssets[i].endsWith(".html")) {
            return {__html: '<iframe src="'+htmlAssets[i]+'" width="100%" height="530" frameBorder="0"></iframe>'};
        }
    }
  }

  render() {
    const htmlAssets = this.props.htmlAssets;  
    return (
        <div dangerouslySetInnerHTML={this.createMarkup(htmlAssets)} />
        
    );
  }

}

export default DataProfileHTML;