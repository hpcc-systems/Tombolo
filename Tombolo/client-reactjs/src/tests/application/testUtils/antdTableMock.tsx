import { vi } from 'vitest';

export const createTableAntdMocks = () => {
  const MockTable = ({ dataSource = [], columns = [], rowSelection }) => (
    <div>
      <div data-testid="headers">
        {columns.map((column, index) => (
          <div key={index}>{column.title}</div>
        ))}
      </div>
      <div data-testid="rows">
        {dataSource.map((row, rowIndex) => (
          <div key={row.id ?? rowIndex} data-testid={`row-${rowIndex}`}>
            {columns.map((column, columnIndex) => {
              const value = column.dataIndex ? row[column.dataIndex] : row;
              const content = column.render ? column.render(value, row) : value;

              return (
                <div key={columnIndex} data-testid={`cell-${rowIndex}-${columnIndex}`}>
                  {content}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {rowSelection ? (
        <button aria-label="select-first" onClick={() => rowSelection.onChange?.([dataSource[0]?.id], [dataSource[0]])}>
          select-first
        </button>
      ) : null}
    </div>
  );

  const MockTooltip = ({ children }) => <>{children}</>;
  const MockPopover = ({ children, content }) => (
    <div>
      <span>{children}</span>
      <div data-testid="popover">{content}</div>
    </div>
  );

  const MockPopconfirm = ({ children, onConfirm }) => (
    <span>
      <button aria-label="confirm" onClick={onConfirm}>
        confirm
      </button>
      {children}
    </span>
  );

  const MockTag = ({ children }) => <span>{children}</span>;

  return {
    Table: MockTable,
    Tooltip: MockTooltip,
    Popover: MockPopover,
    Popconfirm: MockPopconfirm,
    Tag: MockTag,
    notification: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
};
