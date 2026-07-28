import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Layers, MapPin, ChevronRight, Compass, Info, Navigation, Activity } from 'lucide-react';

const CampusMap = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('campus'); // 'campus' or 'floors'
  const [selectedFloor, setSelectedFloor] = useState(1);

  // Zoom & Pan states
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Check if redirect has set a specific floor
    if (location.state && location.state.selectedFloor) {
      setActiveTab('floors');
      setSelectedFloor(Number(location.state.selectedFloor));
    }
  }, [location]);

  // Reset zoom & pan on changes
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [activeTab, selectedFloor]);

  const handleMouseDown = (e) => {
    if (zoom === 1) return; // Only allow pan if zoomed
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Bounds limit based on zoom factor
    const limit = (zoom - 1) * 200;
    const clampedX = Math.max(-limit, Math.min(limit, newX));
    const clampedY = Math.max(-limit, Math.min(limit, newY));
    
    setPosition({ x: clampedX, y: clampedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(4, prev + 0.5));
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const next = Math.max(1, prev - 0.5);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Карта и навигация</h1>
      </div>

      {/* ROUTE CARD TO YANDEX MAPS */}
      <a 
        href="https://yandex.ru/maps/?text=СПб,+Кронверкский+пр.,+49" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="route-card"
      >
        <div className="route-left">
          <div className="route-icon">
            <MapPin size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3>Как добраться до корпуса ИВИТШ</h3>
            <span>Санкт-Петербург, Кронверкский проспект, д. 49 (Главное здание)</span>
          </div>
        </div>
        <ChevronRight className="route-arrow" size={20} />
      </a>

      {/* VIEW SWITCHER */}
      <div className="map-view-switcher">
        <button 
          className={`map-switch-btn ${activeTab === 'campus' ? 'active' : ''}`}
          onClick={() => setActiveTab('campus')}
        >
          <Map size={18} /> Схема кампуса («Улей»)
        </button>
        <button 
          className={`map-switch-btn ${activeTab === 'floors' ? 'active' : ''}`}
          onClick={() => setActiveTab('floors')}
        >
          <Layers size={18} /> Поэтажные планы ИВИТШ
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'campus' ? (
          <motion.div 
            key="campus"
            className="campus-image-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <h3>Корпус ИВИТШ — Схема «Улей»</h3>
            <p style={{ color: '#666', fontSize: '0.95rem', margin: 0 }}>
              Наш корпус имеет удобное деление на секции. Используйте кнопки управления или перетаскивайте карту после приближения.
            </p>
            
            <div 
              className="map-viewport-container" 
              style={{ marginTop: '10px', cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img 
                src="/img/campus-map.png" 
                alt="Схема Улей" 
                className="map-zoomable-image"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                }}
              />
              
              <div className="map-zoom-overlay-controls">
                <button className="zoom-control-btn" onClick={handleZoomIn} title="Приблизить">+</button>
                <button className="zoom-control-btn" onClick={handleZoomOut} title="Отдалить">-</button>
                <button className="zoom-control-btn" onClick={handleResetZoom} title="Сбросить" style={{ fontSize: '14px' }}>↺</button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="floors"
            className="campus-image-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Схемы этажей корпуса</h3>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>Нажмите кнопку для выбора нужного этажа</p>
              </div>
              
              <div className="floor-tabs" style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4].map(f => (
                  <button 
                    key={f} 
                    className={`floor-tab ${selectedFloor === f ? 'active' : ''}`}
                    onClick={() => setSelectedFloor(f)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #dee2e6',
                      background: selectedFloor === f ? 'var(--primary)' : 'white',
                      color: selectedFloor === f ? 'white' : '#666',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {f} этаж
                  </button>
                ))}
              </div>
            </div>

            <div 
              className="map-viewport-container" 
              style={{ marginTop: '20px', cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <AnimatePresence mode="wait">
                <motion.img 
                  key={selectedFloor}
                  src={`/img/floors/${selectedFloor}.png`} 
                  alt={`${selectedFloor} этаж`}
                  className="map-zoomable-image"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                  }}
                />
              </AnimatePresence>

              <div className="map-zoom-overlay-controls">
                <button className="zoom-control-btn" onClick={handleZoomIn} title="Приблизить">+</button>
                <button className="zoom-control-btn" onClick={handleZoomOut} title="Отдалить">-</button>
                <button className="zoom-control-btn" onClick={handleResetZoom} title="Сбросить" style={{ fontSize: '14px' }}>↺</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEGEND & NAVIGATION TIPS */}
      <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: '750', color: 'var(--text)' }}>Обозначения на схемах</h4>
          <div className="legend-items">
            <div className="legend-item">
              <Compass size={18} />
              <span>Главный вход</span>
            </div>
            <div className="legend-item">
              <Navigation size={18} />
              <span>Ступеньки / Лестницы</span>
            </div>
            <div className="legend-item">
              <Info size={18} />
              <span>Гардероб & Санузлы</span>
            </div>
            <div className="legend-item">
              <Activity size={18} />
              <span>Медпункт / Коворкинг</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', background: 'rgba(0, 127, 255, 0.05)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(0, 127, 255, 0.1)' }}>
          <Info size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <div>
            <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '750', color: 'var(--text)' }}>Подсказка по поиску аудитории</h5>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#555', lineHeight: '1.4' }}>
              Первая цифра в номере кабинета указывает на этаж. Например, кабинет <strong>Б-306</strong> находится на <strong>3-м этаже</strong> секции Б. Кабинет <strong>А-102</strong> — на <strong>1-м этаже</strong> секции А.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusMap;
