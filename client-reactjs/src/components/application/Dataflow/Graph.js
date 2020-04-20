import React, { Component } from "react";
import * as d3 from "d3";
import '../../graph-creator/graph-creator.css';
import $ from 'jquery';
import { Button, Icon, Drawer, Row, Col, Descriptions} from 'antd/lib';
import { Typography } from 'antd';
import FileDetailsForm from "../FileDetails";
import JobDetailsForm from "../JobDetails";
import IndexDetailsForm from "../IndexDetails";
import {handleFileDelete, handleJobDelete, handleIndexDelete, handleQueryDelete, updateGraph} from "../../common/WorkflowUtil";
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { connect } from 'react-redux';
const { Text } = Typography;

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
    selectedNodeId: '',
    selectedIndex: '',
    isNew:false,
    selectedJob: '',
    selectedJobType: '',
    isNewJob:false,
    isNewIndex:false,
    currentlyEditingId:'',
    applicationId: '',
    nodeDetailsVisible: false,
    nodeDetailStatus: '',
    nodeDetailMessage: '',
    selectedDataflow:{}
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
      idct: 0
  };

  shapesData = [
      { "x": "10", "y": "20", "rx":"0", "ry":"0", "rectx":"10", "recty":"10", "rectwidth":"55", "rectheight":"55", "tx":"20", "ty":"50", "title":"Job", "color":"#EE7423", "icon":"\uf085", "iconx":"90", "icony":"25"},
      { "x": "10", "y": "70", "rx":"0", "ry":"0", "rectx":"10", "recty":"90", "rectwidth":"55", "rectheight":"55", "tx":"20", "ty":"130", "title":"Modeling", "color":"#EE7423", "icon":"\uf00a", "iconx":"90", "icony":"65"},
      { "x": "10", "y": "120", "rx":"0", "ry":"0", "rectx":"10", "recty":"170", "rectwidth":"55", "rectheight":"55", "tx":"20", "ty":"210", "title":"Scoring", "color":"#EE7423", "icon":"\uf005 ", "iconx":"90", "icony":"65"},            
      { "x": "10", "y": "170", "rx":"10", "ry":"10", "rectx":"10", "recty":"250", "rectwidth":"55", "rectheight":"55", "tx":"20", "ty":"290", "title":"File", "color":"#7AAAD0", "icon":"\uf1c0", "iconx":"90", "icony":"65"},
      //{ "x": "10", "y": "120", "rx":"10", "ry":"10", "rectx":"10", "recty":"170", "rectwidth":"55", "rectheight":"55", "tx":"20", "ty":"210", "title":"Query", "color":"#9B6A97", "icon":"\uf00e", "iconx":"90", "icony":"65"},
      { "x": "10", "y": "220", "rx":"10", "ry":"10", "rectx":"10", "recty":"330", "rectwidth":"55", "rectheight":"55", "tx":"20", "ty":"370", "title":"Index", "color":"#7DC470", "icon":"\uf2b9", "iconx":"90", "icony":"65"},
    ];

  thisGraph = {};

  componentDidMount() {
    this.loadGraphComponents();
    this.fetchSavedGraph();
    document.addEventListener('mousedown', this.handleClickOutside);
  }
  componentWillReceiveProps(props) {
    
    if(this.state.applicationId != props.application.applicationId || this.state.selectedDataflow != props.selectedDataflow ) {      
      this.setState({
        applicationId: props.application.applicationId,
        selectedDataflow: props.selectedDataflow
      }, function() {
        this.fetchSavedGraph();
      });

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
      //alert('You clicked insider of me!');
    }
    //this.saveGraph();
  }

  openDetailsDialog(d) {
    let _self=this;
    let isNew = false;
    switch(d.type) {
      case 'File':        
        if(d.fileId == undefined || d.fileId == '') {
          isNew = true
        }
        this.setState({
          isNew: isNew,
          openFileDetailsDialog: true,
          selectedFile: d.fileId,
          selectedNodeId: d.id
        });

        setTimeout(() => {
          _self.fileDlg.showModal();
        }, 200);

        break;
      case 'Job':
      case 'Modeling':
      case 'Scoring':
        if(d.jobId == undefined || d.jobId == '') {
          isNew = true
        }
        console.log(isNew + '-' + d.jobId);
        this.setState({
          isNewJob: isNew,
          openJobDetailsDialog: true,
          selectedJob: d.jobId,
          selectedJobType: d.type == 'Job' ? 'ETL' : d.type
        });

        setTimeout(() => {
          _self.jobDlg.showModal();
        }, 200);
        break;
      case 'Index':
        let isNewIndex = false;
        if(d.indexId == undefined || d.indexId == '') {
          isNewIndex = true
        }
        this.setState({
          isNewIndex: isNewIndex,
          openIndexDetailsDialog: true,
          selectedIndex: d.indexId
        });

        setTimeout(() => {
          _self.idxDlg.showModal();
        }, 200);
        break;
   }
  }

  updateCompletionStatus = () => {
    if(this.props.workflowDetails) {
      let completedTasks = this.getTaskDetails()
      d3.selectAll('.node')
      .each(function(d) {
        let task = completedTasks.filter((task) => {
          return task.id == d3.select(this).select('rect').attr("id")
        })
        if(task && task.length > 0) {
          let strokeColor = task[0].status == "Completed" ? "green" : "red"
          d3.select(this).append("text")
            .attr('font-family', 'FontAwesome')
            .attr('font-size', function(d) { return '3em'} )
            .attr('fill', strokeColor)
            .attr("x", '12')
            .attr("y", '-2')
            .text( function (d) { return '\uf058'; })
          d3.select(this).select('rect').attr("stroke", strokeColor);
          d3.select(this).select('rect').attr("stroke-width", "5");
          d3.select(this).select('rect').attr("message", task.message);
        }
      });
    }
  }

  getTaskDetails = () => {
    let completedTasks = [];
    this.props.workflowDetails.forEach((workflowDetail) => {
      let nodeObj = this.thisGraph.nodes.filter((node) => {
        return (node.fileId == workflowDetail.task || node.jobId == workflowDetail.task || node.indexId == workflowDetail.task)
      })
      completedTasks.push({"id": "rec-"+nodeObj[0].id, "status": workflowDetail.status, "message": workflowDetail.message})
    });
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

  onFileAdded = (saveResponse) => {
    var newData = this.thisGraph.nodes.map(el => {
      console.log(saveResponse);
      if(el.id == this.state.currentlyEditingId) {
        el.title=saveResponse.title;
        switch(el.type) {
          case 'File':
            el.fileId=saveResponse.fileId;
            break;
          case 'Index':
            el.indexId=saveResponse.indexId;
            break;
          case 'Job':
          case 'Modeling':
          case 'Scoring':
            el.jobId=saveResponse.jobId;
            break;
        }
        return el;
         //return Object.assign({}, el, {title:saveResponse.title, fileId:saveResponse.fileId, jobId:saveResponse.jobId, queryId:saveResponse.queryId, indexId:saveResponse.indexId})
      }
      return el
    });
    this.thisGraph.nodes = newData;
    this.updateGraph();
    this.saveGraph();
  }

  saveGraph() {
    console.log('save: '+JSON.stringify(this.props.selectedDataflow))
    let edges = [];
    this.thisGraph.edges.forEach(function (val, i) {
        edges.push({source: val.source.id, target: val.target.id});
    });
    fetch('/api/dataflowgraph/save', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({"application_id": this.props.applicationId, dataflowId: this.props.selectedDataflow.id, nodes: this.thisGraph.nodes, edges: edges})
    }).then(function(response) {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
    }).then(function(data) {
        console.log('Saved graph..');
        //_self.fetchFiles();
    });
  }

  fetchSavedGraph() {
    var _self=this, nodes = [], edges = [];
    if(this.props.selectedDataflow) {
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
        _self.setIdCt(nodes.length);
        _self.updateGraph();

        this.updateCompletionStatus();              
      }).catch(error => {
        console.log(error);
      });
    } else {
      this.clearSVG();
    }     
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
        _self.thisGraph.dragLine.attr('d', 'M' + (d.x + 40) + ',' + (d.y + 20) + 'L' + (d3.mouse(_self.thisGraph.svgG.node())[0] + 35)+ ',' + d3.mouse(_self.thisGraph.svgG.node())[1]);
    } else {
        d.x += d3.event.dx;
        d.y += d3.event.dy;
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
        let dy=(i > 0 ? '15' : '70')
        let titleToDisplay = title.substring((i * 20), ((i+1) * 20));
        titleToDisplay = ((title.length - titleToDisplay.length) <=5) ? title : titleToDisplay;        
        let tspan = el.append('tspan')
          .text(titleToDisplay)
          .attr("id", "label-"+d.id)
          .attr("text-anchor", "middle")
          .attr('x', '30')
          .attr('dy', dy);

          if(titleToDisplay.length == title.length) {
            break;
          }
      }

      if(d3.select("#t"+d.id).empty()) {
        let deleteIcon = gEl.append('text')
          .attr('font-family', 'FontAwesome')
          .attr('id', 't'+d.id)
          .attr('dy', 10)
          .attr('dx', 45)
          .attr('class','delete-icon hide-delete-icon')
          .on("click", function(d) {
            d3.event.stopPropagation();
            _self.deleteNode(d, gEl);
          })
          .text(function(node) { return '\uf1f8' })
        }
  }

  insertBgImage = (gEl, x, y, d) => {
    let _self=this, shapesData=[];

    switch (d.type) {
      case 'Job':
        shapesData = _self.shapesData[0];
        break;
      case 'Modeling':
        shapesData = _self.shapesData[1];
        break;
      case 'Scoring':
        shapesData = _self.shapesData[2];
        break;
      case 'File':
        shapesData = _self.shapesData[3];
        break;
      case 'Index':
        shapesData = _self.shapesData[4];
        break;
    }
    if(gEl.select(".icon").empty()) {
      let imageTxt = gEl.append('text')
        .attr('font-family', 'FontAwesome')
        .attr('class', 'icon')
        .attr('font-size', function(d) { return '3em'} )
        .attr('y', 40)
        .attr('x', 12)
        //.attr('class','delete-icon hide-delete-icon')
        .text(function(node) { return shapesData.icon })
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
          this.graphState.shiftNodeDrag = d3.event.shiftKey;
          // reposition dragged directed edge
          this.thisGraph.dragLine.classed('hidden', false)
              .attr('d', 'M' + (d.x + 40) + ',' + (d.y + 20) + 'L' + (d.x + 35) + ',' + d.y);
          return;
      }
  }

  dragEnd = (d3node, d) => {
    let _self=this;
    // reset the this.graphStates
    _self.graphState.shiftNodeDrag = false;
    d3node.classed(_self.consts.connectClass, false);

    let mouseDownNode = _self.graphState.mouseDownNode;
    let mouseEnterNode = _self.graphState.mouseEnterNode;

    if (_self.graphState.justDragged) {
        // dragged, not clicked
        _self.graphState.justDragged = false;
    }

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
      this.graphState.shiftNodeDrag = false;
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
      d3.select("." + this.consts.graphClass)
          .attr("transform", d3.event.transform);
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
        .attr("d", function (d) {
            return "M" + (d.source.x + 40) + "," + (d.source.y + 20) + "L" + (d.target.x +35) + "," + (d.target.y + 15);
        });

    // remove old links
    paths.exit().remove();

    // add new paths
    paths = paths.enter()
        .append("path")
        .style('marker-end', 'url(#end-arrow)')
        .classed("link", true)
        .attr("d", function (d) {
            return "M" + (d.source.x + 40) + "," + (d.source.y + 20) + "L" + (d.target.x + 35)  + "," + (d.target.y + 15);
        })
        .merge(paths)
        .on("mouseup", function (d) {
            // graphState.mouseDownLink = null;
        })
        .on("mousedown", function (d) {
                _self.pathMouseDown(d3.select(this), d);
            }
        );
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
            return "translate(" + d.x + "," + d.y + ")";
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
              currentlyEditingId: d.id
            });

            _self.openDetailsDialog(d);
        });

        _self.thisGraph.circles = newGs;
        let childNodes = 0;
        newGs.each(function(d) {
          //if (this.childNodes.length === 0) {
          switch(d.type) {
            case 'Job':
            case 'Modeling':
            case 'Scoring':
              if(d3.select("#rec-"+d.id).empty()) {
                d3.select(this)
                  .append("rect")
                  .attr("id", "rec-"+d.id)
                  .attr("width", _self.shapesData[0].rectwidth)
                  .attr("height", _self.shapesData[0].rectheight)
                  .attr("stroke", "grey")
                  .attr("fill", _self.shapesData[0].color)
                  .attr("stroke-width", "3")
                  .attr("filter", "url(#glow)")
                  //.call(_self.nodeDragHandler)
                }

              _self.insertBgImage(d3.select(this), d.x, d.y, d);
              _self.insertTitle(d3.select(this), d.title, d.x, d.y, d);
              break;

            case 'File':
            case 'Index':
              if(d3.select("#rec-"+d.id).empty()) {
                d3.select(this)
                  .append("rect")
                  .attr("id", "rec-"+d.id)
                  .attr("rx", _self.shapesData[3].rx)
                  .attr("ry", _self.shapesData[3].ry)
                  .attr("width", _self.shapesData[3].rectwidth)
                  .attr("height", _self.shapesData[3].rectheight)
                  .attr("stroke", "grey")
                  .attr("filter", "url(#glow)")
                  .attr("fill", function(d) {
                    if(d.type == 'File')
                     return _self.shapesData[3].color;
                    else if(d.type == 'Index')
                      return _self.shapesData[4].color;
                  })
                  .attr("stroke-width", "3")
                  //.call(_self.nodeDragHandler)
              }
              _self.insertBgImage(d3.select(this), d.x, d.y, d);
              _self.insertTitle(d3.select(this), d.title, d.x, d.y, d);
              break;
          }
        });

        //_self.saveGraph()
  }

  toggleDeleteIcon = (node, d) => {
    if(!this.props.viewMode) {
      if(d3.select("#t"+d.id).classed("hide-delete-icon")) {
        d3.select("#t"+d.id).classed("hide-delete-icon", false)
      } else {
        d3.select("#t"+d.id).classed("hide-delete-icon", true)
      }
    }
  }

  deleteNode = (d, gEl) => {
    let _self=this;
    switch(d.type) {
      case 'File':
        if(d.fileId) {
          handleFileDelete(d.fileId, _self.props.applicationId);
        }
        updateGraph((d.fileId ? d.fileId : d.id), _self.props.applicationId, _self.props.selectedDataflow).then((response) => {
          _self.fetchSavedGraph();
        });
        break;
      case 'Index':
        if(d.indexId) {
          handleIndexDelete(d.indexId, _self.props.applicationId);
        }
        updateGraph((d.indexId ? d.indexId : d.id), _self.props.applicationId, _self.props.selectedDataflow).then((response) => {
          _self.fetchSavedGraph();
        });
        break;
      case 'Job':
        if(d.jobId) {
          handleJobDelete(d.jobId, _self.props.applicationId);
        }
        updateGraph((d.jobId ? d.jobId : d.id), _self.props.applicationId, _self.props.selectedDataflow).then((response) => {
          _self.fetchSavedGraph();
        });
        break;
    }
    if(gEl) {
      gEl.remove();
    }
  }

  showNodeDetails = (d) => {
    if(this.props.viewMode) {
      let taskDetails = this.getTaskDetails();
      let tasks = taskDetails.filter((task) => {
        return task.id == "rec-"+d.id
      })

      this.setState({
        nodeDetailsVisible: true,
        nodeDetailStatus: tasks[0].status,
        nodeDetailMessage: JSON.parse(tasks[0].message).message
      });
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
    $('#sidebar').toggleClass('active');
  }

  addFile = () => {
    let _self = this;
    _self.thisGraph.nodes.push({"title":"new file","id":0,"x":475,"y":100})
    _self.setIdCt(_self.graphState.idct++);
    _self.updateGraph();
  }

  loadGraphComponents = () => {
    let _self=this;
    _self.thisGraph.nodes = [];
    _self.thisGraph.edges = [];

    var margin = {top: 10, right: 10, bottom: 30, left: 10};

    let graphComponentsSvg = d3.select("#sidebar").append("svg")
      .attr("width", 100)
      .attr("height", "100%");


    var group = graphComponentsSvg.selectAll('g')
    .data(this.shapesData)
    .enter().append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")")

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

    group.append("text")
        .attr('font-family', 'FontAwesome')
        .attr('font-size', function(d) { return '3em'} )
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

    var dragHandler = d3.drag()
    .on("drag", function (d) {
        let text = d3.select(this).select("text");
        let rect = d3.select(this).select("rect");        
        return {"tx": d3.event.x + 50, "ty": d3.event.y + 15, "rx": d3.event.x, "ry": d3.event.y};
    })
    .on("end", function(d){      
        var mouseCoordinates = d3.mouse(this);
        let idct = ++_self.graphState.idct;
        //let x = (mouseCoordinates[0] < 60) ? 60 : mouseCoordinates[0] - 150 : mouseCoordinates[0] > 1300 ? 1300 : mouseCoordinates[0];
        let x = mouseCoordinates[0] > 1300 ? 1300 : mouseCoordinates[0] < 60 ? 60 : mouseCoordinates[0]
        let y = mouseCoordinates[1] > 600 ? 600 : mouseCoordinates[1] < 0 ? 0 : mouseCoordinates[1]        
        _self.thisGraph.nodes.push({"title":"New "+d3.select(this).select("text.entity").text(),"id":idct+Math.floor(Date.now()),"x":x,"y":y, "type":d3.select(this).select("text.entity").text()})
        _self.setIdCt(idct);
        _self.updateGraph();
    })
    dragHandler(graphComponentsSvg.selectAll("g"));

    let docEl = document.documentElement,
        bodyEl = document.getElementById('body');

    let width = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth,
        height = window.innerHeight || docEl.clientHeight || bodyEl.clientHeight;

    let xLoc = width / 2 - 25,
        yLoc = 100;

    /** MAIN SVG **/
    let svg = d3.select("#graph").append("svg")
        .attr("width", width)
        .attr("height", "100%");

    // define arrow markers for graph links
    let defs = svg.append('svg:defs');
    defs.append('svg:marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', "30")
        .attr('markerWidth', 3.5)
        .attr('markerHeight', 3.5)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5');

    // define arrow markers for leading arrow
    defs.append('svg:marker')
        .attr('id', 'mark-end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 7)
        .attr('markerWidth', 3.5)
        .attr('markerHeight', 3.5)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5');

    let feMerge = defs.append('svg:filter')
        .attr('id', 'glow')
      .append('svg:feGaussianBlur')
        .attr('stdDeviation', '1.0')
        .attr('result', 'coloredBlur')
      .append('svg:feMerge')

      feMerge.append('svg:feMergeNode')
        .attr('in', 'coloredBlur')

      feMerge.append('svg:feMergeNode')
        .attr('in', 'SourceGraphic')


    _self.thisGraph.svg = svg;
    _self.thisGraph.svgG = svg.append("g")
        .classed(_self.consts.graphClass, true);
    let svgG = _self.thisGraph.svgG;

    // displayed when dragging between nodes
    _self.thisGraph.dragLine = svgG.append('svg:path')
        .attr('class', 'link dragline hidden')
        .attr('d', 'M0,0L0,0')
        .style('marker-end', 'url(#mark-end-arrow)');
    // svg nodes and edges
    _self.thisGraph.paths = svgG.append("g").selectAll("g");
    _self.thisGraph.circles = svgG.append("g").selectAll("g");

    _self.thisGraph.drag = d3.drag()
      .subject(function (d) {
          return {x: d.x, y: d.y};
      })
      .on("drag", function (d) {
          _self.graphState.justDragged = true;
          _self.dragmove(d);
          //d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
      })
      .on("end", function (d) {
          // todo check if edge-mode is selected
          var mouse = d3.mouse(this);
          var elem = document.elementFromPoint(mouse[0], mouse[1]);
          if (_self.graphState.shiftNodeDrag) {
              _self.dragEnd(d3.select(this), _self.graphState.mouseEnterNode)
          } else {
            let x = d3.event.x > 1300 ? 1300 : d3.event.x < 60 ? 60 : d3.event.x
            let y = d3.event.y > 600 ? 600 : d3.event.y < 0 ? 0 : d3.event.y      
            d.x = x;
            d.y = y;
          }
          _self.updateGraph();
          _self.saveGraph();
      });

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
    });

    // listen for dragging
    let dragSvg = d3.zoom()
      .on("zoom", function () {
        if (d3.event.sourceEvent.shiftKey) {
            // TODO  the internal d3 this.graphState is still changing
            return false;
        } else {
            _self.zoomed(_self.thisGraph);
        }
        return true;
      })
      .on("start", function () {
        var ael = d3.select("#" + _self.consts.activeEditId).node();
        if (ael) {
            ael.blur();
        }
        if (!d3.event.sourceEvent.shiftKey) d3.select('body').style("cursor", "move");
      })
      .on("end", function () {
        d3.select('body').style("cursor", "auto");
      });

      svg.call(dragSvg).on("dblclick.zoom", null);

    // listen for resize
    window.onresize = function () {
        _self.updateWindow(svg);
    };
  }

  render() {
    const pStyle = {
      fontSize: 16,
      color: 'rgba(0,0,0,0.85)',
      lineHeight: '24px',
      display: 'block',
      marginBottom: 16,
    };

	return (
    <div class="container-fluid" style={{"height": "100%"}}>
      <div class="row" style={{"height": "100%"}}>
      {!this.props.viewMode ?        
         <div class="col-sm-1"><nav id="sidebar" className="navbar-light fixed-left" style={{"backgroundColor": "#e3f2fd", "fontSize": "12px"}}>

        </nav></div>
        : null }

          <div id="graph" className="col-md-10" style={{"height": "100%"}} tabIndex="-1"></div>
      </div>    
      {this.state.openFileDetailsDialog ?
        <FileDetailsForm
          onRef={ref => (this.fileDlg = ref)}
          isNew={this.state.isNew}
          selectedAsset={this.state.selectedFile}
          selectedNodeId={this.state.selectedNodeId}
          applicationId={this.props.applicationId}
          onClose={this.handleClose}
          onRefresh={this.onFileAdded}
          user={this.props.user}
          selectedDataflow={this.props.selectedDataflow}/> : null}

      {this.state.openJobDetailsDialog ?
            <JobDetailsForm
              onRef={ref => (this.jobDlg = ref)}
              applicationId={this.props.applicationId}
              selectedAsset={this.state.selectedJob}
              selectedJobType={this.state.selectedJobType}
              isNew={this.state.isNewJob}
              onRefresh={this.onFileAdded}
              onClose={this.closeJobDlg}
              user={this.props.user}
              selectedDataflow={this.props.selectedDataflow}/> : null}

      {this.state.openIndexDetailsDialog ?
          <IndexDetailsForm
            onRef={ref => (this.idxDlg = ref)}
            applicationId={this.props.applicationId}
            isNew={this.state.isNewIndex}
            onRefresh={this.onFileAdded}
            selectedAsset={this.state.selectedIndex}
            onClose={this.closeIndexDlg}
            user={this.props.user}
            selectedDataflow={this.props.selectedDataflow}/> : null}

        <Drawer
          width={340}
          placement="right"
          closable={false}
          onClose={this.closeNodeDetails}
          visible={this.state.nodeDetailsVisible}
        >
            <Descriptions title="Details">
              <Descriptions.Item label="Status">{this.state.nodeDetailStatus}</Descriptions.Item>
              <Descriptions.Item label="Message">{this.state.nodeDetailMessage}</Descriptions.Item>
            </Descriptions>
        </Drawer>

    </div>
	)
  }

}

function mapStateToProps(state) {
  const { user } = state.authenticationReducer;
  const { application, selectedTopNav } = state.applicationReducer;
  return {
      user,
      application,
      selectedTopNav
  };
}

const connectedGraph = connect(mapStateToProps)(Graph);
export { connectedGraph as Graph };

//export default Graph;