export function Logo() {
  return (
    <div className="pelota-wrap" aria-label="Low Team">
      <svg className="pelota" viewBox="0 0 64 64" role="img">
        <defs>
          <clipPath id="ballClip">
            <circle cx="32" cy="32" r="30" />
          </clipPath>
        </defs>
        <g clipPath="url(#ballClip)">
          <circle cx="32" cy="32" r="30" fill="#ffffff" />
          {/* pentagono central */}
          <polygon points="32,21 42.5,28.6 38.5,40.9 25.5,40.9 21.5,28.6" fill="#1e293b" />
          {/* parches del borde */}
          <polygon points="32,9 25.3,4.2 27.9,-3.7 36.1,-3.7 38.7,4.2" fill="#1e293b" />
          <polygon points="53.8,24.9 56.4,17 64.6,17 67.2,24.9 60.5,29.7" fill="#1e293b" />
          <polygon points="45.5,50.6 53.7,50.6 56.3,58.5 49.6,63.3 42.9,58.5" fill="#1e293b" />
          <polygon points="18.5,50.6 21.1,58.5 14.4,63.3 7.7,58.5 10.3,50.6" fill="#1e293b" />
          <polygon points="10.2,24.9 3.5,29.7 -3.2,24.9 -0.6,17 7.6,17" fill="#1e293b" />
          {/* costuras */}
          <g stroke="#1e293b" strokeWidth="2" strokeLinecap="round">
            <line x1="32" y1="21" x2="32" y2="2" />
            <line x1="42.5" y1="28.6" x2="60.5" y2="22.7" />
            <line x1="38.5" y1="40.9" x2="49.6" y2="56.3" />
            <line x1="25.5" y1="40.9" x2="14.4" y2="56.3" />
            <line x1="21.5" y1="28.6" x2="3.5" y2="22.7" />
          </g>
        </g>
        <circle cx="32" cy="32" r="30" fill="none" stroke="#1e293b" strokeWidth="2.5" />
      </svg>
      <span className="pelota-sombra" />
    </div>
  )
}
