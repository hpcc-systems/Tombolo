// VS Code-style sidebar panel toggle icons.
// Uses `currentColor` so the caller controls the color via CSS.
// Default stroke is dark (#1f1f1f) so they read well on white/light backgrounds.

export const LeftPanelIcon = ({ color = '#333131' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* outer border */}
    <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="1.5" stroke={color} strokeWidth="1.2" />
    {/* filled left panel */}
    <rect x="1.5" y="1.5" width="4" height="13" rx="0.75" fill={color} />
    {/* divider */}
    <line x1="5.5" y1="1.5" x2="5.5" y2="14.5" stroke={color} strokeWidth="0.8" opacity="0.35" />
  </svg>
);

export const RightPanelIcon = ({ color = '#333131' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* outer border */}
    <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="1.5" stroke={color} strokeWidth="1.2" />
    {/* filled right panel */}
    <rect x="10.5" y="1.5" width="4" height="13" rx="0.75" fill={color} />
    {/* divider */}
    <line x1="10.5" y1="1.5" x2="10.5" y2="14.5" stroke={color} strokeWidth="0.8" opacity="0.35" />
  </svg>
);
