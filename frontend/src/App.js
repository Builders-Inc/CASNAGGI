import React, { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import { Toaster } from "sonner";
import "@/App.css";
import PublicLayout from "./layouts/PublicLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Programs from "./pages/Programs";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Impact from "./pages/Impact";
import GetInvolved from "./pages/GetInvolved";
import Donate from "./pages/Donate";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Its own chunk, so visitors to the marketing site never download the admin UI.
const AdminApp = lazy(() => import("./admin/AdminApp"));

const AdminFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-brand-sand/40">
    <Loader2 className="h-6 w-6 animate-spin text-brand-terracotta" />
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* Declared first, and outside PublicLayout, so the admin area
                renders without the marketing header and footer. */}
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminApp />
                </Suspense>
              }
            />

            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:slug" element={<EventDetail />} />
              <Route path="/impact" element={<Impact />} />
              <Route path="/get-involved" element={<GetInvolved />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/contact" element={<Contact />} />
              {/* Previously rendered <Home />, which returned a soft 200 for
                  every mistyped URL. */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <Toaster position="top-right" richColors closeButton />
        </BrowserRouter>
      </div>
    </HelmetProvider>
  );
}

export default App;
