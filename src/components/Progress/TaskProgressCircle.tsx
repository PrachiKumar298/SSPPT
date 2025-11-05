import React from 'react';

type Props = {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
};

export function TaskProgressCircle({
  percent,
  size = 48,
  strokeWidth = 6,
  // lighter default colors for a softer look
  color = '#A78BFA',     // soft lavender
  bgColor = '#F3E8FF',   // pale lavender background stroke
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div style={{ width: size, height: size }} aria-hidden>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          <circle
            r={radius}
            cx={0}
            cy={0}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <circle
            r={radius}
            cx={0}
            cy={0}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            transform="rotate(-90)"
          />
        </g>
      </svg>
      <div
        style={{
          position: 'relative',
          marginTop: `-${size}px`,
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          fontSize: Math.max(10, Math.round(size / 4)),
          fontWeight: 600,
          color,
        }}
      >
        {clamped}%
      </div>
    </div>
  );
}
