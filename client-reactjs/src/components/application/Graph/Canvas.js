import { Graph, Shape } from '@antv/x6';
import './Shape';

export default class Canvas {
  static graph;

  static init(container) {
    const graph = new Graph({
      container: container,
      autoResize: true,
      history: true,
      selecting: true,
      grid: true,
      connecting: {
        allowBlank: false,
        allowMulti: true,
        allowLoop: true,
        allowNode: true,
        allowEdge: true,
        allowPort: false,
        highlight: true,
        router: 'manhattan',
        connector: {
          name: 'rounded',
          args: {
            radius: 2,
          },
        },
        snap: {
          radius: 10,
        },
      },
      mousewheel: {
        enabled: true,
        zoomAtMousePosition: true,
        modifiers: 'ctrl',
        minScale: 0.5,
        maxScale: 3,
      },
      snapline: {
        enabled: true,
        sharp: true,
      },
      resizing: {
        enabled: true,
        orthogonal: false,
        restricted: false,
        allowReverse: false,
        preserveAspectRatio: false,
      },
      keyboard: true,
      clipboard: true,
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
        });
      },
    });

    this.graph = graph;
    return graph;
  }
}
