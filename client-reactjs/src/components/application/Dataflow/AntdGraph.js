import React, {useEffect, useState, useRef} from "react";
import { Graph, Shape, Addon } from '@antv/x6';
import { authHeader, handleError } from "../../common/AuthHeader.js";
import './graph.css';
import sprite from '../../../solid.svg';
import { debounce } from "lodash";
import { assetsActions } from '../../../redux/actions/Assets';
import { useDispatch } from "react-redux";
import AssetDetailsDialog from "../AssetDetailsDialog"
import ExistingAssetListDialog from "./ExistingAssetListDialog";
import SubProcessDialog from "./SubProcessDialog";

function AntdGraph({applicationId, applicationTitle, selectedDataflow, user}) {  
  const graphContainer = document.getElementById('graph-container');
  const stencilContainer = document.getElementById('stencil');
  const [graphState, setGraphState] = useState({
		showAssetListDlg: false,
    isNew: false,
    openFileDetailsDialog: false,
    selectedFile: '',
    selectedNodeId: '',
    selectedAssetTitle: '',
    isNewJob: false,
    openJobDetailsDialog: false,
    selectedJob: '',
    selectedJobType: '',
    isNewIndex: false,
    openIndexDetailsDialog: false,
    selectedIndex: '',
    selectedSubProcess: {},
    showSubProcessDetails: false,
    currentlyEditingNode: {id:'', type:''},
    nodes: [],
    edges: []
});
const dispatch = useDispatch();

const graph = useRef(null);
const SVG_IMAGE_BGCOLOR = {
  'Job': {
    'image': '#gears',
    'bgcolor': '#EE7423'
  },
  'File': {
    'image': '#database',
    'bgcolor': '#7AAAD0'
  },
  'Index': {
    'image': '#address-book',
    'bgcolor': '#7DC470'
  },
  'SubProcess': {
    'image': '#retweet',
    'bgcolor': '#F5A9A9'
  }

}

  const fetchSavedGraph = () => {
    console.log('fetchSavedGraph')
    return new Promise((resolve, reject) => {
      if(selectedDataflow && selectedDataflow.id != '' && selectedDataflow.id != undefined) {
        fetch("/api/dataflowgraph?application_id="+applicationId+"&dataflowId="+selectedDataflow.id, {
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
            //console.log(data);
            let nodes = JSON.parse(data.nodes);
            let edges = JSON.parse(data.edges);
            if(nodes && nodes.length > 0){              
              nodes.forEach((node) => {
                graph.current.addNode({
                  shape: 'custom-image',
                  id: node.id,
                  label: node.title,
                  x: node.x,
                  y: node.y,
                  attrs: {
                    body: {
                      stroke: '#2CB9FF',
                      fill: node.type ? SVG_IMAGE_BGCOLOR[node.type].bgcolor : '',
                    },
                    svgimage: {
                      'href': node.type ? sprite + SVG_IMAGE_BGCOLOR[node.type].image : ''
                    },
                    props: {
                      type: node.type,
                      fileId: node.fileId,
                      jobId: node.jobId,
                      indexId: node.indexId,
                      title: node.title
                    }                  
                  },              
                })              
              })

              edges.forEach((edge) => {
                graph.current.addEdge({
                  source: {
                    cell: edge.source, 
                    port: 'port2', 
                  },
                  target: {
                    cell: edge.target, 
                    port: 'port4',
                  },
                  attrs: {
                    line: {
                      stroke: '#A2B1C3'
                    }
                  }

                })
              })
              //data.forEach()
            }
          }
          resolve();
        }).catch(error => {
          console.log(error);
          reject(error)
        });
      }
    })
  }

  useEffect(() => {
    if(graphContainer && stencilContainer) {
      graph.current = new Graph({
        container: graphContainer,
        grid: true,
        mousewheel: {
          enabled: true,
          zoomAtMousePosition: true,
          modifiers: 'ctrl',
          minScale: 0.5,
          maxScale: 3,
        },
        connecting: {
          router: 'manhattan',
          connector: {
            name: 'rounded',
            args: {
              radius: 8,
            },
          },
          anchor: 'center',
          connectionPoint: 'anchor',
          allowBlank: false,
          snap: {
            radius: 20,
          },
          createEdge() {
            return new Shape.Edge({
              attrs: {
                line: {
                  stroke: '#A2B1C3',
                  strokeWidth: 2,
                  targetMarker: {
                    name: 'block',
                    width: 12,
                    height: 8,
                  },
                },
              },
              zIndex: 0,
            })
          },
          validateConnection({ targetMagnet }) {
            return !!targetMagnet
          },
        },
        highlighting: {
          magnetAdsorbed: {
            name: 'stroke',
            args: {
              attrs: {
                fill: '#5F95FF',
                stroke: '#5F95FF',
              },
            },
          },
        },
        resizing: true,
        rotating: true,
        selecting: {
          enabled: true,
          rubberband: true,
          showNodeSelectionBox: true,
        },
        snapline: true,
        keyboard: true,
        clipboard: true,
      })

      // #endregion
      // #region stencil
      const stencil = new Addon.Stencil({
        stencilGraphWidth: 200,
        stencilGraphHeight: 180,
        target: graph.current,
        groups: [          
          {
            title: 'Assets',
            name: 'group2',
            graphHeight: 250,
            layoutOptions: {
              rowHeight: 70,
            },
            collapsable: false
          },
        ],
        layoutOptions: {
          columns: 2,
          columnWidth: 80,
          rowHeight: 55,
        },
      })
      
      stencilContainer.appendChild(stencil.container)
      // #endregion

      // #region 快捷键与事件

      // copy cut paste
      graph.current.bindKey(['meta+c', 'ctrl+c'], () => {
        const cells = graph.current.getSelectedCells()
        if (cells.length) {
          graph.current.copy(cells)
        }
        return false
      })
      graph.current.bindKey(['meta+x', 'ctrl+x'], () => {
        const cells = graph.current.getSelectedCells()
        if (cells.length) {
          graph.current.cut(cells)
        }
        return false
      })
      graph.current.bindKey(['meta+v', 'ctrl+v'], () => {
        if (!graph.current.isClipboardEmpty()) {
          const cells = graph.current.paste({ offset: 32 })
          graph.current.cleanSelection()
          graph.current.select(cells)
        }
        return false
      })

      //undo redo
      graph.current.bindKey(['meta+z', 'ctrl+z'], () => {
        if (graph.current.history.canUndo()) {
          graph.current.history.undo()
        }
        return false
      })
      graph.current.bindKey(['meta+shift+z', 'ctrl+shift+z'], () => {
        if (graph.current.history.canRedo()) {
          graph.current.history.redo()
        }
        return false
      })

      // select all
      graph.current.bindKey(['meta+a', 'ctrl+a'], () => {
        const nodes = graph.current.getNodes()
        if (nodes) {
          graph.current.select(nodes)
        }
      })

      //delete
      graph.current.bindKey('backspace', () => {
        const cells = graph.current.getSelectedCells()
        if (cells.length) {
          graph.current.removeCells(cells)
        }
      })

      // zoom
      graph.current.bindKey(['ctrl+1', 'meta+1'], () => {
        const zoom = graph.current.zoom()
        if (zoom < 1.5) {
          graph.current.zoom(0.1)
        }
      })
      graph.current.bindKey(['ctrl+2', 'meta+2'], () => {
        const zoom = graph.current.zoom()
        if (zoom > 0.5) {
          graph.current.zoom(-0.1)
        }
      })

      // 控制连接桩显示/隐藏
      const showPorts = (ports, show) => {
        for (let i = 0, len = ports.length; i < len; i = i + 1) {
          ports[i].style.visibility = show ? 'visible' : 'hidden'
        }
      }
      graph.current.on('node:mouseenter', () => {
        const container = document.getElementById('graph-container');
        const ports = container.querySelectorAll(
          '.x6-port-body',
        ) 
        showPorts(ports, true)
      })
      graph.current.on('node:mouseleave', () => {
        const container = document.getElementById('graph-container')
        const ports = container.querySelectorAll(
          '.x6-port-body',
        ) 
        showPorts(ports, false)
      })

      graph.current.on('node:added', ({ node, index, options }) => { 
        handleSave();
      })
      graph.current.on('node:removed', ({ node, index, options }) => { 
        console.log('node removed');
        handleSave();
      })
      graph.current.on('node:changed', ({ node, options }) => { 
        console.log('node changed');
        handleSave();
      })
      graph.current.on('edge:connected', ({ isNew, edge }) => {
        console.log(edge);
        console.log(isNew);
        if (isNew) {
          handleSave();
        }
      })
      
      graph.current.on('node:dblclick', ({ e, x, y, cell, view }) => {
        console.log(graph)
        openDetailsDialog(cell);
      })      
      // #endregion

      // #region 初始化图形
      const ports = {
        groups: {
          top: {
            position: 'top',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#5F95FF',
                strokeWidth: 1,
                fill: '#fff',
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
          right: {
            position: 'right',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#5F95FF',
                strokeWidth: 1,
                fill: '#fff',
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
          bottom: {
            position: 'bottom',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#5F95FF',
                strokeWidth: 1,
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
          left: {
            position: 'left',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#5F95FF',
                strokeWidth: 1,                
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
        },
        items: [
          {
            id: 'port1',
            group: 'top',
          },
          {
            id: 'port2',
            group: 'right',
          },
          {
            id: 'port3',
            group: 'bottom',
          },
          {
            id: 'port4',
            group: 'left',
          },
        ],
      }      

      Graph.registerNode(
        'custom-image',
        {
          inherit: 'rect',
          width: 52,
          height: 52,
          markup: [
            {
              tagName: 'rect',
              selector: 'body',
            },
            {
              tagName: 'svg',
              children: [
                {
                  tagName: 'use',
                  selector: 'svgimage'
                }
              ]
            },
            {
              tagName: 'text',
              selector: 'label',
            },
          ],
          attrs: {
            body: {
              strokeWidth: 1,
              stroke: '#26C160',
              fill: '#26C160',
            },
            svg: {
              width: 40,
              height: 40,
              refX: 38,
              refY: 22,
            },
            label: {
              refX: 3,
              refY: 1,
              textAnchor: 'center',
              textVerticalAnchor: 'top',
              fontSize: 10,
              fill: '#fff',
            },
            svgimage: {
              href: '',
              width: 26,
              height: 26,
              refX: 12,
              refY: 12
            },
            props: {
              fileId: '',
              jobId: '',
              indexId: '',
              type: '',
              title: '',
              jobType: '',
              schedueType: ''
            }
          },
          ports: { ...ports },
        },
        true,
      )            

      const m1 = graph.current.createNode({
        shape: 'custom-image',
        label: 'Job',
        attrs: {
          body: {
            stroke: '#2CB9FF',
            fill: SVG_IMAGE_BGCOLOR.Job.bgcolor,
          },
          svgimage: {
            'href': sprite + SVG_IMAGE_BGCOLOR.Job.image
          },
          props: {
            type: 'Job',
            title: 'New Job' 
          }
        },
      })
      const m2 = graph.current.createNode({
        shape: 'custom-image',
        label: 'File',
        attrs: {
          body: {
            stroke: '#2CB9FF',
            fill: SVG_IMAGE_BGCOLOR.File.bgcolor,
          },
          svgimage: {
            'href': sprite + SVG_IMAGE_BGCOLOR.File.image
          },
          props: {
            type: 'File', 
            title: 'New File' 
          }
        },
      })
      const m3 = graph.current.createNode({
        shape: 'custom-image',
        label: 'Index',
        attrs: {
          body: {
            stroke: '#5AB0BE',
            fill: SVG_IMAGE_BGCOLOR.Index.bgcolor,
          },
          svgimage: {
            'href': sprite + SVG_IMAGE_BGCOLOR.Index.image
          },
          props: {
            type: 'Index',
            title: 'New Index'  
          }   
        },
      })
      const m4 = graph.current.createNode({
        shape: 'custom-image',
        label: 'Sub-Process',
        attrs: {
          body: {
            stroke: '#E6475B',
            fill: SVG_IMAGE_BGCOLOR.SubProcess.bgcolor,
          },
          svgimage: {
            'href': sprite + SVG_IMAGE_BGCOLOR.SubProcess.image
          },
          props: {
            type: 'Sub-Process',
            title: 'New Sub-Process'  
          }   
        },
      })      

      stencil.load([m1, m2, m3, m4], 'group2');
    }
  }, [graphContainer, stencilContainer])

  useEffect(() => {    
    if(graph) {
      fetchSavedGraph();
    }
  }, [applicationId, selectedDataflow])

  const handleSave = debounce (() => {
    let nodes=[], edges=[];
    graph.current.getNodes().forEach((node) => {
      nodes.push({
        id: node.id,
        title: node.attrs.props.title,
        fileId: node.attrs.props.fileId,
        indexId: node.attrs.props.indexId,
        jobId: node.attrs.props.jobId,
        type: node.attrs.props.type,
        x: node.getPosition().x,
        y: node.getPosition().y,
        label: node.label});
    })
    graph.current.getEdges().forEach((edge) => {
      edges.push({source: edge.getSourceCellId(), target: edge.getTargetCellId()});
    })

    fetch('/api/dataflowgraph/save', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({
        "application_id": applicationId,
        dataflowId: selectedDataflow.id,
        nodes: nodes,
        edges: edges
      })
    }).then(function(response) {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
    }).then(function(data) {
      //_self.props.selectedDataflow.id = data.dataflowId;
      console.log('Saved graph..');
        //_self.fetchFiles();
    });
  }, 500)

  const openDetailsDialog = (cell) => {
    let _self=this;
    let isNew = false;
    console.log(graphState)
    switch(cell.attrs.props.type) {
      case 'File':
        if(cell.attrs.props.fileId == undefined || cell.attrs.props.fileId == '') {
          isNew = true;
          setGraphState({
            ...graphState,
            currentlyEditingNode: {id: cell.id, type: cell.attrs.props.type},            
            showAssetListDlg: true
          })            
        } else {
          setGraphState({
            ...graphState,
            isNew: isNew,
            openFileDetailsDialog: true,
            selectedFile: cell.attrs.props.fileId,
            selectedNodeId: cell.id,
            selectedAssetTitle: cell.attrs.props.title
          })            
          dispatch(assetsActions.assetSelected(
            cell.attrs.props.fileId,
            applicationId,
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
        if(cell.attrs.props.jobId == undefined || cell.attrs.props.jobId == '') {
          isNew = true;
          setGraphState({
            ...graphState,
            showAssetListDlg: true,
            currentlyEditingNode: {id: cell.id, type: cell.attrs.props.type}            
          })            
        } else {
          setGraphState({
            ...graphState,
            isNewJob: isNew,
            openJobDetailsDialog: true,
            selectedJob: cell.attrs.props.jobId,
            selectedAssetTitle: cell.attrs.props.title,
            selectedJobType: cell.attrs.props.type == 'Job' ? 'General' : cell.attrs.props.jobType,
          })
          dispatch(assetsActions.assetSelected(
            cell.attrs.props.jobId,
            applicationId,
            ''
          ));
        }
        break;
      case 'Index':
        let isNewIndex = false;
        if(cell.attrs.props.indexId == undefined || cell.attrs.props.indexId == '') {
          isNew = true;
          setGraphState({
            ...graphState,
            showAssetListDlg: true,
            currentlyEditingNode: {id: cell.id, type: cell.attrs.props.type}
          })            
        } else {
          setGraphState({
            ...graphState,
            isNewIndex: isNew,
            openIndexDetailsDialog: true,
            selectedIndex: cell.attrs.props.indexId,
            selectedAssetTitle: cell.attrs.props.title,
          })

          dispatch(assetsActions.assetSelected(
            cell.attrs.props.indexId,
            applicationId,
            ''
          ));
        }
        break;
      case 'Sub-Process':
        setGraphState({
          ...graphState,
          selectedSubProcess: {"id": cell.attrs.props.subProcessId, "title":cell.attrs.props.title},
          showSubProcessDetails: true
        })
        break;
   }
  }
  
  const handleClose = () => {
    setGraphState({
      openFileDetailsDialog: false
    })
  }

  const onAssetSaved = () => {
    
  }  

  const saveAssetToDataflow = (assetId, dataflowId, assetType, jobType) => {
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


  const onFileAdded = (saveResponse) => {
    console.log(graph.current)
    if(saveResponse) {
      var newData = graph.current.getNodes().forEach(node => {
        console.log(node.id, graphState.currentlyEditingNode.id)
        if(node.id == graphState.currentlyEditingNode.id) {
          console.log("here..")
          node.attrs.props.title=saveResponse.title;
          node.label=saveResponse.name;

          switch(node.attrs.props.type) {
            case 'File':
              node.attrs.props.fileId=saveResponse.fileId;              
              saveAssetToDataflow(node.attrs.props.fileId, selectedDataflow.id, node.attrs.props.type);
              break;
            /*case 'Index':
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

              break;*/
          }
          //return el;
           //return Object.assign({}, el, {title:saveResponse.title, fileId:saveResponse.fileId, jobId:saveResponse.jobId, queryId:saveResponse.queryId, indexId:saveResponse.indexId})
        }
        //return el
      });
      /*if(saveResponse.dataflow) {
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
      this.saveGraph();*/
    } else {
      //await this.fetchSavedGraph();
    }
  }

  return (
    <React.Fragment>
      <div id="container">
        <div id="stencil"></div>
        <div id="graph-container"></div>        
      </div>    
      {graphState.openFileDetailsDialog ?
        <AssetDetailsDialog 
          assetType="file"
          assetId={graphState.selectedFile} 
          fileId={graphState.selectedFile} 
          nodes={graphState.nodes}
          selectedAsset={graphState.selectedFile} 
          title=  {graphState.selectedAssetTitle}
          application={applicationId} 
          user={user} 
          handleClose={handleClose}
          onAssetSaved={onAssetSaved}
        />
      : null }

      {graphState.openJobDetailsDialog ?
        <AssetDetailsDialog
          assetType="job"
          assetId={graphState.selectedJob}
          nodes={graphState.nodes}
          edges={graphState.edges}
          nodeIndex={graphState.currentlyEditingNode ? graphState.currentlyEditingNode.id : ''}
          selectedAsset={graphState.selectedJob}
          title=  {graphState.selectedAssetTitle}
          selectedDataflow={graphState.selectedDataflow}
          application={applicationId}
          user={user}
          handleClose={handleClose}
          onAssetSaved={onAssetSaved}
        />
      : null}

      {graphState.openIndexDetailsDialog ?
        <AssetDetailsDialog 
          assetType="index" 
          assetId={graphState.selectedIndex} 
          nodes={graphState.nodes}
          selectedAsset={graphState.selectedIndex} 
          title=  {graphState.selectedAssetTitle}
          application={applicationId} 
          user={user} 
          handleClose={handleClose}
          onAssetSaved={onAssetSaved}/>
        : null}      

      {graphState.showSubProcessDetails ?         
          <SubProcessDialog
            show={graphState.showSubProcessDetails}
            applicationId={applicationId}
            selectedParentDataflow={selectedDataflow}
            onRefresh={onFileAdded}
            selectedSubProcess={graphState.selectedSubProcess}
            nodeId={graphState.currentlyEditingNode.id}/> : null}
        {graphState.showAssetListDlg ?
          <ExistingAssetListDialog
            show={graphState.showAssetListDlg}
            applicationId={applicationId}
            selectedDataflow={selectedDataflow}
            assetType={graphState.currentlyEditingNode.type}
            onClose={handleClose}
            onFileAdded={onFileAdded}
            user={user} 
            currentlyEditingNodeId={graphState.currentlyEditingNode.id}/>  : null}        
    </React.Fragment>
  )
}

export default AntdGraph;
