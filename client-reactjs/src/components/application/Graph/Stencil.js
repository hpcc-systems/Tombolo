import { Addon } from '@antv/x6';
import { i18n } from '../../common/Text';

export default class Stencil {
  static init(stencilContainer, graph) {
    const stencil = new Addon.Stencil({
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

    if (stencilContainer.current) {
      stencilContainer.current.appendChild(stencil.container);
    }

    this.addShape(graph, stencil);
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
        data: {
          isStencil: true,
          type: asset.type,
          title: asset.title,
          name: undefined,
          assetId: undefined,
        },
      });
    });

    stencil.load(assetsNodes, 'Assets');
  }
}
