import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { Welcome } from './screens/Welcome';
import { Intro } from './screens/Intro';
import { TripForm } from './screens/TripForm';
import { Checklist } from './screens/Checklist';
import { Trips } from './screens/Trips';

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
          <Route path="/viajes" element={<Trips />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
