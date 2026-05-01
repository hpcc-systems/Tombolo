export const createModalAntdMocks = () => {
  const MockModal = ({ open, title, footer, children, onCancel }) =>
    open ? (
      <div>
        <div data-testid="title">{title}</div>
        <div>{children}</div>
        <div>{footer}</div>
        <button aria-label="modal-cancel" onClick={onCancel}>
          x
        </button>
      </div>
    ) : null;

  const MockTabs = ({ items, activeKey, onChange }) => (
    <div>
      <div data-testid="tabs">
        {items.map(it => (
          <button key={it.key} aria-label={`tab-${it.key}`} onClick={() => onChange?.(it.key)}>
            {it.label}
          </button>
        ))}
      </div>
      <div data-testid="tab-content">{items.find(i => i.key === activeKey)?.children}</div>
    </div>
  );

  const MockButton = ({ children, onClick }) => <button onClick={onClick}>{children}</button>;
  const MockBadge = () => null;
  const MockCard = ({ children }) => <div>{children}</div>;

  return {
    Modal: MockModal,
    Tabs: MockTabs,
    Button: MockButton,
    Badge: MockBadge,
    Card: MockCard,
    notification: {
      success: () => undefined,
      error: () => undefined,
      warning: () => undefined,
      info: () => undefined,
    },
  };
};
