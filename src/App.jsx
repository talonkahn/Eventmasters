import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { useEffect } from 'react';

import Home          from './pages/Home';
import BrowseEvents  from './pages/BrowseEvents';
import EventDetail   from './pages/EventDetail';
import Checkout      from './pages/Checkout';
import PaymentResult from './pages/PaymentResult';
import SignIn        from './pages/SignIn';
import SignUp        from './pages/SignUp';
import MyTickets     from './pages/MyTickets';
import Contact       from './pages/Contact';
import About         from './pages/About';
import Terms         from './pages/Terms';
import Privacy       from './pages/Privacy';
import NotFound      from './pages/NotFound';
import AdminDashboard from './pages/admin/Dashboard';

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/"               element={<Home />} />
              <Route path="/events"         element={<BrowseEvents />} />
              <Route path="/events/:slug"   element={<EventDetail />} />
              <Route path="/checkout"       element={<Checkout />} />
              <Route path="/payment-result" element={<PaymentResult />} />
              <Route path="/sign-in"        element={<SignIn />} />
              <Route path="/sign-up"        element={<SignUp />} />
              <Route path="/contact"        element={<Contact />} />
              <Route path="/about"          element={<About />} />
              <Route path="/terms"          element={<Terms />} />
              <Route path="/privacy"        element={<Privacy />} />
              <Route path="/my-tickets"     element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
              <Route path="/admin"          element={<ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/organizer/*"    element={<ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="*"              element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
