/**
 * Tombolo-native equivalents of ECLWatch's HpccJSAdapter components.
 */
import * as React from 'react';
import type { Widget } from '@hpcc-js/common';

// ---------------------------------------------------------------------------
// useContainerSize — ResizeObserver-based size tracking
// ---------------------------------------------------------------------------
function useContainerSize(ref: React.RefObject<HTMLDivElement>): { width: number; height: number } {
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(el);

    // Seed with initial size
    const { width, height } = el.getBoundingClientRect();
    setSize({ width, height });

    return () => ro.disconnect();
  }, [ref]);

  return size;
}

// ---------------------------------------------------------------------------
// HpccJSComponent — fixed-size hpcc-js widget mount point
// ---------------------------------------------------------------------------
export interface HpccJSComponentProps {
  widget: Widget;
  width: number;
  height: number;
  debounce?: boolean;
  onReady?: () => void;
}

export const HpccJSComponent: React.FC<HpccJSComponentProps> = ({
  widget,
  width,
  height,
  debounce = true,
  onReady,
}) => {
  const id = React.useId();
  const divId = `hpcc-js-${id.replace(/:/g, '')}`;

  const setDivRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      widget?.target(node);
      if (node) {
        widget?.render();
      }
    },
    [widget]
  );

  React.useEffect(() => {
    if (widget?.target() && !isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
      widget.resize({ width, height });
      if (debounce) {
        widget.lazyRender(() => onReady?.());
      } else {
        widget.render(() => onReady?.());
      }
    }
  }, [debounce, height, onReady, widget, width]);

  return <div ref={setDivRef} id={divId} style={{ width, height, overflow: 'hidden', position: 'relative' }} />;
};

// ---------------------------------------------------------------------------
// AutosizeHpccJSComponent — fills its parent container
// ---------------------------------------------------------------------------
export interface AutosizeHpccJSComponentProps {
  widget: Widget;
  fixedHeight?: string;
  padding?: number;
  debounce?: boolean;
  hidden?: boolean;
  onReady?: () => void;
  children?: React.ReactNode;
}

export const AutosizeHpccJSComponent: React.FC<AutosizeHpccJSComponentProps> = ({
  widget,
  fixedHeight = '100%',
  padding = 0,
  debounce = true,
  hidden = false,
  onReady,
  children,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const innerWidth = Math.max(0, width - padding * 2);
  const innerHeight = Math.max(0, height - padding * 2);

  return (
    <div ref={containerRef} style={{ width: '100%', height: hidden ? '1px' : fixedHeight, position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          padding: `${padding}px`,
          display: hidden ? 'none' : 'block',
        }}>
        <HpccJSComponent
          widget={widget}
          debounce={debounce}
          width={innerWidth}
          height={innerHeight}
          onReady={onReady}
        />
      </div>
      {children && (
        <div
          style={{
            position: 'absolute',
            padding: `${padding}px`,
            display: hidden ? 'none' : 'block',
          }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// AutosizeComponent — centred content that fills its container (no widget)
// ---------------------------------------------------------------------------
export interface AutosizeComponentProps {
  fixedHeight?: string;
  padding?: number;
  hidden?: boolean;
  children?: React.ReactNode;
}

export const AutosizeComponent: React.FC<AutosizeComponentProps> = ({
  fixedHeight = '100%',
  padding = 0,
  hidden = false,
  children,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const innerWidth = Math.max(0, width - padding * 2);
  const innerHeight = Math.max(0, height - padding * 2);

  return (
    <div ref={containerRef} style={{ width: '100%', height: hidden ? '1px' : fixedHeight, position: 'relative' }}>
      {!hidden && (
        <div style={{ position: 'absolute', padding: `${padding}px` }}>
          <div
            style={{
              width: innerWidth,
              height: innerHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};
