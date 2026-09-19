import React from "react";
import { Helmet } from "react-helmet-async";

const SITE_NAME = "CASNAGGI — Care Support for the Needy & Good Governance Initiative";

// Canonical and og:url must be absolute; a bare path is invalid and stops
// social unfurls resolving at all. Override per environment with
// REACT_APP_SITE_URL (set it in netlify.toml or the Netlify UI).
const SITE_BASE = (
  process.env.REACT_APP_SITE_URL || "https://casnaggi.org"
).replace(/\/$/, "");

const DEFAULT_OG_IMAGE =
  "https://images.pexels.com/photos/28702872/pexels-photo-28702872.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1400";

const Seo = ({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  keywords = "CASNAGGI, Nigerian NGO, humanitarian, good governance, Bayelsa, civic education, women empowerment, youth empowerment, charity Nigeria",
  noindex = false,
}) => {
  const fullTitle = title ? `${title} · CASNAGGI` : SITE_NAME;
  const url = `${SITE_BASE}${path}`;

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="CASNAGGI" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1400" />
      <meta property="og:image:height" content="900" />
      <meta property="og:locale" content="en_NG" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Misc */}
      <meta name="theme-color" content="#E05A47" />
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow"}
      />
    </Helmet>
  );
};

export default Seo;
