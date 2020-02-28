import React, { Component } from "react";
import * as d3 from "d3";
import '../graph-creator/graph-creator.css';
import GraphRenderer from '../graph-creator/GraphRenderer';
import loadScript from "../common/LoadScript";
import $ from 'jquery';
import { Button, Icon} from 'antd/lib';
import { Typography } from 'antd';
import FileDetailsForm from "./FileDetails";
import JobDetailsForm from "./JobDetails";
import { authHeader, handleError } from "../common/AuthHeader.js"
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
    selectedFile: '',
    isNewFile:false,
    selectedJob: '',
    isNewJob:false,
    currentlyEditingId:''
  }

  consts = {
      selectedClass: "selected",
      connectClass: "connect-node",
      circleGClass: "conceptG",
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
      { "x": "10", "y": "20", "rx":"0", "ry":"0", "rectx":"10", "recty":"10", "rectwidth":"110", "rectheight":"40", "tx":"60", "ty":"30", "title":"Job", "color":"#EE7423", "icon":"\uf040", "iconx":"90", "icony":"25"},
      { "x": "10", "y": "70", "rx":"10", "ry":"10", "rectx":"10", "recty":"70", "rectwidth":"110", "rectheight":"40", "tx":"60", "ty":"90", "title":"File", "color":"#7AAAD0", "icon":"\uf040", "iconx":"90", "icony":"65"},
      { "x": "10", "y": "120", "rx":"10", "ry":"10", "rectx":"10", "recty":"130", "rectwidth":"110", "rectheight":"40", "tx":"60", "ty":"150", "title":"Query", "color":"#9B6A97", "icon":"\uf040", "iconx":"90", "icony":"65"},
      { "x": "10", "y": "170", "rx":"10", "ry":"10", "rectx":"10", "recty":"190", "rectwidth":"110", "rectheight":"40", "tx":"60", "ty":"210", "title":"Index", "color":"#7DC470", "icon":"\uf040", "iconx":"90", "icony":"65"}
    ];

  thisGraph = {};

  componentDidMount() {
    this.loadGraphComponents();
    this.fetchSavedGraph();
    document.addEventListener('mousedown', this.handleClickOutside);
  }
  componentWillReceiveProps(props) {
    if(this.state.applicationId != props.application.applicationId) {
      this.setState({
        applicationId: props.application.applicationId
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

  openFileDetailsDialog(d) {
    let _self=this;
    switch(d.type) {
      case 'File':
        let isNewFile = false;
        if(d.fileId == undefined || d.fileId == '') {
          isNewFile = true
        }
        this.setState({
          isNewFile: isNewFile,
          openFileDetailsDialog: true,
          selectedFile: d.fileId
        });

        setTimeout(() => {
          _self.fileDlg.showModal();
        }, 200);

        break;
      case 'Job':
        let isNewJob = false;
        if(d.jobId == undefined || d.jobId == '') {
          isNewJob = true
        }
        this.setState({
          isNewJob: isNewJob,
          openJobDetailsDialog: true,
          selectedJob: d.jobId
        });

        setTimeout(() => {
          _self.jobDlg.showModal();
        }, 200);
        break;
   }
  }

  handleClose = () => {
    this.setState({
      openFileDetailsDialog: false
    });
  }

  closeJobDlg = () => {
    this.setState({
      openJobDetailsDialog: false
    });
  }

  onFileAdded = (saveResponse) => {
    console.log(saveResponse);
    var newData = this.thisGraph.nodes.map(el => {
        if(el.id == this.state.currentlyEditingId) {
           return Object.assign({}, el, {title:saveResponse.title, fileId:saveResponse.fileId, jobId:saveResponse.jobId})
        }
        return el
    });
    console.log(JSON.stringify(newData));
    this.thisGraph.nodes = newData;
    this.updateGraph();
  }

  saveGraph() {
    let edges = [];
    this.thisGraph.edges.forEach(function (val, i) {
        edges.push({source: val.source.id, target: val.target.id});
    });
    fetch('/api/workflowgraph/save', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({"application_id": this.props.applicationId, nodes: this.thisGraph.nodes, edges: edges})
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
    var _self=this;
    fetch("/api/workflowgraph?application_id="+this.props.applicationId, {
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
        let nodes = JSON.parse(data.nodes);
        let edges = JSON.parse(data.edges);
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
        _self.thisGraph.nodes = nodes;
        _self.thisGraph.edges = edges;
        _self.setIdCt(nodes.length);
        _self.updateGraph();

      }
    }).catch(error => {
      console.log(error);
    });
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
    console.log(d);
    let _self=this;
    if (_self.graphState.shiftNodeDrag) {
      console.log("dragging path")
        _self.thisGraph.dragLine.attr('d', 'M' + (d.x + 40) + ',' + (d.y + 20) + 'L' + (d3.mouse(_self.thisGraph.svgG.node())[0] + 35)+ ',' + d3.mouse(_self.thisGraph.svgG.node())[1]);
    } else {
        d.x += d3.event.dx;
        d.y += d3.event.dy;
        _self.updateGraph();
    }
  }

  deleteGraph = (skipPrompt) => {
    let doDelete = true;
    if (!skipPrompt) {
        doDelete = window.confirm("Press OK to delete this graph");
    }
    if (doDelete) {
        this.thisGraph.nodes = [];
        this.thisGraph.edges = [];
        this.updateGraph();
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


  /* insert svg line breaks: taken from http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts */
  insertTitleLinebreaks = (gEl, title) => {
      let words = title.split(/\s+/g),
          nwords = words.length;
      let el = gEl.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "-" + (nwords - 1) * 7.5);

      for (let i = 0; i < words.length; i++) {
          let tspan = el.append('tspan').text(words[i]);
          if (i > 0) {
              tspan.attr('x', 0).attr('dy', '15');
          }
      }
  }

  insertTitle = (gEl, title, x, y, d) => {
      let words = title.split(/\s+/g),
          nwords = words.length;

      let el = gEl.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", 25)
          .attr("dx", 50);
      let tspan = el.append('tspan').text(title);
      //tspan.attr('x', 50).attr('dy', '15');
      tspan.attr("text-anchor", "middle");


/*      for (let i = 0; i < words.length; i++) {
          let tspan = el.append('tspan').text(words[i]);
          if (i > 1) {
              tspan.attr('x', 50).attr('dy', '15');
              tspan.attr("text-anchor", "middle");
          }
      }*/
  }

  wrap =  (text, width)  => {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
}


  // remove edges associated with a node
  spliceLinksForNode = (node) => {
      let toSplice = this.thisGraph.edges.filter(function (l) {
          return (l.source === node || l.target === node);
      });
      toSplice.map(function (l) {
          this.thisGraph.edges.splice(this.thisGraph.edges.indexOf(l), 1);
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
          this.thisGraph.removeSelectFromNode();
      }
      this.graphState.selectedNode = nodeData;
  }

  removeSelectFromNode = () => {
      this.thisGraph.circles.filter(function (cd) {
          return cd.id === this.graphState.selectedNode.id;
      }).classed(this.consts.selectedClass, false);
      this.graphState.selectedNode = null;
  }

  removeSelectFromEdge = () => {
      this.thisGraph.paths.filter(function (cd) {
          return cd === this.graphState.selectedEdge;
      }).classed(this.consts.selectedClass, false);
      this.graphState.selectedEdge = null;
  }

  pathMouseDown = (d3path, d) => {
      d3.event.stopPropagation();
      this.graphState.mouseDownLink = d;

      if (this.graphState.selectedNode) {
          this.thisGraph.removeSelectFromNode();
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
    console.log('circleModusDown...')
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

  /* place editable text on node in place of svg text */
  changeTextOfNode = (d3node, d) => {
    let _self=this;
    let htmlEl = d3node.node();
    d3node.selectAll("text").remove();
    let nodeBCR = htmlEl.getBoundingClientRect(),
        curScale = nodeBCR.width / this.consts.nodeRadius,
        placePad = 5 * curScale,
        useHW = curScale > 1 ? nodeBCR.width * 0.71 : this.consts.nodeRadius * 1.42;
    // replace with editableconent text
    let d3txt = this.thisGraph.svg.selectAll("foreignObject")
        .data([d])
        .enter()
        .append("foreignObject")
        .attr("x", nodeBCR.left + placePad)
        .attr("y", nodeBCR.top + placePad)
        .attr("height", 2 * useHW)
        .attr("width", useHW)
        .append("xhtml:p")
        .attr("id", this.consts.activeEditId)
        .attr("contentEditable", "true")
        .text(d.title)
        .on("mousedown", function (d) {
            d3.event.stopPropagation();
        })
        .on("keydown", function (d) {
            d3.event.stopPropagation();
            if (d3.event.keyCode == this.consts.ENTER_KEY && !d3.event.shiftKey) {
                _self.thisGraph.blur();
            }
        })
        .on("blur", function (d) {
            d.title = _self.textContent;
            _self.insertTitleLinebreaks(d3node, d.title);
            d3.select(_self.thisGraph.parentElement).remove();
        });
      return d3txt;
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
        console.log('newEdge: '+JSON.stringify(newEdge))
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
      console.log('mouse up');
      // reset the this.graphStates
      this.graphState.shiftNodeDrag = false;
      d3node.classed(this.consts.connectClass, false);

      if (d3.event.shiftKey) {
          // shift-clicked node: edit text content
          let d3txt = this.changeTextOfNode(d3node, d);
          let txtNode = d3txt.node();
          console.log(txtNode);
          this.selectElementContents(txtNode);
          txtNode.focus();
      } else {
          if (this.graphState.selectedEdge) {
              this.removeSelectFromEdge();
          }
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
          console.log('idct: '+this.graphState.idct);
          // clicked not dragged from svg
          let xycoords = d3.mouse(this.thisGraph.svgG.node()),
              d = {id: this.graphState.idct++, title: "Title", x: xycoords[0], y: xycoords[1]};
          this.thisGraph.nodes.push(d);
          this.updateGraph();
          // make title of text immediently editable
          /*let d3txt = changeTextOfNode(this.thisGraph.circles.filter(function (dval) {
              return dval.id === d.id;
          }), d),
          txtNode = d3txt.node();
          console.log('txtNode: '+txtNode);
          selectElementContents(txtNode);
          txtNode.focus();*/
      } else if (this.graphState.shiftNodeDrag) {
          // dragged from node
          this.graphState.shiftNodeDrag = false;
          this.thisGraph.dragLine.classed("hidden", true);
      }
      this.graphState.graphMouseDown = false;
  }

  // keydown on main svg
  svgKeyDown = () => {
    // make sure repeated key presses don't register for each keydown
    if (this.graphState.lastKeyDown !== -1) return;

    this.graphState.lastKeyDown = d3.event.keyCode;
    let selectedNode = this.graphState.selectedNode,
        selectedEdge = this.graphState.selectedEdge;

    switch (d3.event.keyCode) {
        case this.consts.BACKSPACE_KEY:
        case this.consts.DELETE_KEY:
            d3.event.preventDefault();
            if (selectedNode) {
                this.thisGraph.nodes.splice(this.thisGraph.nodes.indexOf(selectedNode), 1);
                this.thisGraph.spliceLinksForNode(selectedNode);
                this.graphState.selectedNode = null;
                this.updateGraph();
            } else if (selectedEdge) {
                this.thisGraph.edges.splice(this.thisGraph.edges.indexOf(selectedEdge), 1);
                this.graphState.selectedEdge = null;
                this.updateGraph();
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
        return String(d.source.id) + "+" + String(d.target.id);
    });
    let paths = _self.thisGraph.paths;
    // update existing paths
    paths.style('marker-end', 'url(#end-arrow)')
        .classed(_self.consts.selectedClass, function (d) {
            return d === _self.graphState.selectedEdge;
        })
        // .attr("d", line([d.source.x, d.source.y, d.target.x, d.target.y]));
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
            console.log('mouseup link');
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
        })
        .on("mouseout", function (d) {
            _self.graphState.mouseEnterNode = null;
            d3.select(this).classed(_self.consts.connectClass, false);
        })
        .on("mousedown", function (d) {
            _self.circleMouseDown(d3.select(this), d);
        })
        .call(_self.thisGraph.drag)
        /*.on("click", function (d) {
            _self.circleMouseUp(d3.select(this), d);
            console.log('clicked....')
        })*/.on("dblclick", function (d) {
            console.log('dblclick....'+JSON.stringify(d))
            _self.setState({
              currentlyEditingId: d.id
            });

            _self.openFileDetailsDialog(d);
        });

        _self.thisGraph.circles = newGs;
        let childNodes = 0;
        newGs.each(function(d) {
          console.log("herereee")
          //if (this.childNodes.length === 0) {
          console.log("adding circle..."+d.type);
          switch(d.type) {
            case 'Job':
              d3.select(this)
                .append("rect")
                .attr("width", _self.shapesData[0].rectwidth)
                .attr("height", _self.shapesData[0].rectheight)
                .attr("stroke", "grey")
                .attr("fill", _self.shapesData[0].color)
                .attr("stroke-width", "3")
                .call(_self.nodeDragHandler)
              console.log(d.title + ' -- ' +d.fileId);
              _self.insertTitle(d3.select(this), d.title, d.x, d.y, d);

              break;

            case 'File':
              d3.select(this)
                .append("rect")
                .attr("rx", _self.shapesData[1].rx)
                .attr("ry", _self.shapesData[1].ry)
                .attr("width", _self.shapesData[1].rectwidth)
                .attr("height", _self.shapesData[1].rectheight)
                .attr("stroke", "grey")
                .attr("fill", _self.shapesData[1].color)
                .attr("stroke-width", "3")
                .call(_self.nodeDragHandler)
                console.log(d.title + ' -- ' +d.fileId);
              _self.insertTitle(d3.select(this), d.title, d.x, d.y, d);

              break;
          }
          //}
        });

        _self.saveGraph()
  }

  nodeDragHandler = () => {
     return d3.drag()
        .on("drag", function (d) {
            console.log("dragging");
        })
        .on("end", function(d){
            console.log("dragging ended");
        })
  }

  collapseNav = () => {
    $('#sidebar').toggleClass('active');
    console.log($('#sidebar'));
  }

  addFile = () => {
    console.log("addfile");
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
      .attr("width", 150)
      .attr("height", 500);


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

    group.append("text")
        .attr("x", function(d) { return d.tx; })
        .attr("y", function(d) { return d.ty; })
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "middle")
        .text( function (d) { return d.title; })

    /*group.append("text")
        .attr("x", function(d) { return d.iconx; })
        .attr("y", function(d) { return d.icony; })
        .text( function (d) { return d.icon; })*/

    var dragHandler = d3.drag()
    .on("drag", function (d) {
        let text = d3.select(this).select("text");
        let rect = d3.select(this).select("rect");
        return {"tx": d3.event.x + 50, "ty": d3.event.y + 15, "rx": d3.event.x, "ry": d3.event.y};
    })
    .on("end", function(d){
        var mouseCoordinates = d3.mouse(this);
        console.log(mouseCoordinates[0] + ', '+mouseCoordinates[1])
        let idct = ++_self.graphState.idct;
        console.log('idct: '+idct);
        _self.thisGraph.nodes.push({"title":"New "+d3.select(this).select("text").text(),"id":idct,"x":mouseCoordinates[0]-150,"y":mouseCoordinates[1]-50, "type":d3.select(this).select("text").text()})
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
        .attr("height", height);

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
          }

      });

    // listen for key events
    d3.select(window).on("keydown", function () {
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

    // handle download data
    d3.select("#download-input").on("click", function () {
      let saveEdges = [];
      _self.thisGraph.edges.forEach(function (val, i) {
          saveEdges.push({source: val.source.id, target: val.target.id});
      });
      let blob = new Blob([window.JSON.stringify({
          "nodes": _self.thisGraph.nodes,
          "edges": saveEdges
      })], {type: "text/plain;charset=utf-8"});
        //saveAs(blob, "mydag.json");
    });


    // handle uploaded data
    d3.select("#upload-input").on("click", function () {
        document.getElementById("hidden-file-upload").click();
    });
    d3.select("#hidden-file-upload").on("change", function () {
      if (window.File && window.FileReader && window.FileList && window.Blob) {
          let uploadFile = _self.thisGraph.files[0];
          let filereader = new window.FileReader();

          filereader.onload = function () {
              let txtRes = filereader.result;
              // TODO better error handling
              try {
                  let jsonObj = JSON.parse(txtRes);
                  _self.thisGraph.deleteGraph(true);
                  _self.thisGraph.nodes = jsonObj.nodes;
                  _self.setIdCt(jsonObj.nodes.length + 1);
                  let newEdges = jsonObj.edges;
                  newEdges.forEach(function (e, i) {
                      newEdges[i] = {
                          source: _self.thisGraph.nodes.filter(function (n) {
                              return n.id === e.source;
                          })[0],
                          target: _self.thisGraph.nodes.filter(function (n) {
                              return n.id === e.target;
                          })[0]
                      };
                  });
                  _self.thisGraph.edges = newEdges;
                  _self.updateGraph();
              } catch (err) {
                  window.alert("Error parsing uploaded file\nerror message: " + err.message);
                  return;
              }
          };
          filereader.readAsText(uploadFile);

      } else {
          alert("Your browser won't let you save this graph -- try upgrading your browser to IE 10+ or Chrome or Firefox.");
      }

    });

    // handle delete graph
    d3.select("#delete-graph").on("click", function () {
      _self.thisGraph.deleteGraph(false);
    });

  }

  render() {
	return (
    <div className="wrapper d-flex align-items-stretch">
      <nav id="sidebar" className="navbar-light fixed-left" style={{"backgroundColor": "#e3f2fd"}}>

      </nav>

      <div id="content"  ref={this.setWrapperRef} >
          <div id="graph">
          </div>
      </div>
      {this.state.openFileDetailsDialog ?
        <FileDetailsForm
          onRef={ref => (this.fileDlg = ref)}
          isNewFile={this.state.isNewFile}
          selectedFile={this.state.selectedFile}
          applicationId={this.props.applicationId}
          onClose={this.handleClose}
          onRefresh={this.onFileAdded}
          user={this.props.user}/> : null}

      {this.state.openJobDetailsDialog ?
            <JobDetailsForm
              onRef={ref => (this.jobDlg = ref)}
              applicationId={this.props.applicationId}
              selectedJob={this.state.selectedJob}
              isNewJob={this.state.isNewJob}
              onRefresh={this.onFileAdded}
              onClose={this.closeJobDlg}
              user={this.props.user}/> : null}

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