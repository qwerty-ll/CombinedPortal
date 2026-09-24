import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ExternalLink, Plus, Minus, RotateCcw, Search } from 'lucide-react';
import SectionIcon from '../components/SectionIcon';

const ICON = { strokeWidth: 1.75 };
const FLOORS = [1, 2, 3, 4];

// Landmarks per floor, from the room-numbering hint of the building
const FLOOR_PLACES = {
  2: ['Дирекция ИВИТШ — Б-209'],
  4: ['Коворкинг ВИТШ'],
};

// "305", "Б-305", "б305", "ауд. 305" → { floor: 3, label: 'Б-305' }; other buildings and numbers → an error message.
const findRoom = (raw) => {
  const text = raw.trim();
  const m = text.match(/(\d)(\d{2})/);
  if (!m) return { error: 'Введите номер аудитории, например 305 или Б-305.' };
  const letter = text.match(/([А-ЯЁA-Z])\s*-?\s*\d/i)?.[1]?.toUpperCase();
  if (letter && letter !== 'Б') return { error: `Схемы есть только для корпуса Б, а ${text} — в другом корпусе.` };
  const floor = Number(m[1]);
  if (!FLOORS.includes(floor)) return { error: 'В корпусе Б аудитории с 101 по 409 — проверьте номер.' };
  return { floor, label: `Б-${m[1]}${m[2]}` };
};

const CampusMap = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [selectedFloor, setSelectedFloor] = useState(1);
  const tabRefs = useRef({});

  // Room finder: the first digit of a room number is its floor
  const [roomQuery, setRoomQuery] = useState('');
  const [roomResult, setRoomResult] = useState(null);
  const showRoom = (value) => {
    const result = findRoom(value);
    setRoomResult(result);
    if (result.floor) setSelectedFloor(result.floor);
  };
  const handleRoomSubmit = (e) => {
    e.preventDefault();
    showRoom(roomQuery);
  };

  // /map?room=Б-209 (links from the schedule) opens the right floor straight away
  useEffect(() => {
    const room = searchParams.get('room');
    if (room) {
      setRoomQuery(room);
      showRoom(room);
    }
  }, [searchParams]);

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

  // Arrow keys move between floor tabs (WAI-ARIA tabs pattern)
  const handleTabKeyDown = (e) => {
    const i = FLOORS.indexOf(selectedFloor);
    let next = null;
    if (e.key === 'ArrowRight') next = FLOORS[(i + 1) % FLOORS.length];
    if (e.key === 'ArrowLeft') next = FLOORS[(i - 1 + FLOORS.length) % FLOORS.length];
    if (e.key === 'Home') next = FLOORS[0];
    if (e.key === 'End') next = FLOORS[FLOORS.length - 1];
    if (next === null) return;
    e.preventDefault();
    setSelectedFloor(next);
    if (tabRefs.current[next]) tabRefs.current[next].focus();
  };

  const places = FLOOR_PLACES[selectedFloor] || [];

  return (
    <div className="container cm-page">
      <header className="page-header">
        <div className="page-heading">
          <SectionIcon section="map" size="lg" />
          <div>
            <h1>Карта кампуса</h1>
            <p className="page-subtitle">Корпус Б ИВИТШ КГУ: схемы этажей и подсказки, как найти аудиторию.</p>
          </div>
        </div>
      </header>

      {/* ADDRESS / ROUTE */}
      <a
        href="https://yandex.ru/maps/?text=Кострома,+ул.+Ивановская,+24а"
        target="_blank"
        rel="noopener noreferrer"
        className="map-route"
      >
        <span className="tile hue-green" aria-hidden="true"><MapPin size={20} {...ICON} /></span>
        <span className="map-route-text">
          <span className="map-route-title">Как добраться до корпуса ИВИТШ</span>
          <span className="map-route-address">г. Кострома, ул. Ивановская, 24а (корпус Б ИВИТШ КГУ)</span>
        </span>
        <span className="map-route-action">
          <span className="map-route-action-label">Открыть в Яндекс Картах</span>
          <ExternalLink size={16} {...ICON} aria-hidden="true" />
          <span className="visually-hidden">(откроется в новой вкладке)</span>
        </span>
      </a>

      {/* FLOOR PLANS */}
      <section className="card map-panel" aria-labelledby="map-plans-heading">
        <div className="map-panel-head">
          <div>
            <h2 id="map-plans-heading">Схемы этажей корпуса Б</h2>
            <p className="map-panel-hint">Выберите этаж. Чтобы рассмотреть детали, приблизьте схему и перетащите её.</p>
          </div>

          <div className="segmented map-floors" role="tablist" aria-label="Этаж">
            {FLOORS.map(f => (
              <button
                key={f}
                ref={el => { tabRefs.current[f] = el; }}
                type="button"
                role="tab"
                id={`floor-tab-${f}`}
                className="segmented-item tabular"
                aria-selected={selectedFloor === f}
                aria-controls="floor-panel"
                tabIndex={selectedFloor === f ? 0 : -1}
                onClick={() => setSelectedFloor(f)}
                onKeyDown={handleTabKeyDown}
              >
                {f} этаж
              </button>
            ))}
          </div>
        </div>

          {/* ROOM FINDER */}
          <form className="map-finder" onSubmit={handleRoomSubmit} role="search" aria-label="Найти аудиторию">
            <div className="field map-finder-field">
              <label className="field-label" htmlFor="room-search">Найти аудиторию</label>
              <div className="map-finder-row">
                <div className="cm-search">
                  <Search size={18} {...ICON} className="cm-search-icon" aria-hidden="true" />
                  <input
                    id="room-search"
                    className="input"
                    inputMode="text"
                    autoComplete="off"
                    placeholder="Например, Б-305"
                    value={roomQuery}
                    onChange={(e) => setRoomQuery(e.target.value)}
                    aria-describedby="room-result"
                  />
                </div>
                <button type="submit" className="btn btn-primary">Показать на схеме</button>
              </div>
            </div>
            <p id="room-result" className={`map-finder-result ${roomResult?.error ? 'is-error' : ''}`} role="status">
              {roomResult?.floor && (
                <>
                  <MapPin size={16} {...ICON} aria-hidden="true" />
                  <span><strong>{roomResult.label}</strong> — {roomResult.floor} этаж корпуса Б. Схема этажа открыта ниже.</span>
                </>
              )}
              {roomResult?.error}
            </p>
          </form>

        <div
          id="floor-panel"
          role="tabpanel"
          aria-labelledby={`floor-tab-${selectedFloor}`}
          className="map-floor"
        >
          <div className="map-stage">
            <div
              className={`map-viewport ${zoom > 1 ? 'is-zoomed' : ''} ${isDragging ? 'is-dragging' : ''}`}
              onPointerDown={handleMouseDown}
              onPointerMove={handleMouseMove}
              onPointerUp={handleMouseUp}
              onPointerLeave={handleMouseUp}
              onPointerCancel={handleMouseUp}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={selectedFloor}
                  className="map-image-frame"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                >
                  <img
                    src={`/floor${selectedFloor}.png`}
                    alt={`Схема ${selectedFloor} этажа корпуса Б ИВИТШ КГУ`}
                    className="map-image"
                    draggable="false"
                    style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})` }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="map-zoom" role="group" aria-label="Масштаб схемы">
              <button type="button" className="map-zoom-btn" onClick={handleZoomOut} disabled={zoom <= 1} aria-label="Отдалить" title="Отдалить">
                <Minus size={18} {...ICON} />
              </button>
              <span className="map-zoom-level tabular" aria-live="polite">{Math.round(zoom * 100)}%</span>
              <button type="button" className="map-zoom-btn" onClick={handleZoomIn} disabled={zoom >= 4} aria-label="Приблизить" title="Приблизить">
                <Plus size={18} {...ICON} />
              </button>
              <button type="button" className="map-zoom-btn" onClick={handleResetZoom} disabled={zoom === 1 && position.x === 0 && position.y === 0} aria-label="Сбросить масштаб" title="Сбросить масштаб">
                <RotateCcw size={18} {...ICON} />
              </button>
            </div>
          </div>

          {/* ROOM INFO */}
          <div className="map-info">
            <div className="map-info-block">
              <h3>{selectedFloor} этаж</h3>
              <p>
                Здесь аудитории <span className="tabular">{selectedFloor}00</span>-х номеров,
                например <span className="tabular">Б-{selectedFloor}01</span>.
              </p>
              {places.length > 0 && (
                <ul className="map-places" aria-label={`Важные места на ${selectedFloor} этаже`}>
                  {places.map(place => (
                    <li key={place}>
                      <MapPin size={16} {...ICON} aria-hidden="true" />
                      {place}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="map-info-block">
              <h3>Как найти аудиторию</h3>
              <p>
                Все аудитории <span className="tabular">101–409</span> находятся в корпусе Б (ул. Ивановская, 24а).
                Первая цифра номера — этаж: <span className="tabular">100</span>-е аудитории — 1-й этаж,
                {' '}<span className="tabular">200</span>-е — 2-й (включая дирекцию Б-209),
                {' '}<span className="tabular">300</span>-е — 3-й, <span className="tabular">400</span>-е — 4-й (коворкинг ВИТШ).
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default CampusMap;
