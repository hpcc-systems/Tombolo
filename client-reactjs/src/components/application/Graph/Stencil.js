import { Addon } from '@antv/x6';

export default class Stencil {
  static stencil;

  static init(stencilContainer, graph) {
    this.stencil = new Addon.Stencil({
      title: 'Assets',
      target: graph,
      layoutOptions: {
        columns: 1,
        columnWidth: 80,
        rowHeight: 75,
      },
      stencilGraphWidth: 100,
      stencilGraphHeight: 400,
      groups: [
        {
          name: 'Assets',
          title: 'Assets',
          collapsable: false,
        },
      ],
      getDropNode(node) {
        return node.clone().setData({isStencil:false})
      }
    });

    if (stencilContainer.current) {
      stencilContainer.current.appendChild(this.stencil.container);
    }

    this.addShape(graph);
  }

  static addShape(graph) {
    const assets = [{type : 'Job', title : 'Job'}, {type : 'File', title : 'File'},{type: 'FileTemplate', title : 'File Group'} , {type : 'Index', title : 'Index'}, {type : 'Sub-Process', title : 'Sub-Process'}];

    const assetsNodes = assets.map(asset => {
      return graph.createNode({
        shape: 'custom-shape',
        data: {
          isStencil:true,
          type: asset.type,
          title: asset.title,
          name:undefined,
          assetId: undefined,
          subProcessId: undefined,
        },
      });
    });

    this.stencil.load(assetsNodes, 'Assets');
  }
}
