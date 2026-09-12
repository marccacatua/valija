import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { Welcome } from './screens/Welcome';
import { Intro } from './screens/Intro';
import { TripForm } from './screens/TripForm';
import { Checklist } from './screens/Checklist';
import { Distribution } from './screens/Distribution';
import { Trips } from './screens/Trips';
import { Privacy } from './screens/Privacy';
import { Support } from './screens/Support';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/nuevo" element={<TripForm />} />
          <Route path="/viaje/:tripId" element={<Checklist />} />
          <Route path="/viaje/:tripId/distribucion" element={<Distribution />} />
          <Route path="/viajes" element={<Trips />} />
          <Route path="/privacidad" element={<Privacy />} />
          <Route path="/soporte" element={<Support />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
