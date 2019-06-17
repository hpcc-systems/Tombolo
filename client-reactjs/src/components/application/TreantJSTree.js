import {Treant} from 'treant-js/Treant.js';
import { message } from 'antd/lib';
import $ from 'jquery';
import React, { Component } from "react";
import FileDetailsForm from "./FileDetails";
import { authHeader } from "../common/AuthHeader.js"

class TreantJSTree extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    applications: [],
    openFileDetailsDialog: false,
    selectedFile: "",
    applicationId: this.props.applicationId,
    chartContainer: this.props.chartContainer ? this.props.chartContainer : "chart"

  }

 componentDidMount() {
    this.fetchDataAndRenderTree();
  }

  componentWillReceiveProps(props) {
    this.setState({
        applicationId: props.applicationId
      });
    const { refresh } = this.props;
    if (props.refresh !== refresh) {
      setTimeout(() => {
        this.fetchDataAndRenderTree();
      }, 200);

    }
  }

  fetchDataAndRenderTree() {
    var url = "/api/file/read/file_relations_list?application_id="+this.state.applicationId;
    if(this.props.fileId) {
      url += "&fileId="+this.props.fileId;
    }
    fetch(url, {
      headers: authHeader()
    }).then((response) => {
      return response.json();
    })
    .then(data => {
        this.renderTree(data);
    }).catch(error => {
      console.log(error);
      message.error('There was an error rendering the tree!');
    });

  }

  handleRefreshTree = () => this.fetchDataAndRenderTree();

  renderTree(relations) {
    var _me=this;
    var chartContainer = document.getElementById(_me.state.chartContainer);

    /*var nodes = '['+
     '{"_id": "taxi_raw","title": "Taxi Raw","description": "Raw input file for analyzing NY taxi trips between 2015 and 2016"},'+
     '{"_id": "taxi_clean","title": "Taxi Clean","description": "Cleaned Taxi File"},'+
     '{"_id": "weather_raw","title": "Weather Raw","description": "Raw input file"},'+
     '{"_id": "taxi_weather","title": "Taxi Weather","description": "Taxi Weather data"},'+
     '{"_id": "weather_clean","title": "Weather Clean","description": "Cleaned weather data"},'+
     '{"_id": "traffic_raw","title": "Traffic Raw","description": "Raw traffic data"},'+
     '{"_id": "traffic_clean","title": "Traffic Clean","description": "Cleaned traffic data"}'+
    ']';*/

    /*var relations = '['+
      '{"application_id": "taxi_trip_analysis","source_file_id": "taxi_raw", "destination_file_id":"taxi_clean"},'+
      '{"application_id": "taxi_trip_analysis","source_file_id": "taxi_clean", "destination_file_id":"taxi_weather"},'+
      '{"application_id": "taxi_trip_analysis","source_file_id": "traffic_raw", "destination_file_id":"traffic_clean"},'+
      '{"application_id": "taxi_trip_analysis","source_file_id": "traffic_clean", "destination_file_id":"weather_clean"},'+
      '{"application_id": "taxi_trip_analysis","source_file_id": "weather_raw", "destination_file_id":"weather_clean"},'+
      '{"application_id": "taxi_trip_analysis","source_file_id": "weather_clean", "destination_file_id":"taxi_weather"}'+
    ']';*/

    /*var relations = '['+
      '{"application_id": "taxi_trip_analysis","file_id":"taxi_weather", "source_files": [{"id":"taxi_clean"}, {"id": "weather_clean"}]},'+
      '{"application_id": "taxi_trip_analysis","file_id":"taxi_clean", "source_files": [{"id":"taxi_raw"}]},'+
      '{"application_id": "taxi_trip_analysis","file_id":"weather_clean", "source_files": [{"id":"traffic_clean"}, {"id":"weather_raw"}]},'+
      '{"application_id": "taxi_trip_analysis","file_id":"traffic_clean", "source_files": [{"id":"traffic_raw"}]},'+
      '{"application_id": "taxi_trip_analysis","file_id":"weather_raw", "source_files": [{"id":"traffic_raw"}]}'+
    ']';*/

    //var nodesFormatted = JSON.parse(nodes)
    //var relationsFormatted = JSON.parse(relations);

    var relationsFormatted = relations;

    //rendering starts from right to left. finding the first node to be rendered
    var lastNodeIds = this._findLastNode(relationsFormatted), nodeStructure={}, childrenOfRoot=[];
    nodeStructure["text"] = JSON.parse("{\"name\":\"dummy_node\"}");
    lastNodeIds.forEach(function(lastNodeId) {
       childrenOfRoot.push(_me._renderNodes(relationsFormatted, lastNodeId));
    });
    nodeStructure.children = childrenOfRoot;
    //iteratively render remaining nodes
    /*var nodeStructure = this._renderNodes(relationsFormatted, lastNodeId);
    console.log(JSON.stringify(nodeStructure));*/
    if(this.tree != undefined) this.tree.destroy();
    this._initiateTree(nodeStructure, chartContainer);
  }

  _findLastNode(relationsFormatted) {
    var lastNodeIds=[];
    var sourceFiles = [];
    //merge all the sources into an array
    relationsFormatted.forEach(function (relation) {
      //sourceFiles = $.merge(sourceFiles, relation.source_files)
      sourceFiles = sourceFiles.concat(relation.source_files);
    });
    //loop again to find the file that is not a source (parent node in the tree)
    relationsFormatted.forEach(function (relation) {
       //var match = $.grep(sourceFiles, function(sourceFile, i) {
       var match = sourceFiles.filter(sourceFile => relation.file_id == sourceFile.id);
       if(match == null || match.length == 0) {
         lastNodeIds.push(relation.file_id);
         return;
       }
    });
    return lastNodeIds;

  }

  _renderNodes(relationsFormatted, lastNodeId) {
    var _me = this, nodeObj = {}, nameObj = {};
    nameObj["name"] = lastNodeId;
    nodeObj["text"] = nameObj;
    nodeObj["image"] = "/icons/iconfinder_File_104851.png";

    /*var parent = $.grep(relationsFormatted, function(file, i) {
      return (file.file_id==lastNodeId);
    })*/
    var parent = relationsFormatted.filter(file => file.file_id==lastNodeId);

    if(parent != null && parent.length > 0) {
      var children = [];
      parent[0].source_files.forEach(function (node, idx) {
        children.push(_me._renderNodes(relationsFormatted, node.id));
      });

      nodeObj["children"] = children;
    }
    return nodeObj;

  }

  _initiateTree(nodeStructure, chartContainer) {
    var _self = this;
    require(['../../../node_modules/treant-js/vendor/raphael'], function(Raphael) {
      window.Raphael = Raphael;
      var chart_config = {
        chart: {
          container: '#'+_self.state.chartContainer,
          levelSeparation: 45,

          rootOrientation: "EAST",
          hideRootNode: true,
          nodeAlign: "BOTTOM",
          connectors: {
            type: "curve",
            style: {
              "stroke-width": 2,
              "stroke": "#50688D"
            }
          },
          node: {
            HTMLclass: "big-commpany"
          }
        },

        nodeStructure: nodeStructure
      };

      _self.tree = new Treant( chart_config, _self._treeRendered, $ );
      //this.tree = new Treant( chart_config, null);
    });
  }

  _setupListeners() {
    var _self = this;
    $('#'+_self.state.chartContainer).on('click', '.node', function(e) {
      e.preventDefault();
      setTimeout(
      function()
      {
        var fileId;
        if($(e.target).is("div")) {
          fileId = $(e.target).data('treenode').text.name;
        } else if($(e.target).is("p")){
          fileId = $(e.target).text();
        }
        _self.setState({
          openFileDetailsDialog: true,
          selectedFile: fileId
        });
        _self.child.showModal();
      }, 500);

    });

    $('.node .nodedelete').click(function(e) {
      console.log("delete listener");
      e.preventDefault();
      var fileName = $(e.target).parent().siblings(".node-name").text();
      var data = JSON.stringify({fileId: fileName, application_id: _self.state.applicationId});
      fetch("/api/file/read/delete", {
        method: 'post', 
        headers: authHeader(),
        body: data
      }).then((response) => {
        return response.json();
      })
      .then(result => {
        _self.fetchDataAndRenderTree();
        message.success("File deleted sucessfully");
      }).catch(error => {
        console.log(error);
        message.error("There was an error deleting the file");
      });
    })
  }

  _treeRendered = () => {
    this._addDeleteIcon();
    this._setupListeners();
  }

  _addDeleteIcon = () => {
    var _self=this;
    $(".node").each(function(index) {
      $(this).append("<span class='nodedelete'><img src='/icons/delete-16.png'/></span>");
    });
  }

  handleClose = () => {
    console.log('handleClose')
    this.setState({
      openFileDetailsDialog: false
    });
  }


  render() {
    return (
      <div>
        <div className="chart" id={this.state.chartContainer}/>
        {this.state.openFileDetailsDialog ?
          <FileDetailsForm
            onRef={ref => (this.child = ref)}
            isNewFile={false}
            selectedFile={this.state.selectedFile}
            applicationId={this.props.applicationId}
            onRefresh={this.handleRefreshTree}
            onClose={this.handleClose}/> : null}
      </div>
    )
  }
}

export default TreantJSTree;