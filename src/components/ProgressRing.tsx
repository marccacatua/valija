export function ProgressRing({ pct, color = '#FF6A3D', size = 54 }: { pct: number; color?: string; size?: number }) {
  const deg = Math.round(pct * 3.6);
  const inner = size - 14;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `conic-gradient(${color} ${deg}deg, #F6E7D8 0)`,
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: 9999,
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: '1000 13px/1 Nunito, sans-serif',
          color: 'var(--ink)',
        }}
      >
        {pct}%
      </div>
    </div>
  );
}
