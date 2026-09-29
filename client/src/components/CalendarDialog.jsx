import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { groupCalendarUrl } from '../services/api';

const ICON = { strokeWidth: 1.75, 'aria-hidden': true };
const EASE = [0.16, 1, 0.3, 1];

// Subscribe to a group's timetable in a phone calendar: the feed refreshes on its own.
const CalendarDialog = ({ groupName, open, onClose }) => {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);
  const returnFocusRef = useRef(null);

  const feedUrl = groupName ? groupCalendarUrl(groupName) : '';
  const webcalUrl = feedUrl.replace(/^https?:\/\//, 'webcal://');
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;

  useEffect(() => {
    if (!open) return undefined;
    setCopied(false);
    returnFocusRef.current = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      returnFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
    } catch {
      // No clipboard access (older browser, insecure context): select the text for a manual copy
      inputRef.current?.select();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          <motion.div
            className="modal calendar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-dialog-title"
            aria-describedby="calendar-dialog-text"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.24, ease: EASE }}
            onClick={e => e.stopPropagation()}
          >
            <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
              <X size={20} {...ICON} />
            </button>

            <h2 id="calendar-dialog-title">Пары в календаре телефона</h2>
            <p id="calendar-dialog-text" className="calendar-modal-text">
              Расписание группы <span className="calendar-modal-group">{groupName}</span> появится в вашем календаре
              и будет обновляться само: календарь проверяет его несколько раз в день.
            </p>

            <div className="calendar-options">
              <a className="calendar-option" href={webcalUrl} autoFocus>
                <span className="calendar-option-name">Apple Календарь</span>
                <span className="calendar-option-hint">iPhone, iPad и Mac</span>
              </a>
              <a className="calendar-option" href={googleUrl} target="_blank" rel="noopener noreferrer">
                <span className="calendar-option-name">
                  Google Календарь
                  <ExternalLink size={14} {...ICON} />
                  <span className="visually-hidden"> (откроется в новой вкладке)</span>
                </span>
                <span className="calendar-option-hint">Android и календарь в браузере</span>
              </a>
            </div>

            <div className="field calendar-link">
              <label className="field-label" htmlFor="calendar-feed-url">Ссылка для других календарей</label>
              <div className="calendar-link-row">
                <input
                  ref={inputRef}
                  id="calendar-feed-url"
                  className="input calendar-link-input"
                  value={feedUrl}
                  readOnly
                  onFocus={e => e.target.select()}
                />
                <button type="button" className="btn btn-secondary" onClick={copy}>
                  {copied ? <Check size={16} {...ICON} /> : <Copy size={16} {...ICON} />}
                  {copied ? 'Скопировано' : 'Скопировать'}
                </button>
              </div>
              <p className="field-hint" role="status">
                {copied ? 'Ссылка в буфере обмена. Добавьте её в календаре как «подписку по URL».' : 'Outlook, Яндекс Календарь и другие: «Добавить календарь по ссылке».'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CalendarDialog;
