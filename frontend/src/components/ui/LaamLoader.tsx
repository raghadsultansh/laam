'use client';

interface LaamLoaderProps {
  size?: 'small' | 'medium' | 'large';
}

const sizes = {
  small:  { px: 46,  strokeWidth: 9, r: 55 },
  medium: { px: 80,  strokeWidth: 7, r: 55 },
  large:  { px: 130, strokeWidth: 6, r: 55 },
};

export function LaamLoader({ size = 'medium' }: LaamLoaderProps) {
  const { px, strokeWidth, r } = sizes[size];
  const circumference = 2 * Math.PI * r; // ~345.6

  return (
    <>
      <style>{`
        @keyframes laam-ring {
          0%   { stroke-dashoffset: ${circumference}; }
          65%  { stroke-dashoffset: 0; }
          85%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: ${circumference}; }
        }
        @keyframes laam-doc-pulse {
          0%,100% { opacity: 0.25; transform: scale(0.8); }
          50%     { opacity: 1;    transform: scale(1); }
        }
        .laam-spinner {
          fill: none;
          stroke: white;
          stroke-linecap: round;
          stroke-dasharray: ${circumference};
          stroke-dashoffset: ${circumference};
          animation: laam-ring 3s cubic-bezier(0.4,0,0.2,1) infinite;
        }
        .laam-doc {
          transform-origin: 65px 65px;
          animation: laam-doc-pulse 3s ease-in-out infinite;
        }
      `}</style>

      <svg
        width={px}
        height={px}
        viewBox="0 0 130 130"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Loading"
        role="status"
      >
        <circle
          className="laam-spinner"
          cx="65"
          cy="65"
          r={r}
          strokeWidth={strokeWidth}
        />
        <g className="laam-doc">
          <g transform="translate(40 30) scale(0.385)">
            <path
              d="M 8 45 L 45 8 Q 53 0 65 0 L 118 0 Q 130 0 130 12 L 130 168 Q 130 180 118 180 L 12 180 Q 0 180 0 168 L 0 57 Q 0 49 8 45 Z"
              fill="#1d8570"
            />
            <path
              d="M 45 8 L 45 38 Q 45 45 38 45 L 8 45 Z"
              fill="#4fc3ad"
            />
          </g>
        </g>
      </svg>
    </>
  );
}
