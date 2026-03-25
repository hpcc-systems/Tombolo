import React, { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { List, ListImperativeAPI, RowComponentProps } from 'react-window';
import { Card, Input, Space, Tag, Tooltip, Typography } from 'antd';
import { SearchOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { SCOPE_TYPE_COLORS } from '@tombolo/shared';

const { Text } = Typography;

export interface ScopeMeta {
  scopeId: string;
  scopeName: string;
  scopeType: string;
  fileName?: string;
  TimeElapsed?: number;
}

export interface ScopeListHandle {
  scrollToItem(index: number, align?: 'auto' | 'center' | 'end' | 'start'): void;
}

interface RowData {
  items: ScopeMeta[];
  selectedId: string | null;
  focusedIndex: number;
  onSelect: (item: ScopeMeta) => void;
  onFocusChange: (index: number) => void;
}

interface Props {
  items?: ScopeMeta[];
  rowHeight?: number;
  onSelect?: (item: ScopeMeta) => void;
  loadMore?: () => void;
}

const defaultRowHeight = 52;

function Row({
  index,
  style,
  items,
  selectedId,
  focusedIndex,
  onSelect,
  onFocusChange,
}: RowComponentProps<RowData>): React.ReactElement | null {
  const item = items[index];
  const isFocused = focusedIndex === index;
  const isSelected = !!item && selectedId === item.scopeId;
  const rowRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isFocused && rowRef.current) {
      rowRef.current.focus({ preventScroll: true });
    }
  }, [isFocused]);

  if (!item) return null;

  const color = SCOPE_TYPE_COLORS[item.scopeType] || '#1677ff';

  return (
    <div
      ref={rowRef}
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      style={{
        ...style,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        backgroundColor: isSelected ? '#e6f4ff' : 'transparent',
        borderBottom: '1px solid #f5f5f5',
        borderLeft: isSelected ? '3px solid #1677ff' : '3px solid transparent',
        transition: 'all 0.15s ease',
        outline: 'none',
      }}
      onClick={() => {
        onFocusChange(index);
        onSelect(item);
      }}
      onFocus={() => onFocusChange(index)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          onFocusChange(Math.min(index + 1, items.length - 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          onFocusChange(Math.max(index - 1, 0));
        }
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = '#fafafa';
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}>
      <Space style={{ flex: 1, minWidth: 0 }} size={12}>
        <Tag
          color={color}
          style={{
            margin: 0,
            fontSize: 11,
            textTransform: 'capitalize',
            borderRadius: 4,
            padding: '0 6px',
            lineHeight: '20px',
            flexShrink: 0,
          }}>
          {item.scopeType}
        </Tag>
        <Tooltip title={item.fileName || item.scopeName} placement="top">
          <Text
            strong={isSelected}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}>
            {item.scopeName}
          </Text>
        </Tooltip>
      </Space>
      {item.TimeElapsed != null && (
        <Text
          type="secondary"
          style={{
            fontSize: 12,
            fontFamily: 'monospace',
            flexShrink: 0,
            marginLeft: 12,
          }}>
          {Number(item.TimeElapsed).toFixed(2)}s
        </Text>
      )}
    </div>
  );
}

const ScopeList = forwardRef<ScopeListHandle, Props>(
  ({ items = [], rowHeight = defaultRowHeight, onSelect, loadMore }, ref) => {
    const listRef = useRef<ListImperativeAPI>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [focusedIndex, setFocusedIndex] = useState<number>(0);
    const [searchText, setSearchText] = useState('');
    const loadMoreInFlight = useRef(false);

    useImperativeHandle(ref, () => ({
      scrollToItem(index: number, align: 'auto' | 'center' | 'end' | 'start' = 'auto') {
        listRef.current?.scrollToRow({ align, behavior: 'smooth', index });
      },
    }));

    const filteredItems = useMemo(() => {
      if (!searchText.trim()) return items;
      const lower = searchText.toLowerCase();
      return items.filter(
        item =>
          item.scopeName?.toLowerCase().includes(lower) ||
          item.scopeType?.toLowerCase().includes(lower) ||
          item.fileName?.toLowerCase().includes(lower)
      );
    }, [items, searchText]);

    const handleSelect = useCallback(
      (item: ScopeMeta) => {
        setSelectedId(item.scopeId);
        onSelect?.(item);
      },
      [onSelect]
    );

    const handleFocusChange = useCallback((index: number) => {
      setFocusedIndex(index);
      listRef.current?.scrollToRow({ behavior: 'smooth', align: 'auto', index });
    }, []);

    const rowProps = useMemo<RowData>(
      () => ({
        items: filteredItems,
        selectedId,
        focusedIndex,
        onSelect: handleSelect,
        onFocusChange: handleFocusChange,
      }),
      [filteredItems, selectedId, focusedIndex, handleSelect, handleFocusChange]
    );

    const handleRowsRendered = useCallback(
      ({ stopIndex }: { startIndex: number; stopIndex: number }) => {
        if (stopIndex >= filteredItems.length - 1 && loadMore && !loadMoreInFlight.current) {
          loadMoreInFlight.current = true;
          Promise.resolve(loadMore()).finally(() => {
            loadMoreInFlight.current = false;
          });
        }
      },
      [filteredItems.length, loadMore]
    );

    return (
      <Card
        title={
          <Space>
            <UnorderedListOutlined />
            <span>Scope List</span>
            <Tag style={{ marginLeft: 8, fontWeight: 'normal' }}>{filteredItems.length} items</Tag>
          </Space>
        }
        styles={{
          body: { padding: 0 },
          header: { borderBottom: '1px solid #f0f0f0' },
        }}>
        <div style={{ padding: '12px 12px 0 12px' }}>
          <Input
            placeholder="Filter scopes..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            style={{ marginBottom: 12 }}
          />
        </div>
        <div style={{ height: 480 }}>
          <List
            listRef={listRef}
            rowCount={filteredItems.length}
            rowHeight={rowHeight}
            rowComponent={Row}
            rowProps={rowProps}
            onRowsRendered={handleRowsRendered}
            style={{ height: '100%' }}
          />
        </div>
      </Card>
    );
  }
);
ScopeList.displayName = 'ScopeList';
export default ScopeList;
