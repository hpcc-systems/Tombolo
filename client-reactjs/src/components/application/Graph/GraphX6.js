import React, { useCallback, useState } from 'react';
import { useEffect, useRef } from 'react';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import '@antv/x6-react-shape';
import { message, notification } from 'antd';
import { debounce } from 'lodash';
import { useSelector } from 'react-redux';
import './GraphX6.css';

import Event from './Event';
import Canvas from './Canvas';
import Stencil from './Stencil';
// import Keyboard from './Keyboard';
import CustomToolbar from './Toolbar/Toolbar';

import AssetDetailsDialog from '../AssetDetailsDialog';
import ExistingAssetListDialog from '../Dataflow/ExistingAssetListDialog';
import Shape from './Shape.js';
import { colors } from './graphColorsConfig.js';
import { getWorkingCopyGraph, saveWorkingCopyGraph } from '../../common/CommonUtil.js';


const NOTIFICATION_CONF={
  placement:'top',
  style:{
    width:'auto',
    maxWidth:'750px'
  }
}

const defaultState = {
  openDialog: false,
  assetId: '',
  title: '',
  name: '',
  type: '',
  nodeId: '',
  cell: null, // cell is save to state when open modal
  nodes: [], // needed for scheduling
};

function GraphX6({ readOnly = false, monitoring, statuses }) {
  const graphRef = useRef();
  const miniMapContainerRef = useRef();
  const graphContainerRef = useRef();
  const stencilContainerRef = useRef();
  const subFileList = useRef({});  //  useState does not want to work with fileList, always showing empty object
  const [graphReady, setGraphReady] = useState(false);
  const [sync, setSync] = useState({ error: '', loading: false });
  const [configDialog, setConfigDialog] = useState({ ...defaultState });

  const { applicationId, dataflowId, clusterId } = useSelector((state) => state.dataflowReducer);

  const handleContextMenu = (action, payload) => {
    if (action === 'openDialog') {
      const node = payload.node;
      setConfigDialog(() => ({
        ...node.getData(),
        cell: node,
        nodeId: node.id,
        openDialog: true,
        nodes: graphRef.current.getNodes().reduce((acc, el) => {
          // we dont need Nodes full object but just what is inside node.data
          const nodeData = el.getData();
          if (nodeData.assetId) {
            acc.push({ ...nodeData, nodeId: el.id });
          }
          return acc;
        }, []),
      }));
    }

    if (action === 'toggleSubProcess') {
      const node = payload.node;
      let data = node.getData(); // will get current data, will be stale after data got updated;
    
      if (!data.isCollapsed) {
        const prevSize = node.getSize();
        node.updateData({ isCollapsed: true, prevSize }, { name: 'update-asset' }).resize(90, 70);
        node.prop('originSize', { height: 90, width: 70 });
      } else {
        node.resize(data.prevSize.width, data.prevSize.height);
        const position = node.getPosition();
        node.prop('originSize', data.prevSize);
        node.prop('originPosition', position);
        node.updateData({ isCollapsed: false, prevSize: null }, { name: 'update-asset' });
      }
    
      data = node.getData(); // get updated data
      const cells = node.getChildren(); // get nested nodes
    
      if (cells) {
        // find first and last job;
        let firstJob;
        let lastJob;
    
        let minX = 0;
        let maxX = 0;
    
        cells.forEach((cell) => {
          if (cell.data?.type === 'Job') {
            const position = cell.getPosition();
            if (!minX) {
              minX = position.x;
              firstJob = cell;
            } else if (position.x < minX) {
              minX = position.x;
              firstJob = cell;
            }
    
            if (!maxX) {
              maxX = position.x;
              lastJob = cell;
            } else if (position.x > maxX) {
              maxX = position.x;
              lastJob = cell;
            }
          }
        });
    
        if (data.isCollapsed) {
          if (firstJob) {
            const incomingEdges = graphRef.current.getIncomingEdges(firstJob);
            if (incomingEdges) incomingEdges.forEach((edge) => edge.setTarget(node)); // will point all incoming edges of first job to subprocess node
          }
    
          if (lastJob) {
            const outgoingEdges = graphRef.current.getOutgoingEdges(lastJob);
            if (outgoingEdges) outgoingEdges.forEach((edge) => edge.setSource(node)); // will point all outgoing edges of last job from subprocess node
          }
    
          cells.forEach((cell) => cell.hide());
        } else {
          cells.forEach((cell) =>{
            cell.show()
            cell.toFront();
          });
    
          const incomingEdges = graphRef.current.getIncomingEdges(node);
          const outgoingEdges = graphRef.current.getOutgoingEdges(node);
    
          if (incomingEdges && firstJob) incomingEdges.forEach((edge) => edge.setTarget(firstJob));
          if (outgoingEdges && lastJob) outgoingEdges.forEach((edge) => edge.setSource(lastJob));
        }
      }
    }
  };

  const deleteAssetFromDataFlow = async (nodeData, dataflowId) =>{
    // Delete from any scheduled records after deleted node.
    const dependentNodes = graphRef.current.getNodes().filter(node=> node.data?.schedule?.dependsOn?.includes(nodeData.assetId));    
    dependentNodes.forEach(node=> node.updateData({schedule:null}));
  }

  useEffect(() => {
    notification.config({ top: 70, maxCount:1, duration: 8  });
    // INITIALIZING EVENT CANVAS AND STENCIL
    const graph = Canvas.init(graphContainerRef, miniMapContainerRef, readOnly);
    graph.dataflowId = dataflowId; //adding dataflowId value to graph instance to avoid pulling it from redux everywhere;
    graphRef.current = graph;

    Shape.init({ handleContextMenu, disableContextMenu: readOnly , graph});

    if (!readOnly) {
      Stencil.init(stencilContainerRef, graph);
      Event.init(graph, handleContextMenu); // some static event that does not require local state changes will be sitting here
      // Keyboard.init(graph); // not ready yet
    }
 

    // FETCH SAVED GRAPH
    (async () => {
      try {
        // Get working copy from LS if its not there then pull latest from life version;
        const wcGraph = getWorkingCopyGraph(dataflowId);
        if (wcGraph && !monitoring) {          
          // Adding origin to graph instance, will be used in versions list
          graph.origin = {...wcGraph?.origin };
          graph.fromJSON(wcGraph);
        } else {
          const response = await fetch(`/api/dataflowgraph?dataflowId=${dataflowId}`, {headers: authHeader()});
          if (!response.ok) handleError(response);
          const data = await response.json();
          const timestamp = new Date().toLocaleString();
      
          if (data?.graph) {
            graph.fromJSON(data.graph);

            if (!monitoring) {
              graph.origin = { parent: data.name, createdAt: timestamp, updatedAt: timestamp };
              handleSave(graph)
              notification.success({ message: `Working Copy is up to date with "LIVE" version "${data.name}"`, ...NOTIFICATION_CONF });
            }
          } else {
            if (!monitoring) {
              graph.origin = { parent: '', createdAt: timestamp, updatedAt: timestamp };
              handleSave(graph);
              notification.success({
                message: "Your Working Copy is ready",
                description: 'There is no "LIVE" version currently congfigured, check the versions list to find different versions available',
                ...NOTIFICATION_CONF
              });
            }
          }
        }
      } catch (error) {
        console.log(error);
        message.error("Could not download graph nodes");
      }

      if (readOnly){
        const nodes = graph.getNodes();
        const edges = graph.getEdges();
        
        edges.forEach(edge => edge.removeTools() );
  
        nodes.forEach(node => {
          node.removeTools();
          node.removePorts();
        });
      }

      let ctrlPressed = false;
      let embedPadding =20;
      
      graph.on('node:embedding', ({ e }) => { ctrlPressed = e.metaKey || e.ctrlKey })
      graph.on('node:embedded', () => { ctrlPressed = false })

        // graph.on('node:change:parent', (args: {
        //   cell: Cell
        //   node: Node
        //   current?: number  // 当前值
        //   previous?: number // 改变之前的值
        //   options: any      // 透传的 options
        // }) => { })

      graph.on('node:change:parent', ({cell}) => { 
        cell.toFront();
      });
  
      graph.on('node:change:size', ({ node, options }) => {
        if (options.skipParentHandler) return

        const children = node.getChildren()
        if (children && children.length) {
          node.prop('originSize', node.getSize())
        }
      })
  
      graph.on('node:change:position', ({ node, options }) => {
        if (options.skipParentHandler || ctrlPressed) return
        
        const children = node.getChildren()
        if (children && children.length) {
          node.prop('originPosition', node.getPosition())
        }
  
        const parent = node.getParent()
  
        if (parent && parent.isNode()) {
          let originSize = parent.prop('originSize')

          if (originSize == null) {
            originSize = parent.getSize()
            parent.prop('originSize', originSize)
          }
  
          let originPosition = parent.prop('originPosition')
          if (originPosition == null) {
            originPosition = parent.getPosition()
            parent.prop('originPosition', originPosition)
          }
  
          let x = originPosition.x
          let y = originPosition.y
          let cornerX = originPosition.x + originSize.width
          let cornerY = originPosition.y + originSize.height
          let hasChange = false
  
          const children = parent.getChildren()
          if (children) {
            children.forEach((child) => {
              const bbox = child.getBBox().inflate(embedPadding)
              const corner = bbox.getCorner()
  
              if (bbox.x < x) {
                x = bbox.x
                hasChange = true
              }
  
              if (bbox.y < y) {
                y = bbox.y
                hasChange = true
              }
  
              if (corner.x > cornerX) {
                cornerX = corner.x
                hasChange = true
              }
  
              if (corner.y > cornerY) {
                cornerY = corner.y
                hasChange = true
              }
            })
          }
  
          if (hasChange) {
            const updateProps ={
              position: { x, y },
            };
            if (!parent.data.isCollapsed){
              updateProps.size = { width: cornerX - x, height: cornerY - y };
            }
            parent.prop( updateProps , { skipParentHandler: true } )
            // Note that we also pass a flag so that we know we shouldn't
             // adjust the `originPosition` and `originSize` in our handlers.
          }
        }
      })
    
  
      graph.on('node:dblclick', ({ node, e }) => {
        // Subprocess modal has only description field its ok to open anytime;
        if (node.data.type === 'Sub-Process') return handleContextMenu('openDialog', { node });
        // if job or file is not associated then we will not open modal;
        if (readOnly && !node.data.assetId ) return
        // open modal if we are editing;
        handleContextMenu('openDialog', { node });
        
      });
      
      if (!readOnly) {
        // restrict readonly users to save changes to DB
        graph.on('node:removed', async ({ cell }) => {
          const nodeData = cell.getData();
          try {
          /* deleting asset from dataflow is multi step operation
          1. delete asset from Asset_Dataflow table
          2. make sure that any Job scheduled with this asset is deleted too
          3. update graph in Dataflowgraph table */
            if (nodeData.type === 'Sub-Process') {
              // if we delete subprocess we need to delete all nested children too
              const children = cell.getChildren();
              if (children) {
                const assets = children.filter(child => child.data?.assetId)
                await Promise.all(assets.map(asset => deleteAssetFromDataFlow(asset.data,dataflowId)))
              }
            } else if (nodeData.assetId) {
              await deleteAssetFromDataFlow(nodeData,dataflowId)
            }
             handleSave(graph);
          } catch (error) {
            console.log(error);
            message.error('Could not delete an asset');
          }
        });

        graph.on('node:moved', async ({ cell, options }) => {
          // console.log('node:moved')
           handleSave(graph);
        });

        graph.on('node:added', async ({ node, index, options }) => {
          console.log('node:added');
           handleSave(graph);
        });

        graph.on('node:change:data', async ({ node, options }) => {
          // ignoring hover events and not saving to db when in readOnly mode
          if (options.ignoreEvent || readOnly) return;

          if (options.name === 'update-asset') {
            // console.log("node:change:data")
             handleSave(graph);
          }
        });

        graph.on('node:change:visible', async ({ node, options }) => {
          if (options.name === 'update-asset') {
            // console.log("node:change:visible")
             handleSave(graph);
          }
        });

        // EDGE REMOVE TRIGGERS 'remove' event, and same event is triggered when nodes getting removed. because node removal is multistep operation, we need to have separate listeners for both
        graph.on('edge:added', async ({ edge, index, options }) => {
           handleSave(graph);
        });

        graph.on('edge:removed', async () => {
           handleSave(graph);
        });

        graph.on('edge:connected', async ({ isNew, edge }) => {
          console.log('edge:connected');
          if (isNew) {
            const sourceCell = edge.getSourceCell();
            const targetCell = edge.getTargetCell();
        
            if (sourceCell.data.type === 'File' && targetCell.data.type === 'File') {
              if (sourceCell.data.isSuperFile || targetCell.data.isSuperFile) {
                let superfileCell;
                let fileCell;
                if (sourceCell.data.isSuperFile) {
                  superfileCell = sourceCell;
                  fileCell = targetCell;
                } else {
                  superfileCell = targetCell;
                  fileCell = sourceCell;
                }
        
                const superFileAssetId = superfileCell.data.assetId;
                const superfilename = superfileCell.data.name;
                const subFileName = fileCell.data.name;
        
                // Check in cached list if this subfile exists;
                const cachedSubFiles = subFileList.current[superfilename];

                // Settings for superfile edge view
                const superFileEdgeStyle ={
                  line: { targetMarker: { fill: colors.superFileArrow, stroke: colors.superFileArrow, name: 'block' }, stroke: colors.superFileArrow, strokeDasharray: 0 , strokeWidth:"2"},
                }
        
                if (cachedSubFiles) {
                  if (!cachedSubFiles.includes(subFileName)) {
                    edge.remove();
                    message.error(`${subFileName} does not exist in superfile ${superfilename}`);
                  }
        
                  edge.setSource(fileCell);
                  edge.setTarget(superfileCell);
                  edge.attr(superFileEdgeStyle);
                  return; // Checked in cached list, connection is valid,  exit function;
                }
        
                try {
                  const options = {
                    method: 'POST',
                    headers: authHeader(),
                    body: JSON.stringify({ superFileAssetId }),
                  };
        
                  const response = await fetch('/api/file/read/superfile_meta', options);
                  if (!response.ok) handleError(response);
        
                  const subfiles = await response.json();
        
                  // Cache result of call in state and look up from list next time there is a new connection to avoid multiple calls;
                  subFileList.current[superfilename] = subfiles;
        
                  if (!subfiles.includes(subFileName)) {
                    message.error(`${subFileName} does not exist in superfile ${superfilename}`);
                    edge.remove();
                  } else {
                    edge.setSource(fileCell);
                    edge.setTarget(superfileCell);
                    edge.attr(superFileEdgeStyle);
                  }
                } catch (error) {
                  console.log('-error-----------------------------------------');
                  console.dir({ error }, { depth: null });
                  console.log('------------------------------------------');
                  message.error(error.message);
                  edge.remove();
                }
              } else {
                edge.remove();
              }
            }
          }
           handleSave(graph);
        });
      }

      // !! graph.history.on('change' stop firing when nodes moved a lot, switched to multiple event listeners, bug reported. https://github.com/antvis/X6/issues/1828
      // graph.history.on('change', async ({ cmds, options }) => {
      //   if (cmds[0].event === 'cell:change:tools' || readOnly) return; // ignoring hover events and not saving to db when in readOnly mode
      //   const actions = ['dnd', 'mouse', 'add-edge', 'add-asset', 'update-asset'];
      //   if (actions.includes(options?.name)) {
      //      handleSave(graph);
      //   }
      // });

      setGraphReady(true);
      //  will scale graph to fit in to a viewport, will add bottom padding for read only views as they have a table too
      graph.zoomToFit({ maxScale: 1, padding: 20 });
    })();

    return () => notification.destroy(); // Remove all the notifications if unmounted
  
  }, []);

  useEffect(() => {
    if (graphReady && readOnly === true && statuses?.length > 0) {
      let fileMonitoringTemplate = graphRef.current.getNodes().find((node) => node.data.isMonitoring);
      if (fileMonitoringTemplate) fileMonitoringTemplate.updateData({status:'wait'})

      let nodes = graphRef.current.getNodes().filter((node) => node.data.type === 'Job' || node.data.type === 'Sub-Process');
      nodes.forEach((node) => {
        const children = node.getChildren()
        if(children) {
          let subprocessStatus = '';

          children.forEach(node =>{
            if(node.data?.type === 'Job' ){
              const nodeStatus = statuses.find((status) => status.assetId === node.data.assetId);
              if(nodeStatus) subprocessStatus = nodeStatus.status;
            }
          })

           node.updateData({ status: subprocessStatus })
        } else {
          const nodeStatus = statuses.find((status) => status.assetId === node.data.assetId);
          if (nodeStatus) {
            node.updateData({ status: nodeStatus.status });
          } else {
            node.updateData({ status: '' }); // change status to '' if you want to return regular node || 'not-exist'
          }
        }
      });
    }
  }, [statuses, readOnly, graphReady]);

  const handleSave = useCallback(
    debounce((graph) => {
      if (graph.isFrozen()) return; // when graph is frozen ignore all the saves
    
      const graphToJson = graph.toJSON({ diff: true });
      // Copy origin from graph instance and update updatedAt field to be saved to local storage.
      //graph.toJSON will ignore origin field as it is not the part of their API, we add it as a custom field and need to copy it manually.
      graphToJson.origin  = {...graph.origin, updatedAt: new Date().toLocaleString() };
      saveWorkingCopyGraph(dataflowId, graphToJson);
    }, 500),
    []
  );

  const saveNewAsset = async (newAsset) => {
    // console.time('jobFileRelation');
    if (newAsset) {
      const cell = configDialog.cell;
      /* updating cell will cause a POST request to '/api/dataflowgraph/save with latest nodes and edges*/

      const cellData =   {
        name: newAsset.name,
        assetId: newAsset.id,
        title: newAsset.title,
        isAssociated: newAsset.isAssociated
      }

      if(newAsset.assetType === "File"){
        cellData.isSuperFile = newAsset.isSuperFile ? true : false;
      }

      if(newAsset.assetType === "FileTemplate"){
        // when we add FileTemplate we will show only FileTemplate that has a file monitoring configured
        // this flag will add a time icon and orange border to node.
        cellData.isMonitoring = newAsset.isMonitoring; 
      }

      if (newAsset.assetType === "Job"){
        cellData.jobType = newAsset.jobType;
        cellData.fetchingFiles = true;
        cellData.schedule = null;
      }
      //Close modal and show syncing indicator on node
      setConfigDialog(prev =>({...prev, openDialog: false}));

      cell.updateData( cellData, { name: 'update-asset' } );

      try {
        // Getting Job - File relations set up
        const jobtypes = ['Job', 'Modeling', 'Scoring', 'ETL', 'Query Build', 'Data Profile'];

        if (configDialog.type === 'Job' && newAsset.isAssociated && jobtypes.includes(newAsset.jobType)) {
          // CREATE JOB FILE RELATIONSHIP
          const options = {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify({ jobId: newAsset.id, dataflowId }),
          };
          const response = await fetch('/api/job/jobFileRelation', options);
          if (!response.ok) handleError(response);
          const realtedFiles = await response.json();

          if (realtedFiles.length > 0) {
            addRelatedFiles(realtedFiles, cell);
          }
        }
      } catch (error) {
        console.log(error);
        message.error('Could not download graph nodes');
      }
      cell.updateData({ fetchingFiles: false }, { name: 'update-asset' } );
    }

    setConfigDialog({ ...defaultState }); // RESETS LOCAL STATE AND CLOSES DIALOG
    // console.timeEnd('jobFileRelation');
  };

  const addRelatedFiles = (relatedFiles, cell) => {
    // 1. get all files,
    const allFiles = graphRef.current.getNodes().filter((node) => node.data.type === 'File' || node.data.type === 'FileTemplate');

    const nodePositions = cell.getProp('position'); // {x,y} of node on a graph
    const yOffset = 70;
    const xOffset = 140;
    // input and output files comes mixed in one array, we will keep track how many output and input files by counting them so we can add proper distance between them;
    const yAxis = {
      input: 0,
      output: 0,
    };

    relatedFiles.forEach((relatedFile) => {
      // 2. find existing files on graph and add edge to point to them
      const fileExistsOnGraph = allFiles.find((file) => file.data.assetId === relatedFile.assetId);

      let newNode;

      const relatedFileData ={
        type: relatedFile.assetType || 'File',
        name: relatedFile.name,
        title: relatedFile.title,
        assetId: relatedFile.assetId,
        isSuperFile: relatedFile.isSuperFile,
        isAssociated: relatedFile.isAssociated,
        subProcessId: undefined,
      };

      if (!fileExistsOnGraph) {
        // 3. create file nodes, place input file on top and output below job node.
        relatedFile.file_type === 'input' ? (yAxis.input += 1) : (yAxis.output += 1); // calculate how many input and output files to give them proper positioning

        const newNodeIndex = relatedFile.file_type === 'input' ? yAxis.input - 1 : yAxis.output - 1;
        const newNodeX =
          relatedFile.file_type === 'input' ? nodePositions.x - xOffset : nodePositions.x + xOffset;
        const newNodeY = nodePositions.y + yOffset * newNodeIndex;

        newNode = graphRef.current.addNode({
          x: newNodeX,
          y: newNodeY,
          shape: 'custom-shape',
          data: relatedFileData
        });

        allFiles.push(newNode); // adding to allFiles to avoid creating new File node
      } else{
        fileExistsOnGraph.updateData(relatedFileData, { name: 'update-asset' });
      }

      const relateFileNode = fileExistsOnGraph ? fileExistsOnGraph : newNode;

      const edges = graphRef.current.getConnectedEdges(relateFileNode);
      // if we have edged associated with this file it means that they were just created now while syncing, loop through them and find out if they related to this Job,
      // if edge between job and file already exists, that means that this file if Input and Output at same time, update edge marker to have two arrows green and red
      let edgeUpdated = false;

      if (edges.length > 0) {
        edges.forEach((edge) => {
          if (edge.getTargetCellId() === cell.id || edge.getSourceCellId() === cell.id) {
            edge.attr({
              line: {
                sourceMarker: { fill: colors.inputArrow, stroke: colors.inputArrow, name: 'block' },
                targetMarker: { fill: colors.outputArrow, stroke: colors.outputArrow, name: 'block' },
                stroke: {
                  type: 'linearGradient',
                  stops: [
                    { offset: '0%', color: colors.inputArrow },
                    { offset: '50%', color: '#ccc' },
                    { offset: '100%', color: colors.outputArrow },
                  ],
                },
              },
            });
            edgeUpdated = true; // if we successfully updated edge we will not need to create additional edges anymore
          }
        });
      }

      if (!edgeUpdated) {
        const edge = {
          target: relatedFile.file_type === 'output' ? relateFileNode : cell,
          source: relatedFile.file_type === 'output' ? cell : relateFileNode,
          zIndex: -1,
          attrs: {
            line: {
              stroke: relatedFile.file_type === 'output' ? colors.outputArrow : colors.inputArrow, // green for output, red for input
            },
          },
        };

        
        graphRef.current.addEdge(edge, { name: 'add-asset' });
      }
    });
  };

  const updateAsset = async (asset) => {
    if (asset) {
      const cell = configDialog.cell;
      if (cell.data.type === "Job" || cell.data.type === "File" || cell.data.type === "FileTemplate"){
        // if asset just got associated then we need to save it as new so it can get updated and fetch related files;
        if (!cell.data?.isAssociated && asset.isAssociated){
          // Cell is associated and renamed, new asset is created and assigned to this node, old asset should be removed from this dataflow
          if (cell.data.name !== asset.name) await deleteAssetFromDataFlow(cell.data, dataflowId )
            
          return saveNewAsset({
            ...cell.data,
            id: asset.assetId,
            name: asset.name,
            title: asset.title,
            assetType: cell.data.type,
            isAssociated: asset.isAssociated,
          })
        }
      }

      const newCellData = {
        name: asset.name,
        title: asset.title,
        description: cell.data.type === 'Sub-Process' ?  asset.description : null
      };
       
      cell.updateData(newCellData, { name: 'update-asset' });
    }
    setConfigDialog({ ...defaultState }); // RESETS LOCAL STATE AND CLOSES DIALOG
  };

  const addToSchedule = (schedule) =>{
    // schedule :
    //   type: Predecessor | Time | Template | ""
    //   cron: cronExpression string | ""
    //   dependsOn: [assetId] - cant be job | template
    
    const cell = configDialog.cell;
    
    const existingScheduledEdge = cell.data?.schedule?.scheduleEdgeId;
    const existingScheduledTime = cell.data?.schedule?.cron;
    
    const newCellData ={};

    // newCellData: {
    //   schedule: {
    //     cron: cronExpression string | ""
    //     type: Predecessor | Time | Template | ""
    //     dependsOn: [assetId] - cant be job | template
    //     scheduleEdgeId?: string | undefined // graph edge Id 
    //   } | NULL
    // } 

    if (schedule.type === 'Time') {
      newCellData.schedule = schedule
    }
    
    if (schedule.type === 'Predecessor' || schedule.type === 'Template') {
      // find a graph node that will be a source and clicked node will be a targed, add an edge;
      const sourceAssetId = schedule.dependsOn[0] //asset.dependsOn[0];
      const sourceNode = configDialog.nodes.find((node) => node.assetId === sourceAssetId);
  
      // there can be only one scheduled edge
      // if edge is already exist then we should delete it and create a new one
      if (existingScheduledEdge) graphRef.current.removeEdge(cell.data.schedule.scheduleEdgeId); 
      
      if (sourceNode) {
        const newEdge = graphRef.current.addEdge({
          target: cell,
          source: sourceNode.nodeId,
          attrs: {
            line: {
              strokeDasharray: '5 5', // WILL MAKE EDGE DASHED
            },
          }, 
        });

        newEdge.setData({scheduled: true});

        newCellData.schedule = {
          ...schedule,
          scheduleEdgeId: newEdge.id,
        };
      }
    }
        
    // If node was removed from schedule we will remove edge
    if (existingScheduledEdge && !schedule.type) {
      graphRef.current.removeEdge(cell.data.schedule.scheduleEdgeId);
      newCellData.schedule = null;
    }
    
    // remove time data from node if time schedule was removed
    if (existingScheduledTime && !schedule.type) {
      newCellData.schedule = null;
    }
    
    cell.updateData(newCellData, { name: 'update-asset' });
  }
  
  const handleSync = async () => {
    const graphJSON = graphRef.current.toJSON({ diff: true });

    try {
      setSync(() => ({ loading: true, error: '' }));
      const cellsJSON = graphJSON.cells.reduce(
        (acc, cell) => {
          if (cell.shape === 'edge') {
            acc.edges.push(cell);
          } else {
            // Add only Job that can produce files, ignore Manual Jobs or  templates
            if (cell.data.type === 'Job' && cell.data.jobType !== 'Manual' && cell.data.assetId) {
              acc.jobsToServer.push({ id: cell.data.assetId, name: cell.data.name });
              acc.jobs.push(cell);
            }
            if (cell.data.type === 'File' && cell.data.assetId) {
              acc.files.push(cell);
            }
          }
          return acc;
        },
        { jobs: [], files: [], edges: [], jobsToServer: [] }
      );

      const options = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          applicationId: applicationId,
          dataflowId: dataflowId,
          clusterId: clusterId,
          jobList: cellsJSON.jobsToServer,
        }),
      };

      const response = await fetch('/api/job/syncDataflow', options);
      if (!response.ok) handleError(response);

      const data = await response.json();

      const result = data.result; // array of {job:<assetId>, relatedFiles:{...}}
      const assetsIds = data.assetsIds; // array of strings of all assetIds created or modified on backend

      const { files, jobs, edges } = cellsJSON;
      // console.log('-data-----------------------------------------');
      // console.dir({ data, files, jobs, edges }, { depth: null });
      // console.log('------------------------------------------');

      if (result?.length > 0) {
        result.forEach((el) => {
          if (el.relatedFiles.length > 0) {
            const cellJSON = jobs.find((existingJob) => {
              return existingJob.data.assetId === el.job;
            });
            const cell = graphRef.current.getCellById(cellJSON.id);
            // REMOVE FILE THAT DOES NOT PARTICIPATE ANYMORE AND ALL EDGES, RECREATE EDGES IN addRelatedFiles();
            const incomingEdges = graphRef.current.getIncomingEdges(cell); // Job Input Files
            const outgoingEdges = graphRef.current.getOutgoingEdges(cell); // Job Output Files

            if (incomingEdges) {
              incomingEdges.forEach((edge) => {
                const source = edge.getSourceNode();
                if (source) {
                  const isFile = source.data.type === 'File' || source.data.type ===  'FileTemplate'
                  if (isFile) {
                    const fileExist = assetsIds.includes(source.data.assetId); // assetsIds is array of all assets in this dataflow
                    if (!fileExist) {
                      source.remove(); // Delete a File from graph because after syncing we found that it is no used in any job in this dataflow
                    } else {
                      graphRef.current.removeEdge(edge); //
                    }
                  }
                }
              });
            }

            if (outgoingEdges) {
              outgoingEdges.forEach((edge) => {
                const target = edge.getTargetNode();
                if (target) {
                  const isFile = target.data.type === 'File' || target.data.type === 'FileTemplate';
                  if (isFile) {
                    const fileExist = assetsIds.includes(target.data.assetId);
                    if (!fileExist) {
                      target.remove();
                    } else {
                      graphRef.current.removeEdge(edge);
                    }
                  }
                }
              });
            }

            // ADD NEW EDGES
            addRelatedFiles(el.relatedFiles, cell);
          }
        });
      }

      setSync((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      console.log('-error-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');

      setSync((prev) => ({ ...prev, error: error.message, loading: false }));
      message.error('Could not synchronize graph ');
    }
  };

  const getGraphDialog = () => {    
    if (configDialog.assetId || (!configDialog.assetId && configDialog.type === 'Sub-Process')) {
      if (graphRef.current.isFrozen()) readOnly = true; 
      return (
        <AssetDetailsDialog
          show={configDialog.openDialog}
          clusterId={clusterId}
          selectedDataflow={{ id: dataflowId }}
          nodes={configDialog.nodes}
          onClose={updateAsset}
          addToSchedule={addToSchedule}
          viewMode={readOnly} // THIS PROP WILL REMOVE EDIT OPTIONS FROM MODAL
          displayingInModal={true} // used for control button in modals
          selectedAsset={{ // all we know about clicked asset will be passed in selectedAsset prop
            id: configDialog.assetId,
            type: configDialog.type,
            title: configDialog.title,
            nodeId: configDialog.nodeId,
            schedule: configDialog.schedule,
            description: configDialog.description,
            isAssociated: configDialog.isAssociated
          }}
        />
      );
    } else {
      return (
        <ExistingAssetListDialog
          onClose={saveNewAsset}
          show={configDialog.openDialog}
          clusterId={clusterId}
          dataflowId={dataflowId}
          applicationId={applicationId}
          assetType={configDialog.type}
          nodes={configDialog.nodes}
        />
      );
    }
  };  
  
  return (
    <>
      <CustomToolbar graphRef={graphRef} handleSync={handleSync} isSyncing={sync.loading}  readOnly={readOnly}/>
      <div className="graph-container">
        {readOnly ? null : <div className="stencil" ref={stencilContainerRef} />}
        <div className={`${readOnly ? 'graph-container-readonly' : 'graph-container-stencil'}`} ref={graphContainerRef} />
        <div className="graph-minimap" ref={miniMapContainerRef} />
      </div>
      {configDialog.openDialog ? getGraphDialog() : null}
    </>
  );
}

export default GraphX6;
