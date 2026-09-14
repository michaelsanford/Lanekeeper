import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * LanekeeperLogo: The official application emblem.
 * Visually combines floating swimming pool lane ropes (with buoy markers)
 * and an aligned forward-moving beacon locked in the center track,
 * embodying both 'swimlane' and 'keep to your lane'.
 */
export const LanekeeperLogo: React.FC<IconProps> = ({
  size = 24,
  className = '',
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {/* Left swimlane divider cable */}
    <line x1="5.5" y1="2" x2="5.5" y2="22" strokeWidth="1.5" stroke="currentColor" opacity="0.65" />
    {/* Left lane buoy floats */}
    <rect x="4" y="3.5" width="3" height="2.5" rx="1.25" fill="currentColor" stroke="none" />
    <rect x="4" y="9" width="3" height="2.5" rx="1.25" fill="currentColor" stroke="none" />
    <rect x="4" y="14.5" width="3" height="2.5" rx="1.25" fill="currentColor" stroke="none" />
    <rect x="4" y="19" width="3" height="2.5" rx="1.25" fill="currentColor" stroke="none" />

    {/* Right swimlane divider cable */}
    <line x1="18.5" y1="2" x2="18.5" y2="22" strokeWidth="1.5" stroke="currentColor" opacity="0.65" />
    {/* Right lane buoy floats */}
    <rect x="17" y="3.5" width="3" height="2.5" rx="1.25" fill="currentColor" stroke="none" />
    <rect x="17" y="9" width="3" height="2.5" rx="1.25" fill="currentColor" stroke="none" />
    <rect x="17" y="14.5" width="3" height="2.5" rx="1.25" fill="currentColor" stroke="none" />
    <rect x="17" y="19" width="3" height="2.5" rx="1.25" fill="currentColor" stroke="none" />

    {/* Center Lane: Forward beacon staying inside the lane */}
    <path
      d="M12 4.5 L15.5 10.5 L12 9.25 L8.5 10.5 Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
    />

    {/* Center Lane: Guided bottom pool line */}
    <line x1="12" y1="12.5" x2="12" y2="15" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="18" x2="12" y2="21" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * SwimlaneIcon: Represents the multi-lane Kanban board.
 * Depicts 3 distinct swimlane tracks divided by segmented lane ropes.
 */
export const SwimlaneIcon: React.FC<IconProps> = ({
  size = 24,
  className = '',
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {/* Outer boundary / pool perimeter */}
    <rect x="2" y="3" width="20" height="18" rx="3" strokeWidth="1.75" />

    {/* Lane divider 1 with buoy markers */}
    <line x1="8.5" y1="3" x2="8.5" y2="21" strokeWidth="1.5" strokeDasharray="3 2.5" />
    {/* Lane divider 2 with buoy markers */}
    <line x1="15.5" y1="3" x2="15.5" y2="21" strokeWidth="1.5" strokeDasharray="3 2.5" />

    {/* Active cards / swimmers inside each lane */}
    <rect x="4" y="6" width="2.5" height="4" rx="0.75" fill="currentColor" stroke="none" />
    <rect x="4" y="12" width="2.5" height="6" rx="0.75" fill="currentColor" opacity="0.6" stroke="none" />
    <rect x="10.75" y="8" width="2.5" height="8" rx="0.75" fill="currentColor" stroke="none" />
    <rect x="17.5" y="6" width="2.5" height="5" rx="0.75" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * LaneKeepIcon: Represents the Flight Deck focus mode ("Keep to your lane").
 * Shows dual lane boundary guidelines with an aligned, forward-focused
 * navigator locked in the center track without lateral deviation.
 */
export const LaneKeepIcon: React.FC<IconProps> = ({
  size = 24,
  className = '',
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {/* Left lane boundary line */}
    <line x1="5" y1="3" x2="5" y2="21" strokeWidth="2" />
    <path d="M3 7 L5 7" strokeWidth="1.5" />
    <path d="M3 17 L5 17" strokeWidth="1.5" />

    {/* Right lane boundary line */}
    <line x1="19" y1="3" x2="19" y2="21" strokeWidth="2" />
    <path d="M19 7 L21 7" strokeWidth="1.5" />
    <path d="M19 17 L21 17" strokeWidth="1.5" />

    {/* Center aligned navigator locked inside lane */}
    <path
      d="M12 4.5 L16 11 L12 9.5 L8 11 Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
    />

    {/* Center lane guidance dashes */}
    <line x1="12" y1="13" x2="12" y2="16" strokeWidth="2" />
    <line x1="12" y1="18.5" x2="12" y2="21" strokeWidth="2" />
  </svg>
);

/**
 * SwimlaneBuoyIcon: A swimming pool lane divider buoy float.
 * Used for lane color indicators and column headers.
 */
export const SwimlaneBuoyIcon: React.FC<IconProps> = ({
  size = 16,
  className = '',
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {/* Central lane line cable */}
    <line x1="1" y1="8" x2="15" y2="8" strokeWidth="1.25" opacity="0.6" />
    {/* Cylindrical buoy body */}
    <rect x="3.5" y="4" width="9" height="8" rx="3" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.5" />
    {/* Inner wave-breaker ribs */}
    <line x1="6.5" y1="4.5" x2="6.5" y2="11.5" strokeWidth="1.25" />
    <line x1="9.5" y1="4.5" x2="9.5" y2="11.5" strokeWidth="1.25" />
  </svg>
);

/**
 * LaneLimitAlertIcon: Represents exceeding a swimlane's WIP capacity.
 * Depicts a lane boundary with an overflow warning barrier.
 */
export const LaneLimitAlertIcon: React.FC<IconProps> = ({
  size = 16,
  className = '',
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {/* Warning triangle */}
    <path d="M8 2 L14.5 13.5 L1.5 13.5 Z" strokeWidth="1.5" strokeLinejoin="round" />
    {/* Exclamation */}
    <line x1="8" y1="6" x2="8" y2="9.5" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="11.75" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);
