import React, { useState, useEffect, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CircularGallery from './components/CircularGallery';
import './index.css';

function WorkGallery() {
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading projects:', err);
        setLoading(false);
      });
  }, []);

  const getProjectCategory = (project) => {
    const text = (project.title + " " + (project.desc || "")).toLowerCase();
    if (text.includes("shop") || text.includes("e-commerce") || text.includes("store") || text.includes("cart") || text.includes("checkout")) {
      return "ecommerce";
    }
    if (text.includes("landing") || text.includes("starter") || text.includes("page") || text.includes("vercel") || text.includes("blueprint")) {
      return "landing";
    }
    return "corporate";
  };

  const filteredProjects = projects.filter(p => {
    if (filter === 'all') return true;
    return getProjectCategory(p) === filter;
  });

  const galleryItems = filteredProjects.map(p => ({
    image: p.img ? p.img : `https://api.microlink.io/?url=${encodeURIComponent(p.link)}&screenshot=true&embed=screenshot.url`,
    text: p.title,
    link: p.link
  }));

  return (
    <div>
      <div className="portfolio-filters anim-fade-up anim-visible">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Works
        </button>
        <button 
          className={`filter-btn ${filter === 'landing' ? 'active' : ''}`}
          onClick={() => setFilter('landing')}
        >
          Landing Pages
        </button>
        <button 
          className={`filter-btn ${filter === 'corporate' ? 'active' : ''}`}
          onClick={() => setFilter('corporate')}
        >
          Corporate
        </button>
        <button 
          className={`filter-btn ${filter === 'ecommerce' ? 'active' : ''}`}
          onClick={() => setFilter('ecommerce')}
        >
          E-Commerce
        </button>
      </div>

      <section className="portfolio-grid-section anim-fade-up anim-visible" style={{ padding: '20px 0 80px 0' }}>
        {loading ? (
          <p style={{ textAlign: 'center', opacity: 0.6, fontStyle: 'italic' }}>Loading projects...</p>
        ) : galleryItems.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.6, fontStyle: 'italic', padding: '40px' }}>
            No projects found in this category.
          </p>
        ) : (
          <div style={{ height: '600px', position: 'relative', width: '100%' }}>
            <CircularGallery
              items={galleryItems}
              bend={3}
              textColor="#ffffff"
              borderRadius={0.05}
              scrollEase={0.02}
              fontUrl="https://fonts.googleapis.com/css2?family=Space+Mono:wght@700&display=swap"
              font="bold 24px 'Space Mono'"
            />
          </div>
        )}
      </section>
    </div>
  );
}

const rootEl = document.getElementById('work-gallery-root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <WorkGallery />
    </StrictMode>
  );
}
