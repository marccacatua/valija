import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLastTripId } from '../hooks/useLastTripId';
import styles from './BottomNav.module.css';

type Tab = 'checklist' | 'nuevo' | 'viajes';

const ICONS: Record<Tab, (color: string) => ReactElement> = {
  checklist: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <rect x="9" y="2" width="6" height="5" rx="2.5" fill="none" stroke={color} strokeWidth="2.6" />
      <rect x="3" y="7" width="18" height="15" rx="5" fill={color} />
    </svg>
  ),
  nuevo: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <rect x="10" y="4" width="4" height="16" rx="2" fill={color} />
      <rect x="4" y="10" width="16" height="4" rx="2" fill={color} />
    </svg>
  ),
  viajes: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="4" rx="2" fill={color} />
      <rect x="3" y="11" width="18" height="4" rx="2" fill={color} />
      <rect x="3" y="17" width="12" height="4" rx="2" fill={color} />
    </svg>
  ),
};

export function BottomNav({ active }: { active: Tab }) {
  const navigate = useNavigate();
  const [lastTripId] = useLastTripId();

  const goChecklist = () => navigate(lastTripId ? `/viaje/${lastTripId}` : '/nuevo');

  const tabs: { key: Tab; label: string; onClick: () => void }[] = [
    { key: 'checklist', label: 'Valija', onClick: goChecklist },
    { key: 'nuevo', label: 'Nuevo', onClick: () => navigate('/nuevo') },
    { key: 'viajes', label: 'Viajes', onClick: () => navigate('/viajes') },
  ];

  return (
    <div className={styles.nav}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        const color = isActive ? '#FF6A3D' : '#B4A79B';
        return (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={tab.onClick}
          >
            {ICONS[tab.key](color)}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
