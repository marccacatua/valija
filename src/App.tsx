import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { useTrips } from './hooks/useTrips';
import { Welcome } from './screens/Welcome';
import { Intro } from './screens/Intro';
import { TripForm } from './screens/TripForm';
import { Checklist } from './screens/Checklist';
import { Distribution } from './screens/Distribution';
import { Trips } from './screens/Trips';

// Bienvenida/intro son onboarding de primera vez, no una pantalla de
// carga que hay que ver en cada apertura. Si ya hay viajes guardados,
// vamos directo a "Mis viajes".
function Home() {
  const { trips } = useTrips();
  if (trips.length > 0) return <Navigate to="/viajes" replace />;
  return <Welcome />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/nuevo" element={<TripForm />} />
          <Route path="/viaje/:tripId" element={<Checklist />} />
          <Route path="/viaje/:tripId/distribucion" element={<Distribution />} />
          <Route path="/viajes" element={<Trips />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
