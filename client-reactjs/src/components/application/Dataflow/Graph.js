import React, { Component } from "react";
import * as d3 from "d3";
import '../../graph-creator/graph-creator.css';
import $ from 'jquery';
import { Button, Icon, Drawer, Row, Col, Descriptions, Badge, Modal, message, Spin, Tooltip, Menu, Checkbox, Dropdown} from 'antd/lib';
import { Typography } from 'antd';
import { withRouter } from 'react-router-dom';
import AssetDetailsDialog from "../AssetDetailsDialog"
import ExistingAssetListDialog from "./ExistingAssetListDialog";
import {updateGraph, changeVisibility} from "../../common/WorkflowUtil";
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { hasEditPermission } from "../../common/AuthUtil.js";
import { shapesData, appendDefs, jobIcons } from "./Utils.js"
import SubProcessDialog from "./SubProcessDialog";
import { connect } from 'react-redux';
import { assetsActions } from '../../../redux/actions/Assets';
import { EyeOutlined, ReloadOutlined, EyeInvisibleOutlined , ExclamationCircleOutlined } from '@ant-design/icons';

const svgPalleteBarWidth = 90,
  svgUsableWidth = window.innerWidth - 100,
  svgUsableHeight = window.innerHeight - 130,
  svgViewBox = '0 0 '+window.innerWidth+' '+window.innerHeight,
  svgNodeWidth = 38,
  svgNodeHeight = 38,
  svgNodeStrokeWidth = 3;

class Graph extends Component {
  constructor(props) {
    super(props);
    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  state = {
    openFileDetailsDialog: false,
    openJobDetailsDialog: false,
    openIndexDetailsDialog: false,
    selectedFile: '',
    selectedAssetTitle : '',
    selectedNodeId: '',
    selectedIndex: '',
    isNew:false,
    selectedJob: '',
    selectedJobType: '',
    isNewJob:false,
    isNewIndex:false,
    isNewInstance:false,
    currentlyEditingId:'',
    applicationId: '',
    nodeDetailsVisible: false,
    nodeDetailStatus: '',
    nodeDetailMessage: '',
    wuid:'',
    selectedDataflow:{},
    mousePosition:[],
    wu_end: '',
    wu_start: '',
    wu_duration: '',
    showSubProcessDetails: false,
    selectedSubProcess: {"id":''},
    currentlyEditingNode: {},
    showAssetListDlg: false,
    assetDetailsFormRef: null,
    loading: false,
    nodes: []
  }

 

  consts = {
      selectedClass: "selected",
      connectClass: "connect-node",
      circleGClass: "node",
      graphClass: "graph",
      activeEditId: "active-editing",
      BACKSPACE_KEY: 8,
      DELETE_KEY: 46,
      ENTER_KEY: 13,
      nodeRadius: 50
  };

  graphState = {
      selectedNode: null,
      selectedEdge: null,
      mouseDownNode: null,
      mouseEnterNode: null,
      mouseDownLink: null,
      justDragged: false,
      justScaleTransGraph: false,
      lastKeyDown: -1,
      shiftNodeDrag: false,
      selectedText: null,
      idct: 0,
      zoomTransform: null
  };

  thisGraph = {};



  async componentDidMount() {
    this.loadGraphComponents();
    await this.fetchSavedGraph();
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillReceiveProps(props) {
    if(this.state.applicationId && this.state.applicationId != props.applicationId ||
      this.state.selectedDataflow != props.selectedDataflow) {
      this.setState({
        applicationId: props.applicationId,
        selectedDataflow: props.selectedDataflow
      }, function() {
        //this.fetchSavedGraph();
      });
    }

    if(props.workflowDetails && props.workflowDetails.wuDetails && props.workflowDetails.wuDetails.length > 0) {
      //this.updateCompletionStatus(props.workflowDetails);
      this.fetchSavedGraph().then((result) => {
        this.updateCompletionStatus(props.workflowDetails);
      })
    }

    if(props.saveResponse && props.saveResponse.success) {
      this.showScheduleIcons(props.saveResponse);
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  setWrapperRef(node) {
    this.wrapperRef = node;
  }

  handleClickOutside(event) {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
    }
    //this.saveGraph();
  }

  openDetailsDialog(d) {
    let _self=this;
    let isNew = false;
    switch(d.type) {
      case 'File':
        if(d.fileId == undefined || d.fileId == '') {
          isNew = true;
          this.setState({
            showAssetListDlg: true,
            mousePosition: [d.x, d.y]
          })
        } else {
          this.setState({
            isNew: isNew,
            openFileDetailsDialog: true,
            selectedFile: d.fileId,
            selectedNodeId: d.id,
            selectedAssetTitle: d.title
          });
          this.props.dispatch(assetsActions.assetSelected(
            d.fileId,
            this.props.applicationId,
            ''
          ));
        }

        break;
      case 'Job':
      case 'Modeling':
      case 'Scoring':
      case 'ETL':
      case 'Query Build':
      case 'Data Profile':
        //for opening details
        if(d.jobId == undefined || d.jobId == '') {
          isNew = true;
          this.setState({
            showAssetListDlg: true,
            mousePosition: [d.x, d.y]
          })
        } else {
          this.setState({
            isNewJob: isNew,
            openJobDetailsDialog: true,
            selectedJob: d.jobId,
            selectedAssetTitle: d.title,
            selectedJobType: d.type == 'Job' ? 'General' : d.type,
            mousePosition: [d.x, d.y],
          });
          this.props.dispatch(assetsActions.assetSelected(
            d.jobId,
            this.props.applicationId,
            ''
          ));
        }
        break;
      case 'Index':
        let isNewIndex = false;
        if(d.indexId == undefined || d.indexId == '') {
          isNew = true;
          this.setState({
            showAssetListDlg: true
          })
        } else {
          this.setState({
            isNewIndex: isNew,
            openIndexDetailsDialog: true,
            selectedIndex: d.indexId,
            selectedAssetTitle: d.title,
          });

          this.props.dispatch(assetsActions.assetSelected(
            d.indexId,
            this.props.applicationId,
            ''
          ));
        }
        break;
      case 'Sub-Process':
        this.setState({
          selectedSubProcess: {"id": d.subProcessId, "title":d.title},
          showSubProcessDetails: true
        });
        break;
   }
  }


  getTaskColor = (task) => {
    switch(task.status) {
      case 'failed':
        return '#ff0900';
      case 'running':
        return '#4837bc';
      case 'wait':
        return '#eeba30'
      case 'completed':
      case 'compiled':
        return '#3bb44a'
    }
  }

  blink = (rect) => {
    rect.attr('stroke', "red")
      .transition()
      .duration(1000)
      .attr('stroke', "green")
      .transition()
      .duration(1000)
      .on("end", console.log('blink ending'))

    /*rect.transition()
      .duration(1000)
      .attr("stroke", "red")
      .transition()
      .duration(1000)
      .attr("stroke", "green")
      .on("end", console.log('blink ending'))*/
  }

  updateCompletionStatus = (workflowDetails) => {
    let _self=this;
    if(workflowDetails) {
      let completedTasks = _self.getTaskDetails(workflowDetails);
      d3.selectAll('text.tick').remove();
      d3.selectAll('.node rect').attr('stroke', 'grey');
      d3.selectAll('.node rect').classed("warning", false);

      d3.selectAll('.node rect').each(function(d) {
        let task = completedTasks.filter((task) => {
          return task.id == d3.select(this).attr("id")
        })
        if(task && task.length > 0) {
          if(task[0].status == 'completed' || task[0].status == 'compiled') {
            d3.select(this.parentNode).append("text")
              .attr('class', 'tick')
              .attr('font-family', 'FontAwesome')
              .attr('font-size', function(d) { return '2em'} )
              .attr('fill', _self.getTaskColor(task[0]))
              .attr("x", '7')
              .attr("y", '-2')
              .text( function (d) {
                if(task[0].message && JSON.parse(task[0].message).length > 0) {
                  if(JSON.parse(task[0].message)[0].Severity=='Error' || JSON.parse(task[0].message)[0].Severity=='Warning') {
                    //d3.select(this).select('rect').attr("class", 'warning')
                    return '\uf071';
                  }
                }
                return '\uf058';
              })
          }
          d3.select(this.parentNode).select('rect').attr("stroke", _self.getTaskColor(task[0]));
          d3.select(this.parentNode).select('rect').attr("stroke-width", "5");
          //d3.select(this).select('rect').attr("message", task[0].message);
        }
      });

    }
  }

  getTaskDetails = (workflowDetails) => {
    let _self = this;
    let completedTasks = [];
    if(workflowDetails.wuDetails) {
      workflowDetails.wuDetails.forEach((workflowDetail) => {
        let nodeObj = _self.state.nodes.filter((node) => {
          return (node.fileId == workflowDetail.task || node.jobId == workflowDetail.task || node.indexId == workflowDetail.task)
        })
        if(nodeObj[0] && nodeObj[0].id) {
          completedTasks.push({"id": "rec-"+nodeObj[0].id,
            "status": workflowDetail.status,
            "message": workflowDetail.message,
            "wuid": workflowDetail.wuid,
            "wu_start": workflowDetail.wu_start,
            "wu_end": workflowDetail.wu_end,
            "wu_duration": workflowDetail.wu_duration,
            "cluster": workflowDetails.cluster
          })
        }
      });
    }
    return completedTasks;
  }

  handleClose = () => {
    this.setState({
      openFileDetailsDialog: false
    });  }

  closeJobDlg = () => {
    this.setState({
      openJobDetailsDialog: false
    });
  }

  closeIndexDlg = () => {
    this.setState({
      openIndexDetailsDialog: false
    });
  }

  closeAssetListDlg = () => {
    this.setState({
      showAssetListDlg: false
    });
  }

  showScheduleIcons = (saveResponse) => {    
    var newData = this.thisGraph.nodes.map(el => {
      if(el.id == this.state.currentlyEditingId) {
        el.scheduleType = saveResponse.type;
        el.jobType = saveResponse.jobType;
        this.props.dispatch(assetsActions.assetSaved({}));
      }
      return el;
    })
    this.thisGraph.nodes = newData;
    this.updateGraph();

    this.saveGraph();
  }

  onFileAdded = async (saveResponse) => {
    if(saveResponse) {
      var newData = this.thisGraph.nodes.map(el => {
        if(el.id == this.state.currentlyEditingId) {
          el.title=saveResponse.title;
          d3.select("#label-"+el.id).text(saveResponse.title);
          switch(el.type) {
            case 'File':
              el.fileId=saveResponse.fileId;
              this.saveAssetToDataflow(el.fileId, this.props.selectedDataflow.id, el.type);
              break;
            case 'Index':
              el.indexId=saveResponse.indexId;
              this.saveAssetToDataflow(el.indexId, this.props.selectedDataflow.id, el.type);
              break;
            case 'Job':
              el.jobId=saveResponse.jobId;
              el.jobType = saveResponse.jobType;
              this.saveAssetToDataflow(el.jobId, this.props.selectedDataflow.id, el.type, el.jobType);
              break;
            case 'Sub-Process':
              el.subProcessId=saveResponse.id;
              this.setState({
                showSubProcessDetails: false
              });
              this.saveGraph();

              break;
          }
          return el;
           //return Object.assign({}, el, {title:saveResponse.title, fileId:saveResponse.fileId, jobId:saveResponse.jobId, queryId:saveResponse.queryId, indexId:saveResponse.indexId})
        }
        return el
      });
      if(saveResponse.dataflow) {
        let edges = saveResponse.dataflow.edges;
        edges.forEach(function (e, i) {
          edges[i] = {
            source: saveResponse.dataflow.nodes.filter(function (n) {
              return n.id === e.source;
            })[0],
            target: saveResponse.dataflow.nodes.filter(function (n) {
              return n.id === e.target;
            })[0]
          };
        });
        this.thisGraph.nodes = saveResponse.dataflow.nodes;
        this.thisGraph.edges = edges;
        this.setIdCt(saveResponse.dataflow.length);
      } else {
        this.thisGraph.nodes = newData;
      }
      this.updateGraph();
      this.saveGraph();
    } else {
      await this.fetchSavedGraph();
    }
  }

  createJobFileRelationship(jobId, dataflowId) {
    this.setState({
      loading: true
    });
    fetch('/api/job/createFileRelation', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({
        jobId: jobId,
        currentlyEditingId: this.state.currentlyEditingId,
        mousePosition: this.state.mousePosition.join(','),
        application_id: this.props.applicationId,
        dataflowId: dataflowId
      })
    }).then(response => {
      if (response.ok) {
        return response.json();
      }
      handleError(response);
    }).then(async data => {
      console.log(`Saved file relationship...`);
      await this.fetchSavedGraph();
      this.setState({
        loading: false
      });

    });

  }

  saveAssetToDataflow(assetId, dataflowId, assetType, jobType) {
    console.log(assetId, dataflowId, assetType, jobType);
    fetch('/api/dataflow/saveAsset', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({ assetId: assetId, dataflowId: dataflowId })
    }).then(response => {
      if (response.ok) {
        return response.json();
      }
      handleError(response);
    }).then(data => {
      console.log(`Saved asset ${assetId} to dataflow ${dataflowId}...`);
      if(assetType == 'Job' && 
        (jobType && jobType == 'Job' 
        || jobType == 'Modeling'
        || jobType == 'Scoring'
        || jobType == 'ETL'
        || jobType == 'Query Build'
        || jobType == 'Data Profile')) {
        this.createJobFileRelationship(assetId, dataflowId);
      }
    });
  }

  saveGraph() {
    let _self = this, edges = [], nodes = this.thisGraph.nodes;
    this.thisGraph.edges.forEach(function (val, i) {
      if(val.source && val.target) {
        edges.push({source: val.source.id, target: val.target.id});
      }
    });

    fetch('/api/dataflowgraph/save', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({
          "application_id": this.props.applicationId,
          dataflowId: this.props.selectedDataflow.id,
          nodes: this.thisGraph.nodes,
          edges: edges
        })
    }).then(function(response) {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
    }).then(function(data) {
      _self.props.selectedDataflow.id = data.dataflowId;
      /*if(_self.props.updateProcessId) {
        _self.props.updateProcessId(data.dataflowId);
      }*/
      console.log('Saved graph..');
        //_self.fetchFiles();
    });
  }

  fetchSavedGraph() {
    return new Promise((resolve, reject) => {
      var _self=this, nodes = [], edges = [];
      if(this.props.selectedDataflow && this.props.selectedDataflow.id != '' && this.props.selectedDataflow.id != undefined) {
        fetch("/api/dataflowgraph?application_id="+this.props.applicationId+"&dataflowId="+this.props.selectedDataflow.id, {
          headers: authHeader()
        })
        .then((response) => {
          if(response.ok) {
            return response.json();
          }
          handleError(response);
        })
        .then(data => {
          if(data != undefined && data != null) {
            nodes = JSON.parse(data.nodes);
            edges = JSON.parse(data.edges);

            edges.forEach(function (e, i) {
            edges[i] = {
                source: nodes.filter(function (n) {
                  return n.id === e.source;
                })[0],
                target: nodes.filter(function (n) {
                  return n.id === e.target;
                })[0]
              };
            });
          }
          _self.thisGraph.nodes = nodes;
          _self.thisGraph.edges = edges;
          _self.setState({
            nodes: nodes
          });

          _self.setIdCt(nodes.length);
          _self.updateGraph();
          resolve();
          //this.updateCompletionStatus();
        }).catch(error => {
          console.log(error);
          reject(error)
        });
      } else {
        this.clearSVG();
        resolve();
      }
    })
  }

  clearSVG = () => {
    this.thisGraph.nodes = [];
    this.thisGraph.edges = [];
    this.setIdCt(0);
    this.updateGraph();
  }

  updateWindow = (svg) => {
    let docEl = document.documentElement,
        bodyEl = document.getElementsByTagName('body')[0];
    let x = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth;
    let y = window.innerHeight || docEl.clientHeight || bodyEl.clientHeight;
    svg.attr("width", x).attr("height", y);
  }

  /* PROTOTYPE FUNCTIONS */

  dragmove = (d) => {
    let _self=this;
    if (_self.graphState.shiftNodeDrag) {
      //path dragging
      _self.thisGraph.dragLine.attr('d', 'M' + (d.x + 5) + ',' + (d.y + 15) + 'L' + (d3.mouse(_self.thisGraph.svgG.node())[0] + 15)+ ',' + d3.mouse(_self.thisGraph.svgG.node())[1]);
      _self.updateGraph();
    } else {
      //limit the dragging within svg boundary
      let left = d3.event.x, top = d3.event.y;
      /*if (left + svgNodeWidth + svgNodeStrokeWidth > (svgUsableWidth + svgPalleteBarWidth)) {
        left = (svgUsableWidth + svgPalleteBarWidth) - svgNodeWidth - svgNodeStrokeWidth
      } else if (d3.event.x < svgPalleteBarWidth) {
        left = svgPalleteBarWidth;
      }
      if (top + svgNodeHeight + svgNodeStrokeWidth > svgUsableHeight) {
        top = svgUsableHeight - svgNodeHeight - svgNodeStrokeWidth
      } else if (d3.event.y < 0) {
        top = 0
      }*/

      d.x = left;
      d.y = top;
      //_self.thisGraph.dragLine.attr('d', 'M' + (d.x + 5) + ',' + (d.y + 5) + 'L' + (d3.mouse(_self.thisGraph.svgG.node())[0] + 5)+ ',' + d3.mouse(_self.thisGraph.svgG.node())[1]);
      _self.updateGraph();
    }
  }

  /* select all text in element: taken from http://stackoverflow.com/questions/6139107/programatically-select-text-in-a-contenteditable-html-element */
  selectElementContents = (el) => {
    let range = document.createRange();
    range.selectNodeContents(el);
    let sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  insertTitle = (gEl, title, x, y, d) => {
    let _self=this;
    let words = title.split(/\s+/g),
        nwords = words.length;
    d3.select("#txt-"+d.id).remove();
    //if(d3.select("#label-"+d.id).empty()) {
    let el = gEl.append("text")
        .attr("id", "txt-"+d.id)
    let tspans = Math.floor(title.length / 20);
    for (let i = 0; i <= tspans; i++) {
      let dy=(i > 0 ? '15' : '60')
      let titleToDisplay = title.substring((i * 20), ((i+1) * 20));
      titleToDisplay = ((title.length - titleToDisplay.length) <=5) ? title : titleToDisplay;
      let tspan = el.append('tspan')
        .text(titleToDisplay)
        .attr("id", "label-"+d.id)
        .attr("text-anchor", "middle")
        .attr('x', '20')
        .attr('dy', dy);

      if(titleToDisplay.length == title.length) {
        break;
      }
    }
    if(d3.select("#t"+d.id).empty()) {
      if(hasEditPermission(_self.props.user)) {
        if(d.type != 'Job') {
          let hideIcon = gEl.append('text')
            .attr('font-family', 'FontAwesome')
            .attr('id', 'hide'+d.id)
            .attr('dy', 8)
            .attr('dx', 10)
            .attr('class','graph-icon hide-graph-icon')
            .on("click", function(d) {
              d3.event.stopPropagation();
              _self.hideNode(d, gEl);
            })
            .text(function(node) { return '\uf070' })
        }

        let deleteIcon = gEl.append('text')
          .attr('font-family', 'FontAwesome')
          .attr('id', 't'+d.id)
          .attr('dy', 8)
          .attr('dx', 25)
          .attr('class','graph-icon hide-graph-icon')
          .on("click", function(d) {
            d3.event.stopPropagation();
            _self.deleteNode(d, gEl);
          })
          .text(function(node) { return '\uf1f8' })
      }
    }

  }

  addScheduleIcon = (gEl, d) => {
    if(d.type == 'Job' ) {
      let scheduleIcon = gEl.append('text')
        .attr('font-family', 'FontAwesome')
        .attr('id', 'schedulerType'+d.id)
        .attr('font-size', function(d) { return '1.5em'})
        .attr('dy', 7)
        .attr('dx', -2)
        .attr('class','graph-icon');

      if(d.scheduleType == 'Time') {
        d3.select('#schedulerType'+d.id).text(function(node) { return '\uf017' });
      } else if(d.scheduleType == 'Predecessor') {
        d3.select('#schedulerType'+d.id).text(function(node) { return '\uf0c1' });
      } else if(d.scheduleType == 'Message') {
        d3.select('#schedulerType'+d.id).text(function(node) { return '\uf086' });
      } else {
        d3.select('#schedulerType'+d.id).remove();
      }
    }
  }

  insertBgImage = (gEl, x, y, d) => {
    let _self=this, shape=[];
    switch (d.type) {      
      case 'Job':
        gEl.select(".icon").remove();
        shape = shapesData[0];
        //remove the icon for jobs as it needs to updated based on jobType        
        break;
      case 'File':
        shape = shapesData[1];
        break;
      case 'Index':
        shape = shapesData[2];
        break;
      case 'Sub-Process':
        shape = shapesData[3];
        break;
      case '':  
        shape = shapesData[0];
        break;
    }
    if(gEl.select(".icon").empty()) {      
      let imageTxt = gEl.append('text')
        .attr('font-family', 'FontAwesome')
        .attr('class', 'icon')
        .attr('font-size', function(d) { return '2em'} )
        .attr('y', 28)
        .attr('x', 8)
        //.attr('class','delete-icon hide-delete-icon')
        .text(function(node) { 
          if(node.type == 'Job') {
            return node.jobType ? jobIcons[node.jobType] : jobIcons['Job']
          } else {
            return shape.icon 
          }          
        })
    }
  }

  makeTextEditable = (d3node, d) => {
    let _self=this;
    //d3.select("#txt-"+d.id).remove();
    let d3txt = d3node.append("foreignObject")
      .attr("width", 280)
      .attr("height", 180)
      .append("xhtml:form")
        .append("input")
          .attr("value", function() {
                this.focus();
                return d.title;
            })
            .attr("style", "width: 100px;")
            .on("blur", function (d) {
              d3node.select("foreignObject").remove()
              _self.insertTitle(d3node, this.value, d.x, d.y, d);
            });
  }

  // remove edges associated with a node
  spliceLinksForNode = (node) => {
    let _self=this;
    let toSplice = this.thisGraph.edges.filter(function (l) {
        return (l.source === node || l.target === node);
    });
    toSplice.map(function (l) {
        _self.thisGraph.edges.splice(_self.thisGraph.edges.indexOf(l), 1);
    });
  }

  replaceSelectEdge = (d3Path, edgeData) => {
    d3Path.classed(this.consts.selectedClass, true);
    if (this.graphState.selectedEdge) {
        this.removeSelectFromEdge();
    }
    this.graphState.selectedEdge = edgeData;
  }

  replaceSelectNode = (d3Node, nodeData) => {
    d3Node.classed(this.consts.selectedClass, true);
    if (this.graphState.selectedNode) {
        this.removeSelectFromNode();
    }
    this.graphState.selectedNode = nodeData;
  }

  removeSelectFromNode = () => {
    let _self=this;
    this.thisGraph.circles.filter(function (cd) {
        return cd.id === _self.graphState.selectedNode.id;
    }).classed(_self.consts.selectedClass, false);
    this.graphState.selectedNode = null;
  }

  removeSelectFromEdge = () => {
    let _self=this;
    this.thisGraph.paths.filter(function (cd) {
        return cd === _self.graphState.selectedEdge;
    }).classed(_self.consts.selectedClass, false);
    this.graphState.selectedEdge = null;
  }

  pathMouseDown = (d3path, d) => {
    d3.event.stopPropagation();
    this.graphState.mouseDownLink = d;
    if (this.graphState.selectedNode) {
        this.removeSelectFromNode();
    }

    let prevEdge = this.graphState.selectedEdge;
    if (!prevEdge || prevEdge !== d) {
        this.replaceSelectEdge(d3path, d);
    } else {
        this.removeSelectFromEdge();
    }
  }

  // mousedown on node
  circleMouseDown = (d3node, d) => {
    d3.event.stopPropagation();
    this.graphState.mouseDownNode = d;
    if (d3.event.shiftKey) {
      this.graphState.shiftNodeDrag = true;
      // reposition dragged directed edge
      this.thisGraph.dragLine.classed('hidden', false)
          .attr('d', 'M' + (d.x + 40) + ',' + (d.y + 20) + 'L' + (d.x + 35) + ',' + d.y);
      return;
    } else {
      this.graphState.shiftNodeDrag = false;
    }
  }

  dragEnd = (d3node, d) => {
    let _self=this;
    // reset the this.graphStates
    _self.graphState.shiftNodeDrag = false;
    //revert stroke-width after drag-drop
    d3.selectAll('.node rect').each(function(d) {
      d3.select(this).attr('stroke-width', "3")
    })

    d3node.classed(_self.consts.connectClass, false);

    let mouseDownNode = _self.graphState.mouseDownNode;
    let mouseEnterNode = _self.graphState.mouseEnterNode;

    _self.thisGraph.dragLine.classed("hidden", true);

    if (!mouseDownNode || !mouseEnterNode) return;

    if (mouseDownNode !== d) {
        // we're in a different node: create new edge for mousedown edge and add to graph
        let newEdge = {source: mouseDownNode, target: d};
        let filtRes = _self.thisGraph.paths.filter(function (d) {
            if (d.source === newEdge.target && d.target === newEdge.source) {
                _self.thisGraph.edges.splice(_self.thisGraph.edges.indexOf(d), 1);
            }
            return d.source === newEdge.source && d.target === newEdge.target;
        });
        if (!filtRes || !filtRes[0] || !filtRes[0].length) {
            _self.thisGraph.edges.push(newEdge);
            _self.updateGraph();
        }
    }

    _self.graphState.mouseDownNode = null;
    _self.graphState.mouseEnterNode = null;
    return;
  }

  // mouseup on nodes
  circleMouseUp = (d3node, d) => {
    // reset the this.graphStates
    //this.graphState.shiftNodeDrag = false;
    d3node.classed(this.consts.connectClass, false);
    if (this.graphState.selectedEdge) {
        this.removeSelectFromEdge();
    }

    let prevNode = this.graphState.selectedNode;
    if (!prevNode || prevNode.id !== d.id) {
        this.replaceSelectNode(d3node, d);
    } else {
        this.removeSelectFromNode();
    }

  } // end of circles mouseup

  // mousedown on main svg
  svgMouseDown = () => {
    this.graphState.graphMouseDown = true;
  }

  // mouseup on main svg
  svgMouseUp = () => {
    if (this.graphState.justScaleTransGraph) {
        // dragged not clicked
        this.graphState.justScaleTransGraph = false;
    } else if (this.graphState.graphMouseDown && d3.event.shiftKey) {
        // clicked not dragged from svg
        let xycoords = d3.mouse(this.thisGraph.svgG.node()),
            d = {id: this.graphState.idct++, title: "Title", x: xycoords[0], y: xycoords[1]};
        this.thisGraph.nodes.push(d);
        this.updateGraph();
    } else if (this.graphState.shiftNodeDrag) {
        // dragged from node
        this.graphState.shiftNodeDrag = false;
        this.thisGraph.dragLine.classed("hidden", true);
    }
    this.graphState.graphMouseDown = false;
  }

  // keydown on main svg
  svgKeyDown = () => {
    if(!hasEditPermission(this.props.user)) return;
    let _self=this;
    // make sure repeated key presses don't register for each keydown
    if (_self.graphState.lastKeyDown !== -1) return;

    _self.graphState.lastKeyDown = d3.event.keyCode;
    let selectedNode = _self.graphState.selectedNode,
        selectedEdge = _self.graphState.selectedEdge;

    switch (d3.event.keyCode) {
      case _self.consts.BACKSPACE_KEY:
      case _self.consts.DELETE_KEY:
        d3.event.preventDefault();
        if (selectedNode) {
          _self.thisGraph.nodes.splice(_self.thisGraph.nodes.indexOf(selectedNode), 1);
          _self.spliceLinksForNode(selectedNode);
          _self.graphState.selectedNode = null;
          _self.deleteNode(selectedNode);
          _self.updateGraph();
        } else if (selectedEdge) {
          _self.thisGraph.edges.splice(_self.thisGraph.edges.indexOf(selectedEdge), 1);
          _self.graphState.selectedEdge = null;
          _self.updateGraph();
          _self.saveGraph()
        }
        break;
    }
  }

  svgKeyUp = () => {
    this.graphState.lastKeyDown = -1;
  }

  zoomed = () => {
    this.graphState.justScaleTransGraph = true;
    d3.select("." + this.consts.graphClass).attr("transform", d3.event.transform);
    this.graphState.zoomTransform = d3.event.transform;
  }

  setIdCt = (idct) => {
    this.graphState.idct = idct;
  }

  // call to propagate changes to graph
  updateGraph = () => {
    let _self=this;
    _self.thisGraph.paths = _self.thisGraph.paths.data(_self.thisGraph.edges, function (d) {
      if(d.source && d.target) {
        return String(d.source.id) + "+" + String(d.target.id);
      }
    });
    let paths = _self.thisGraph.paths;
    // update existing paths
    paths.style('marker-end', 'url(#end-arrow)')
        .style("stroke", function(d, i) { return '#d3d3d3' })
        .attr("d", function (d) {
            if(d.source && d.target) {
              return "M" + (d.source.x + 19) + "," + (d.source.y + 19) + "L" + (d.target.x +19) + "," + (d.target.y + 19);
            }
        });

    // remove old links
    paths.exit().remove();

    // add new paths
    paths = paths.enter()
      .append("path")
      .style("stroke", function(d, i) { return '#d3d3d3' })
      .style('marker-end', 'url(#end-arrow)')
      .classed("link", true)
      .attr("d", function (d, i) {
        if(d.source && d.target) {
          //19 = half of rectwidth/rectheight
          //return "M" + (d.source.x + 35) + "," + (d.source.y + 20) + "L" + (d.target.x + 35)  + "," + (d.target.y + 15);
          return "M" + (d.source.x + 19) + "," + (d.source.y + 19) + "L" + (d.target.x + (19))  + "," + (d.target.y + (19));
        }
      })
      .merge(paths)
      .on("mouseover", function (d) {
        d3.select(this).style('stroke', 'black');
      })
      .on("mouseout", function (d) {
        d3.select(this).style('stroke', '#d3d3d3');
      })
      .on("mouseup", function (d) {
          // graphState.mouseDownLink = null;
      })
      .on("mousedown", function (d) {
        _self.pathMouseDown(d3.select(this), d);
      });
    _self.thisGraph.paths = paths;

    // update existing nodes
    _self.thisGraph.circles = _self.thisGraph.circles.data(_self.thisGraph.nodes, function (d) {
        return d.id;
    });

    // remove old nodes
    _self.thisGraph.circles.exit().remove();

    _self.thisGraph.circles.attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
    });

    // add new nodes
    let newGs = _self.thisGraph.circles.enter()
      .append("g").merge(_self.thisGraph.circles);

    newGs.classed(_self.consts.circleGClass, true)
      .attr("transform", function (d) {
          return "translate(" + (d.x) + "," + (d.y) + ")";
      })
      .on("mouseover", function (d) {
          _self.graphState.mouseEnterNode = d;
          if (_self.graphState.shiftNodeDrag) {
              d3.select(this).classed(_self.consts.connectClass, true);
          }
          _self.toggleDeleteIcon(d3.select(this), d);
      })
      .on("mouseout", function (d) {
          _self.graphState.mouseEnterNode = null;
          d3.select(this).classed(_self.consts.connectClass, false);
          _self.toggleDeleteIcon(d3.select(this), d);
      })
      .on("mousedown", function (d) {
          _self.circleMouseDown(d3.select(this), d);
      })
      .call(_self.thisGraph.drag)
      .on("click", function (d) {
          _self.circleMouseUp(d3.select(this), d);
          _self.showNodeDetails(d);
          //_self.makeTextEditable(d3.select(this), d)
      }).on("dblclick", function (d) {
          _self.setState({
            currentlyEditingId: d.id,
            currentlyEditingNode: d
          });

          _self.openDetailsDialog(d);
      });

      _self.thisGraph.circles = newGs;
      let childNodes = 0;
      newGs.each(function(d) {
        //if (this.childNodes.length === 0) {
          switch(d.type) {
            case 'Job':
              if(d3.select("#rec-"+d.id).empty()) {
                d3.select(this)
                  .append("rect")
                  .attr("id", "rec-"+d.id)
                  .attr("rx", shapesData[0].rx)
                  .attr("ry", shapesData[0].ry)
                  .attr("width", shapesData[0].rectwidth)
                  .attr("height", shapesData[0].rectheight)
                  .attr("stroke", "grey")
                  .attr("fill", shapesData[0].color)
                  .attr("stroke-width", "3")
                  .attr("filter", "url(#glow)")
                  //.call(_self.nodeDragHandler)
                _self.insertBgImage(d3.select(this), d.x, d.y, d);
                _self.insertTitle(d3.select(this), d.title, d.x, d.y, d);
                if(d.hasOwnProperty('isHidden') && d.isHidden) {
                  d3.select(d3.select("#rec-"+d.id).node().parentNode).attr("class", "d-none")
                }
              } else {
                _self.insertBgImage(d3.select(this), d.x, d.y, d);
              }
              _self.addScheduleIcon(d3.select(this), d);
              break;

            case 'File':
            case 'Index':
              //d3.select(this).append("rect").attr("id", "xxxxx"+d.id)
              if(d3.select("#rec-"+d.id).empty()) {
                let el = d3.select(this)
                  .append("rect")
                  .attr("id", "rec-"+d.id)
                  .attr("rx", shapesData[2].rx)
                  .attr("ry", shapesData[2].ry)
                  .attr("width", shapesData[2].rectwidth)
                  .attr("height", shapesData[2].rectheight)
                  .attr("stroke", "grey")
                  .attr("filter", "url(#glow)")
                  .attr("fill", function(d) {
                    if(d.type == 'File')
                     return shapesData[1].color;
                    else if(d.type == 'Index')
                      return shapesData[2].color;
                  })
                  .attr("stroke-width", "3")
                  //.call(_self.nodeDragHandler)
                  _self.insertBgImage(d3.select(this), d.x, d.y, d);
                  _self.insertTitle(d3.select(this), d.title, d.x, d.y, d);
                  if(d.hasOwnProperty('isHidden') && d.isHidden) {
                    d3.select(d3.select("#rec-"+d.id).node().parentNode).attr("class", "d-none")
                  }
              }

              break;
            case 'Sub-Process':
              if(d3.select("#rec-"+d.id).empty()) {
                d3.select(this)
                  .append("rect")
                  .text(function(d, i) {
                    return "Helloooooo";
                  })
                  .attr("id", "rec-"+d.id)
                  .attr("rx", shapesData[3].rx)
                  .attr("ry", shapesData[3].ry)
                  .attr("width", shapesData[3].rectwidth)
                  .attr("height", shapesData[3].rectheight)
                  .attr("stroke", "grey")
                  .attr("fill", shapesData[3].color)
                  .attr("stroke-width", "3")
                  .attr("filter", "url(#glow)")
                  //.call(_self.nodeDragHandler)
                }

              _self.insertBgImage(d3.select(this), d.x, d.y, d);
              _self.insertTitle(d3.select(this), d.title, d.x, d.y, d);
              if(d.hasOwnProperty('isHidden') && d.isHidden) {
                d3.select(d3.select("#rec-"+d.id).node().parentNode).attr("class", "d-none")
              }

              break;
          }

      });
      //_self.saveGraph()
  }

  toggleDeleteIcon = (node, d) => {
    if(!this.props.viewMode && hasEditPermission(this.props.user)) {
      if(d3.select("#t"+d.id).classed("hide-graph-icon")) {
        d3.select("#t"+d.id).classed("hide-graph-icon", false)
      } else {
        d3.select("#t"+d.id).classed("hide-graph-icon", true)
      }
      if(!d3.select("#hide"+d.id).empty() && d3.select("#hide"+d.id).classed("hide-graph-icon")) {
        d3.select("#hide"+d.id).classed("hide-graph-icon", false)
      } else {
        d3.select("#hide"+d.id).classed("hide-graph-icon", true)
      }
    }
  }



  deleteNode = (d, gEl) => {
   const  handleOK = () => {
      let _self=this;
      switch(d.type) {
        case 'File':
          updateGraph((d.fileId ? d.fileId : d.id), _self.props.applicationId, _self.props.selectedDataflow).then(async (response) => {
            await _self.fetchSavedGraph();
          });
          break;
        case 'Index':
          updateGraph((d.indexId ? d.indexId : d.id), _self.props.applicationId, _self.props.selectedDataflow).then(async (response) => {
            await _self.fetchSavedGraph();
          });
          break;
        case 'Job':
        case 'Modeling':
        case 'Scoring':
        case 'Query Build':
        case 'ETL':
        case 'Data Profile':
          updateGraph((d.jobId ? d.jobId : d.id), _self.props.applicationId, _self.props.selectedDataflow).then(async (response) => {
            await _self.fetchSavedGraph();
          });
          break;
        case 'Sub-Process':
          /*if(d.subProcessId) {
            handleSubProcessDelete(d.subProcessId, _self.props.applicationId);
          }*/
          updateGraph((d.subProcessId ? d.subProcessId : d.id), _self.props.applicationId, _self.props.selectedDataflow).then(async (response) => {
            await _self.fetchSavedGraph();
          });
          break;
      }
      if(gEl) {
        gEl.remove();
      }
    }

    const handleCancel = () => {
      this.setState({deleteNode: false})
      return;
    }

    Modal.confirm({
      icon: <ExclamationCircleOutlined style={{color: "red"}} />,
      title: `Do you really want to remove this ${d.type } ?`,
      okText: 'Yes',
      cancelText: 'No',
      okButtonProps: {type: 'danger'},
      cancelButtonProps: {type: 'primary'},
      onOk(){
        handleOK();
      },
      onCancel() {
        handleCancel();
      }
    });
  }

  hideNode = (d, gEl) => {
    if(gEl) {
      //gEl.remove();
      gEl.attr("class", "d-none")
    }
    changeVisibility((d.fileId ? d.fileId : d.id), this.props.applicationId, this.props.selectedDataflow, true).then(async (response) => {
      await this.fetchSavedGraph();
    });
  }

  showNodeDetails = (d) => {
    if(this.props.viewMode) {
      this.props.dispatch(assetsActions.assetSelected(
        d.jobId,
        this.props.applicationId,
        ''
      ));


      /*let taskDetails = this.getTaskDetails();
      let tasks = taskDetails.filter((task) => {
        return task.id == "rec-"+d.id
      })
      if(tasks[0]) {
        this.setState({
          nodeDetailsVisible: true,
          nodeDetailStatus: tasks[0].status,
          nodeDetailMessage: tasks[0].message,
          wuid: tasks[0].wuid,
          wu_start: tasks[0].wu_start,
          wu_end: tasks[0].wu_end,
          wu_duration: tasks[0].wu_duration
        });
      }*/
    }
  }

  closeNodeDetails = () => {
    this.setState({
      nodeDetailsVisible: false
    });
  }

  nodeDragHandler = () => {
   return d3.drag()
      .on("drag", function (d) {
      })
      .on("end", function(d){
      })
  }

  collapseNav = () => {
    $('#'+this.props.sidebarContainer).toggleClass('active');
  }

  addFile = () => {
    let _self = this;
    _self.thisGraph.nodes.push({"title":"new file","id":0,"x":475,"y":100})
    _self.setIdCt(_self.graphState.idct++);
    _self.updateGraph();
  }

  loadGraphComponents = () => {
    let _self=this;
    var margin = {top: 10, right: 10, bottom: 30, left: 10};
    /** MAIN SVG **/
    let docEl = document.documentElement,
        bodyEl = document.getElementById('body');

    let svg = d3.select('#'+this.props.graphContainer).append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", svgViewBox);

    _self.thisGraph.nodes = [];
    _self.thisGraph.edges = [];


    /*let graphComponentsSvg = d3.select('#'+this.props.sidebarContainer).append("svg")
      .attr("width", 100)
      .attr("height", "100%");*/

    d3.select('.graph-div').select("svg").attr("transform",
          "translate(" + margin.left + "," + margin.top + ")")

    //add icons to sidebar
    if(!this.props.viewMode) {
      //border (rect) for main workflow area
      svg.append('rect')
        .attr('x', 90)
        .attr('y', 0)
        .attr('width', svgUsableWidth)
        .attr('height', svgUsableHeight)
        .attr('stroke', '#17a2b8')
        .attr('fill', '#ffff');

      var group = svg.selectAll('g')
      .data(shapesData)
      .enter().append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")")
      .attr("class","pallette-nodes");

      group.append("rect")
        .attr("x", function(d) { return d.rectx; })
        .attr("y", function(d) { return d.recty; })
        .attr("rx", function(d) { return d.rx; })
        .attr("ry", function(d) { return d.ry; })
        .attr("width", function(d) { return d.rectwidth; })
        .attr("height", function(d) { return d.rectheight; })
        .attr("stroke", "grey")
        .attr("fill", function(d) { return d.color; })
        .attr("stroke-width", "3")
        .attr("filter", "url(#glow)")
        .append("svg:title")
          .text(function(d, i) { return d.description });

      group.append("text")
        .attr('font-family', 'FontAwesome')
        .attr('font-size', function(d) { return '2em'} )
        .attr("x", function(d) { return d.tx; })
        .attr("y", function(d) { return d.ty; })
        .text( function (d) { return d.icon; })

      group.append("text")
        .attr("x", function(d) { return parseInt(d.tx) + 15; })
        .attr("y", function(d) { return parseInt(d.ty) + 25; })
        .attr("class", "entity")
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "middle")
        .text( function (d) { return d.title; })

      var palletteDragHandler = d3.drag()
      .on("drag", function (d) {
        return {"tx": d3.mouse(this)[0], "ty": d3.mouse(this)[1] , "rx": d3.mouse(this)[0], "ry": d3.mouse(this)[1]};
      })
      .on("end", function(d){
        if((_self.props.selectedDataflow == undefined || _self.props.selectedDataflow == '')) {
          message.config({top:130})
          message.warning({
            content: 'Please create a Dataflow by clicking on \'Add Dataflow\' button, before you can start using the Dataflow designer',
          });
          return;
        }

        let idct = ++_self.graphState.idct;
        let newNodeId = idct+Math.floor(Date.now());

        //let x = (mouseCoordinates[0] < 60) ? 60 : mouseCoordinates[0] - 150 : mouseCoordinates[0] > 1300 ? 1300 : mouseCoordinates[0];
        var mouseCoordinates = d3.mouse(this);         // relative to specified container
        let x = mouseCoordinates[0] > 1500 ? 1500 : mouseCoordinates[0] < 40 ? 40 : mouseCoordinates[0]
        let y = mouseCoordinates[1] > 720 ? 720 : mouseCoordinates[1] < 0 ? 0 : mouseCoordinates[1]

        if(_self.graphState.zoomTransform) {
          let inverted = _self.graphState.zoomTransform.invert(mouseCoordinates);
          x = inverted[0] - 10;
          y = inverted[1];
        } else {
          x = x - 10;
          y = y;
        }

        //95 = width of sidebar, 50 = height of tabs+breadcrumb etc
        _self.thisGraph.nodes.push({"title":"New "+d3.select(this).select("text.entity").text(),"id":newNodeId,"x":x,"y":y, "type":d3.select(this).select("text.entity").text(), "jobType": "Job"})
        _self.setIdCt(idct);
        _self.updateGraph();
      })
    }

    //tooltips
    var div = d3.select("body").append("div") .attr("class", "tooltip").style("opacity", 0);
    svg.selectAll('g.pallette-nodes').on("mouseover", function(d) {
      div.transition()
        .duration(200)
        .style("opacity", .9);
      div .html(d.description)
        .style("left", (d3.event.pageX + 25) + "px")
        .style("top", (d3.event.pageY - 20) + "px");
    })

    svg.selectAll('g').on("mouseout", function(d) {
      div.transition()
        .duration(500)
        .style("opacity", 0);
    });

    //disable dragging on left nav
    if(hasEditPermission(_self.props.user) && !this.props.viewMode) {
      palletteDragHandler(svg.selectAll("g.pallette-nodes"));
    }

    // define arrow markers for graph links
    appendDefs(svg);

    _self.thisGraph.svg = svg;
    _self.thisGraph.svgG = svg.append("g").classed(_self.consts.graphClass, true);
    let svgG = _self.thisGraph.svgG;

    // displayed when dragging between nodes
    _self.thisGraph.dragLine = svgG.append('svg:path')
        .attr('class', 'link dragline hidden')
        .attr('d', 'M0,0L0,0')
        .style('marker-end', 'url(#mark-end-arrow)');
    // svg nodes and edges
    _self.thisGraph.paths = svgG.append("g").selectAll("g");
    _self.thisGraph.circles = svgG.append("g").selectAll("g");

    //draging behaviour within the main svg area
    _self.thisGraph.drag = d3.drag()
    .subject(function (d) {
      return {x: d.x, y: d.y};
    })
    .on("drag", hasEditPermission(_self.props.user) ? function (d) {
      _self.graphState.justDragged = true;
      _self.dragmove(d);
      if(_self.graphState.mouseDownNode) {
        d3.select('.node.connect-node rect').attr('stroke-width', "8")
      }
      //d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
    } : null)
    .on("end", hasEditPermission(_self.props.user) ? function (d) {
      // todo check if edge-mode is selected
      var mouse = d3.mouse(this);
      var elem = document.elementFromPoint(mouse[0], mouse[1]);
      if (_self.graphState.justDragged === true) {
        (function() {
          return new Promise((resolve) => {
            _self.updateGraph();
            resolve();
          })
        })().then(() => {
          _self.saveGraph();
        });
      }
      _self.graphState.justDragged = false;
      if (_self.graphState.shiftNodeDrag) {
          _self.dragEnd(d3.select(this), _self.graphState.mouseEnterNode);
      }

    } : null);

    // listen for key events
    d3.select('#graph').on("keydown", function () {
      _self.svgKeyDown(_self.thisGraph);
    })
    .on("keyup", function () {
      _self.svgKeyUp(_self.thisGraph);
    });
    svg.on("mousedown", function (d) {
      _self.svgMouseDown(_self.thisGraph, d);
      if (d3.event.shiftKey) {
          d3.event.stopImmediatePropagation();
      }
    });
    svg.on("mouseup", function (d) {
      _self.svgMouseUp(_self.thisGraph, d);
    })
    svg.on("click", function() {
    });

    // listen for dragging
    let dragSvg = d3.zoom()
      .scaleExtent([0.25, 2])
      .on("zoom", hasEditPermission(_self.props.user) ? function () {
        if (d3.event.sourceEvent.shiftKey) {
            // TODO  the internal d3 this.graphState is still changing
            return false;
        } else {
            _self.zoomed(_self.thisGraph);
        }
        return true;
      } : null)
      .on("start", hasEditPermission(_self.props.user) ? function () {
        var ael = d3.select("#" + _self.consts.activeEditId).node();
        if (ael) {
            ael.blur();
        }
        if (!d3.event.sourceEvent.shiftKey) d3.select('body').style("cursor", "move");
      } : null)
      .on("end", hasEditPermission(_self.props.user) ? function () {
        d3.select('body').style("cursor", "auto");
      } : null);

      svg.call(dragSvg).on("dblclick.zoom", null);

      // listen for resize
      window.onresize = function () {
        _self.updateWindow(svg);
      };

  }

  showNode = (evt) => {
    if(evt.key != 'all') {
      let rec = d3.select('#rec-'+evt.key).node();
      if(rec) {
        let gEl = d3.select(d3.select('#rec-'+evt.key).node().parentNode);
        gEl.classed("d-none", false);
        changeVisibility(evt.key, this.props.applicationId, this.props.selectedDataflow, false).then(async (response) => {
          await this.fetchSavedGraph();
        });
      }
    } else {
      this.thisGraph.nodes.forEach((node) => {
        if(node.isHidden) {
          let gEl = d3.select(d3.select('#rec-'+node.id).node().parentNode);
          gEl.classed("d-none", false);
        }
      })
      changeVisibility('', this.props.applicationId, this.props.selectedDataflow, false).then(async (response) => {
        await this.fetchSavedGraph();
      });
    }
  }

  hiddenAssetsMenu = () => {
    if(this.thisGraph.nodes) {
      const menu = this.thisGraph.nodes.map((node, idx) => {
         if(node.isHidden) {
           return <Menu.Item key={node.id} icon={<EyeOutlined />} onClick={this.showNode}>{node.title}</Menu.Item>
          }
      })
      menu.push(<Menu.ItemGroup><Menu.Item key={"all"} onClick={this.showNode}>Show All</Menu.Item></Menu.ItemGroup >);
      return <Menu>{menu}</Menu>
    } else {
      return null
    }
  }

  refreshGraph = () => {
    let _self=this;
    _self.setState({
      loading: true
    });
    fetch('/api/job/refreshDataflow', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({
        application_id: this.props.applicationId,
        dataflowId: this.props.selectedDataflow.id
      })
    }).then(function(response) {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    }).then(async function(data) {
      console.log('Refreshed graph..');
      await _self.fetchSavedGraph();
      _self.setState({
        loading: false
      });

    });
  }


  render() {
    const {nodeDetailStatus, nodes} = this.state;
    const pStyle = {
      fontSize: 16,
      color: 'rgba(0,0,0,0.85)',
      lineHeight: '24px',
      display: 'block',
      marginBottom: 16,
    };

    const getBadgeForStatus = () => {
      switch (nodeDetailStatus) {
        case 'running':
          return <Badge status="processing" text="Processing" />;
        case 'wait':
          return <Badge status="default" text='Wait' />;
        case 'completed':
          return <Badge status="success" text='Completed' />;
        case 'failed':
          return <Badge status="error" text='Failed' />;
        default:
          return <Badge status="warning" text='Warning' />;
      }
    }

    const editingAllowed = hasEditPermission(this.props.user);
  return (
      <React.Fragment>
        <div className="graph-div">
          <div className="graph-btns-container" style={{"left":svgUsableWidth - 300}}>
            <span >
              <Tooltip placement="topRight" title={"Refresh will validate the file/job relationship and update graph accordingly"}   >
                <Button 
                style={{ float: 'right', display : "flex", placeItems: "center", paddingBottom: "14px" }} 
                className="refresh-btn"
                  onClick={this.refreshGraph}
                  icon={
                  <ReloadOutlined
                    style={{
                      fontSize: '20px',
                      backgroundColor: '#f0f0f0',
                      marginRight: "30px" 
                    }}
                  />
                }/>
              </Tooltip>
            </span>
            {nodes.filter(node => node.isHidden).length > 0 ?
            <span>
              <Tooltip placement="topRight" title={"Show hidden assets in the Workflow"}>
              <Dropdown.Button className="dropdown-btn" overlay={this.hiddenAssetsMenu}
                icon={
                  <EyeInvisibleOutlined
                    style={{
                      fontSize: '28px',
                      backgroundColor: '#f0f0f0',
                    }}
                  />
                }
              />
              </Tooltip>
            </span> : null}
          </div>

          <div id={this.props.graphContainer} className={(!editingAllowed || this.props.viewMode) ? " readonly graph-view-mode" : "graph-edit-mode"} tabIndex="-1">
            <div className={this.state.loading ? "graph-overlay" : "graph-overlay d-none"}></div>
            <Spin spinning={this.state.loading} className="graph-loading" size="large" />
          </div> 
        </div>

      {this.state.openFileDetailsDialog ?
        <AssetDetailsDialog 
          assetType="file"
          assetId={this.state.selectedFile} 
          fileId={this.props.selectedFile} 
          nodes={this.thisGraph.nodes}
          selectedAsset={this.state.selectedFile} 
          title=  {this.state.selectedAssetTitle}
          application={this.props.application} 
          user={this.props.user} 
          handleClose={this.handleClose}
        />
      : null }

      {this.state.openJobDetailsDialog ?
        <AssetDetailsDialog
          assetType="job"
          assetId={this.state.selectedJob}
          nodes={this.thisGraph.nodes}
          edges={this.thisGraph.edges}
          nodeIndex={this.state.currentlyEditingNode ? this.state.currentlyEditingNode.id : ''}
          selectedAsset={this.state.selectedJob}
          title=  {this.state.selectedAssetTitle}
          selectedDataflow={this.state.selectedDataflow}
          application={this.props.application}
          user={this.props.user}
          handleClose={this.closeJobDlg}
        />
      : null}

      {this.state.openIndexDetailsDialog ?
        <AssetDetailsDialog 
          assetType="index" 
          assetId={this.state.selectedIndex} 
          nodes={this.thisGraph.nodes}
          selectedAsset={this.state.selectedIndex} 
          title=  {this.state.selectedAssetTitle}
          application={this.props.application} 
          user={this.props.user} 
          handleClose={this.closeIndexDlg}/>
        : null}

        <Modal
          height={300}
          placement="top"
          closable={true}
          onClose={this.closeNodeDetails}
          onCancel={this.closeNodeDetails}
          visible={this.state.nodeDetailsVisible}
          title="Job Info"
          footer={[
            <Button onClick={this.closeNodeDetails}>
              Close
            </Button>
          ]}
        >
            <Descriptions title="Job Info" bordered size="middle">
              <Descriptions.Item label="Status" span={3}>
                {getBadgeForStatus()}
              </Descriptions.Item>
              {this.props.workflowDetails ?
                <Descriptions.Item label="Workunit Id" span={3}><a href={this.props.workflowDetails.cluster + "/?Wuid="+this.state.wuid+"&Widget=WUDetailsWidget"}>{this.state.wuid}</a></Descriptions.Item>
                : null}
              <Descriptions.Item label="Start Time" span={3}>{this.state.wu_start}</Descriptions.Item>
              <Descriptions.Item label="End Time" span={3}>{this.state.wu_end}</Descriptions.Item>
              <Descriptions.Item label="Duration" span={3}>{this.state.wu_duration}</Descriptions.Item>+ "/?Wuid="+record.wuid+"&Widget=WUDetailsWidget"
              <Descriptions.Item label="Message" span={3}>{this.state.nodeDetailMessage ? <span className="messages-span">  {JSON.parse(this.state.nodeDetailMessage).map(message => <li>{message.Message}</li>)}</span>  : ''}</Descriptions.Item>
            </Descriptions>

        </Modal>
        {this.state.showSubProcessDetails ?         
          <SubProcessDialog
            show={this.state.showSubProcessDetails}
            applicationId={this.props.applicationId}
            selectedParentDataflow={this.props.selectedDataflow}
            onRefresh={this.onFileAdded}
            selectedSubProcess={this.state.selectedSubProcess}
            nodeId={this.state.currentlyEditingId}/> : null}
        {this.state.showAssetListDlg ?
          <ExistingAssetListDialog
            show={this.state.showAssetListDlg}
            applicationId={this.props.applicationId}
            selectedDataflow={this.props.selectedDataflow}
            assetType={this.state.currentlyEditingNode.type}
            onClose={this.closeAssetListDlg}
            onFileAdded={this.onFileAdded}
            user={this.props.user} 
            currentlyEditingNodeId={this.state.currentlyEditingId}/>  : null}


    </React.Fragment>
  )
  }

}

function mapStateToProps(state) {
  const { user } = state.authenticationReducer;
  const { application, selectedTopNav } = state.applicationReducer;
  const { selectedAsset, saveResponse } = state.assetReducer;
  return {
      user,
      application,
      selectedTopNav,
      selectedAsset,
      saveResponse
  };
}
const connectedGraph = connect(mapStateToProps)((withRouter(Graph)));
export { connectedGraph as Graph };

//export default Graph;
