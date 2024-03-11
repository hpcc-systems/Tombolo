import { Stencil as StencilUtil } from '@antv/x6-plugin-stencil';
import { i18n } from '../../common/Text';

export default class Stencil {
  static init(stencilContainer, graph) {
    const stencil = new StencilUtil({
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
        const data = { isStencil: false };

        if (node.data.type === 'Sub-Process') {
          data.isCollapsed = false;
        }

        if (node.data.type === 'Monitor') {
          data.type = 'FileTemplate';
          data.title = 'Template';
        }

        return node.clone().setData(data);
      },
    });

    this.addShape(graph, stencil);

    if (stencilContainer.current) {
      stencilContainer.current.appendChild(stencil.container);
    }
  }

  static addShape(graph, stencil) {
    const assets = [
      { type: 'Job', title: i18n('Job') },
      { type: 'File', title: i18n('File') },
      { type: 'Monitor', title: i18n('Monitoring') },
      { type: 'Index', title: i18n('Index') },
      { type: 'Sub-Process', title: i18n('Sub-Process') },
    ];

    const assetsNodes = assets.map((asset) => {
      return graph.createNode({
        shape: 'custom-shape',

        attrs: {
          body: {
            fill: '#2ECC71', // Background color
            stroke: '#000', // Border color
          },
        },
        data: {
          isStencil: true,
          type: asset.type,
          title: asset.title,
          name: undefined,
          assetId: undefined,
        },
      });
    });

    console.log(assetsNodes);

    stencil.load(assetsNodes, 'Assets');
  }
}
