import React from 'react';
import { usePageMetaTitle } from '../../utils/pageMeta.js';
import './AboutPage.css';

function AboutPage() {
  usePageMetaTitle('Hakkimizda | Openwall Finance');

  return (
    <div className="about-root">
      <img
        src="/about/about.png"
        alt="Openwall Finance Hakkimizda"
        className="about-image"
      />
    </div>
  );
}

export default AboutPage;
