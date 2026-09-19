import React from "react";
import { Outlet, useLocation } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingActions from "../components/FloatingActions";

/**
 * Chrome for the marketing site. The admin area renders outside this, so it
 * never inherits the public header, footer or floating buttons.
 */
const PublicLayout = () => {
  const { pathname } = useLocation();

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      {/* Homepage only for now. Living here rather than inside Home.jsx means
          extending it to /contact or /donate is a one-line change. */}
      {pathname === "/" && <FloatingActions />}
    </>
  );
};

export default PublicLayout;
