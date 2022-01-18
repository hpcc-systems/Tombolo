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
    });

    if (stencilContainer) {
      stencilContainer.appendChild(this.stencil.container);
    }

    this.addShape(graph);
  }

  static addShape(graph) {
    const assetsNames = ['Job', 'File', 'Index', 'SubProcess'];

    const assetsNodes = assetsNames.map(asset => {
      return graph.createNode({
        shape: 'custom-shape',
        data: {
          type: asset,
          title: asset,
          assetId: undefined,
          subProcessId: undefined,
        },
      });
    });

    this.stencil.load(assetsNodes, 'Assets');
  }
}
