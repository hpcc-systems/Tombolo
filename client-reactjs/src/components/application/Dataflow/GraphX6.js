import React, { useState } from 'react'
import { useEffect, useRef } from 'react';
import { authHeader, handleError } from "../../common/AuthHeader.js";
import '@antv/x6-react-shape';

import Event from '../Graph/Event';
import Canvas from '../Graph/Canvas';
import Stencil from '../Graph/Stencil';
import Keyboard from '../Graph/Keyboard';
import { useDispatch, useSelector } from 'react-redux';
import { message } from 'antd';

import AssetDetailsDialog from "../AssetDetailsDialog"
import ExistingAssetListDialog from "./ExistingAssetListDialog";
import SubProcessDialog from "./SubProcessDialog";


const defaultState= {
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
}

function GraphX6() {
  const graphRef = useRef();
  const stencilRef = useRef();
  const {applicationId, applicationTitle, dataflowId, user} = useSelector(state => state.dataflowReducer);
 
  const [graphState, setGraphState] = useState({...defaultState});

const dispatch = useDispatch();

  useEffect(() => {
    const graph = Canvas.init(graphRef.current);
    Stencil.init(stencilRef.current, graph);
    // Event.init(graph, graphRef);
    Keyboard.init(graph);

    // get saved graph
    (async () => {
        try {
          const response = await fetch(`/api/dataflowgraph?application_id=${applicationId}&dataflowId=${dataflowId}`, { headers: authHeader(), });
          if (!response.ok) handleError(response);
          const data = await response.json();

          if (data) {
            // Nodes and Edges comes as a string, need to parse it to object
            const nodes = data.nodes ? JSON.parse(data.nodes) : [];
            const edges = data.edges ? JSON.parse(data.edges) : [];
            console.log('-nodes-----------------------------------------');
            console.dir({nodes}, { depth: null });
            console.log('------------------------------------------');
            
            nodes.forEach((node) => {
              graph.addNode({
                id: node.id,
                x: node.x,
                y: node.y,
                shape: 'custom-shape',
                data: {
                  type: node.type,
                  text: node.title,
                },
              });
            });
      
            edges.forEach((edge) => {
              graph.current.addEdge({ source: edge.source, target: edge.target});
            });
          }

        } catch (error) {
          console.log(error);
          message.error('Could not download graph nodes');
        }
    })();

    console.log(`Graph`, graph);

      graph.on('node:mouseenter', ({ node }) => {
        // Show visible ports
        const ports = graphRef.current.querySelectorAll('.x6-port-body');
        ports.forEach(port => (port.style.visibility = 'visible'));
        // add a remove button
        node.addTools([
          {
            name: 'button-remove',
     
          },
          {
            name: 'button',
            args: {
              markup: [
                {
                  tagName: 'text',
                  textContent: 'Hide',
                  selector: 'icon',
                  attrs: {
                    fill: '#fe854f',
                    fontSize: 10,
                    textAnchor: 'middle',
                    cursor: 'pointer',
                    fontSize: '13px',
                  },
                },
              ],
              x: '100%',
              y: 3,
              // offset: { x: -20, y: 10 },
              onClick({ cell }) {
                console.log('hello');
              },
            },
          },
        ]);
      });
  
      graph.on('node:mouseleave', ({ node }) => {
        // hide visible ports
        const ports = graphRef.current.querySelectorAll('.x6-port-body');
        ports.forEach(port => (port.style.visibility = 'hidden'));
        // hide remove button
        node.removeTools();
      });
  
      graph.on('edge:mouseenter', ({ edge }) => {
        //add a remove button to edge
        edge.addTools({ name: 'button-remove', args: { distance: -40 } });
      });
  
      graph.on('edge:mouseleave', ({ edge }) => {
        //hide a remove button
        edge.removeTools();
      });

      graph.on('node:dblclick', (params) => {
        console.log('-params-----------------------------------------');
        console.dir({params}, { depth: null });
        console.log('------------------------------------------');
        
        // openDetailsDialog(cell);
      })  
  
      graph.on('node:added', ({ node, index, options }) => { })
      graph.on('node:removed', ({ node, index, options }) => { })
      graph.on('node:changed', ({ node, options }) =>  { })
      
      graph.on('edge:added', ({ edge, index, options }) => { })
      graph.on('edge:removed', ({ edge, index, options }) => { })
      graph.on('edge:changed', ({ edge, options }) => { })

  }, []);

  const openDetailsDialog = (cell) => {

    console.log(graphState)
//     switch(cell.attrs.props.type) {
//       case 'File':
//         if(cell.attrs.props.fileId == undefined || cell.attrs.props.fileId == '') {
//           setGraphState({
//             ...graphState,
//             currentlyEditingNode: {id: cell.id, type: cell.attrs.props.type},            
//             showAssetListDlg: true,
//             isNew :true
//           })            
//         } else {
//           setGraphState({
//             ...graphState,
//             isNew: false,
//             openFileDetailsDialog: true,
//             selectedFile: cell.attrs.props.fileId,
//             selectedNodeId: cell.id,
//             selectedAssetTitle: cell.attrs.props.title
//           })            
//           dispatch(assetsActions.assetSelected(
//             cell.attrs.props.fileId,
//             applicationId,
//             ''
//           ));
//         }

//         break;
//       case 'Job':
//       case 'Modeling':
//       case 'Scoring':
//       case 'ETL':
//       case 'Query Build':
//       case 'Data Profile':
//         //for opening details
//         if(cell.attrs.props.jobId == undefined || cell.attrs.props.jobId == '') {
//           setGraphState({
//             ...graphState,
//             showAssetListDlg: true,
//             currentlyEditingNode: {id: cell.id, type: cell.attrs.props.type}            
//           })            
//         } else {
//           setGraphState({
//             ...graphState,
//             isNewJob: false,
//             openJobDetailsDialog: true,
//             selectedJob: cell.attrs.props.jobId,
//             selectedAssetTitle: cell.attrs.props.title,
//             selectedJobType: cell.attrs.props.type == 'Job' ? 'General' : cell.attrs.props.jobType,
//           })
//           dispatch(assetsActions.assetSelected(
//             cell.attrs.props.jobId,
//             applicationId,
//             ''
//           ));
//         }
//         break;
//       case 'Index':
//         let isNewIndex = false;
//         if(cell.attrs.props.indexId == undefined || cell.attrs.props.indexId == '') {
//           setGraphState({
//             ...graphState,
//             showAssetListDlg: true,
//             currentlyEditingNode: {id: cell.id, type: cell.attrs.props.type}
//           })            
//         } else {
//           setGraphState({
//             ...graphState,
//             isNewIndex: false,
//             openIndexDetailsDialog: true,
//             selectedIndex: cell.attrs.props.indexId,
//             selectedAssetTitle: cell.attrs.props.title,
//           })

//           dispatch(assetsActions.assetSelected(
//             cell.attrs.props.indexId,
//             applicationId,
//             ''
//           ));
//         }
//         break;
//       case 'Sub-Process':
//         setGraphState({
//           ...graphState,
//           selectedSubProcess: {"id": cell.attrs.props.subProcessId, "title":cell.attrs.props.title},
//           showSubProcessDetails: true
//         })
//         break;
//        default:
//          return
//    }
  }

  return (
    <>
      <div id="container">
        <div id="stencil" ref={stencilRef} />
        <div id="graph-container" ref={graphRef} />
      </div>
      {/* {graphState.openFileDetailsDialog ?
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
            currentlyEditingNodeId={graphState.currentlyEditingNode.id}/>  : null}   */}
    </>
  );
}

export default GraphX6;
