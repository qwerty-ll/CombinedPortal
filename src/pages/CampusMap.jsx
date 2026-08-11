import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, Compass, Info, Navigation, Activity, Maximize2 } from 'lucide-react';

const CampusMap = () => {
  const location = useLocation();
  const [selectedFloor, setSelectedFloor] = useState(1);

  // Zoom & Pan states
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (location.state && location.state.selectedFloor) {
      setSelectedFloor(Number(location.state.selectedFloor));
    }
  }, [location]);

  // Reset zoom & pan on floor changes
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [selectedFloor]);

  const handleMouseDown = (e) => {
    if (zoom === 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
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
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1>Карта и навигация ИВИТШ КГУ</h1>
      </div>

      {/* CORRECT KSU ADDRESS CARD */}
      <a 
        href="https://yandex.ru/maps/?text=Кострома,+ул.+Ивановская,+24а" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="route-card"
        style={{ marginBottom: '25px' }}
      >
        <div className="route-left">
          <div className="route-icon" style={{ background: 'var(--primary)', color: 'white' }}>
            <MapPin size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>Как добраться до корпуса ИВИТШ</h3>
            <span style={{ fontSize: '0.88rem', color: '#666' }}>г. Кострома, ул. Ивановская, 24а (Корпус Б ИВИТШ КГУ)</span>
          </div>
        </div>
        <ChevronRight className="route-arrow" size={20} />
      </a>

      {/* FLOOR PLANS CARD */}
      <div className="campus-image-card" style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #e9ecef', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Схемы этажей Корпуса Б</h3>
            <p style={{ color: '#666', fontSize: '0.88rem', margin: '4px 0 0 0' }}>Нажмите кнопку для переключения между этажами 1–4</p>
          </div>
          
          <div className="floor-tabs" style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3, 4].map(f => (
              <button 
                key={f} 
                className={`floor-tab ${selectedFloor === f ? 'active' : ''}`}
                onClick={() => setSelectedFloor(f)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: '1px solid #dee2e6',
                  background: selectedFloor === f ? 'var(--primary)' : 'white',
                  color: selectedFloor === f ? 'white' : '#555',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedFloor === f ? '0 4px 12px rgba(0,127,255,0.25)' : 'none'
                }}
              >
                {f} этаж
              </button>
            ))}
          </div>
        </div>

        <div 
          className="map-viewport-container" 
          style={{ 
            position: 'relative', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            border: '1px solid #eee',
            background: '#fafafa',
            minHeight: '380px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' 
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <AnimatePresence mode="wait">
            <motion.img 
              key={selectedFloor}
              src={`/floor${selectedFloor}.png`} 
              alt={`${selectedFloor} этаж ИВИТШ КГУ`}
              className="map-zoomable-image"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25 }}
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
            />
          </AnimatePresence>

          <div className="map-zoom-overlay-controls" style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button className="zoom-control-btn" onClick={handleZoomIn} title="Приблизить" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: '1px solid #ccc', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
            <button className="zoom-control-btn" onClick={handleZoomOut} title="Отдалить" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: '1px solid #ccc', fontWeight: 'bold', cursor: 'pointer' }}>-</button>
            <button className="zoom-control-btn" onClick={handleResetZoom} title="Сбросить" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: '1px solid #ccc', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>↺</button>
          </div>
        </div>
      </div>

      {/* NAVIGATION TIPS */}
      <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', background: 'rgba(0, 127, 255, 0.05)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(0, 127, 255, 0.15)' }}>
          <Info size={24} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text)' }}>Подсказка по поискам кабинетов ИВИТШ</h5>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#555', lineHeight: '1.45' }}>
              Все аудитории <strong>101–409</strong> расположены в <strong>Корпусе Б</strong> (ул. Ивановская, 24а). Первая цифра номера указывает на этаж: <strong>100-е</strong> аудитории — 1-й этаж, <strong>200-е</strong> — 2-й этаж (включая <strong>Дирекцию Б-209</strong>), <strong>300-е</strong> — 3-й этаж, <strong>400-е</strong> — 4-й этаж (<strong>Коворкинг ВИТШ</strong>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusMap;
