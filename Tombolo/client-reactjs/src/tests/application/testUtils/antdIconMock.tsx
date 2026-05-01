export const monitoringTableIconMocks = {
  EyeOutlined: ({ onClick }) => (
    <button aria-label="view" onClick={onClick}>
      view
    </button>
  ),
  EditOutlined: ({ onClick }) => (
    <button aria-label="edit" onClick={onClick}>
      edit
    </button>
  ),
  DeleteOutlined: () => <span>del</span>,
  CheckCircleFilled: () => <span>approveIcon</span>,
  BellOutlined: () => <span>bell</span>,
  PlayCircleOutlined: () => <span>play</span>,
  PauseCircleOutlined: () => <span>pause</span>,
  CopyOutlined: () => <span>copy</span>,
  DownOutlined: () => <span>v</span>,
  WarningFilled: () => <span>!</span>,
  DashboardOutlined: () => <span>dash</span>,
};
