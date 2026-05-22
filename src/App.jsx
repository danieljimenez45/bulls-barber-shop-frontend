import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import PageLoader from "./components/PageLoader";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";

// ── Páginas públicas (lazy) ───────────────────────────────────────────────────
const Home     = lazy(() => import("./pages/Home"));
const Services = lazy(() => import("./pages/Services"));
const Gallery  = lazy(() => import("./pages/Gallery"));
const Reviews  = lazy(() => import("./pages/Reviews"));
const Booking  = lazy(() => import("./pages/Booking"));
const Contact  = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

// ── Panel de administración (lazy) ────────────────────────────────────────────
const AdminLogin       = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout      = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard   = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminReservas    = lazy(() => import("./pages/admin/AdminReservas"));
const AdminResenas     = lazy(() => import("./pages/admin/AdminResenas"));
const AdminServicios   = lazy(() => import("./pages/admin/AdminServicios"));
const ProtectedRoute   = lazy(() => import("./components/admin/ProtectedRoute"));

// ── Layout público (con Navbar + Footer) ─────────────────────────────────────
function PublicLayout({ children }) {
  return (
    <>
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      <Navbar />
      <main id="main-content">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              color: "#fff",
              border: "1px solid #2a2a2a",
            },
            success: { iconTheme: { primary: "#CC2020", secondary: "#fff" } },
          }}
        />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Rutas públicas ──────────────────────────────────────────── */}
            <Route
              path="/*"
              element={
                <PublicLayout>
                  <Routes>
                    <Route path="/"          element={<Home />}     />
                    <Route path="/servicios" element={<Services />} />
                    <Route path="/galeria"   element={<Gallery />}  />
                    <Route path="/resenas"   element={<Reviews />}  />
                    <Route path="/reservar"  element={<Booking />}  />
                    <Route path="/contacto"  element={<Contact />}  />
                    <Route path="*"          element={<NotFound />} />
                  </Routes>
                </PublicLayout>
              }
            />

            {/* ── Panel de administración (sin Navbar/Footer público) ─────── */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Rutas protegidas: ProtectedRoute redirige a /login si no hay sesión */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="reservas"   element={<AdminReservas />}   />
                <Route path="resenas"    element={<AdminResenas />}    />
                <Route path="servicios"  element={<AdminServicios />}  />
                {/* A-12: galería — siguiente tarea */}
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
