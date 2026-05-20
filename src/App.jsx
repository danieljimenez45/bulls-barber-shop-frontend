import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import PageLoader from "./components/PageLoader";
import ErrorBoundary from "./components/ErrorBoundary";

const Home     = lazy(() => import("./pages/Home"));
const Services = lazy(() => import("./pages/Services"));
const Gallery  = lazy(() => import("./pages/Gallery"));
const Reviews  = lazy(() => import("./pages/Reviews"));
const Booking  = lazy(() => import("./pages/Booking"));
const Contact  = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <BrowserRouter>
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
      <Navbar />
      <main>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"          element={<Home />}     />
              <Route path="/servicios" element={<Services />} />
              <Route path="/galeria"   element={<Gallery />}  />
              <Route path="/resenas"   element={<Reviews />}  />
              <Route path="/reservar"  element={<Booking />}  />
              <Route path="/contacto"  element={<Contact />}  />
              <Route path="*"          element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <WhatsAppButton />
    </BrowserRouter>
  );
}
