import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, BadgeCheck, Brain, Building2, Cat, ClipboardList, Printer, Rocket, X } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];

const REWARDS = [
  { id: 1, title: 'Первопроходец ИВИТШ', desc: 'Завершил знакомство с порталом и маскотом ВИТШиком', icon: Rocket, points: 150 },
  { id: 2, title: 'Знаток корпуса Б', desc: 'Изучил все схемы аудиторий и нашёл Дирекцию Б-209', icon: Building2, points: 200 },
  { id: 3, title: 'Эрудит ИТ-школы', desc: 'Успешно прошёл входной тест по правилам КГУ', icon: Brain, points: 250 },
  { id: 4, title: 'Организованный первак', desc: 'Отметил все важные дела в чек-листе первокурсника', icon: ClipboardList, points: 200 },
  { id: 5, title: 'Друг ВИТШика', desc: 'Пообщался с маскотом и освоил RAG ассистент', icon: Cat, points: 200 },
];

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Guide dialog shell: shared .modal-overlay/.modal look, focus handling, Escape to close.
 * Also used by FreshmanGuide for the step modals.
 */
export function GuideDialog({ open, onClose, labelledBy, wide = false, children }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    dialogRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const items = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      root.style.overflow = previousOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="guide-dialog"
          className="modal-overlay guide-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          <motion.div
            ref={dialogRef}
            className={`modal guide-modal${wide ? ' guide-modal-wide' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.32, ease: EASE }}
          >
            <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
              <X size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function RewardsModal({ isOpen, onClose }) {
  const [showCertificate, setShowCertificate] = useState(false);

  const totalPoints = REWARDS.reduce((sum, r) => sum + r.points, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <GuideDialog open={isOpen} onClose={onClose} labelledBy="rewards-title" wide={showCertificate}>
      {!showCertificate ? (
        <div className="rewards">
          <div className="rewards-hero">
            <motion.img
              src="/img/mascot.png"
              alt=""
              className="rewards-mascot"
              width="88"
              height="88"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.32, ease: EASE, delay: 0.08 }}
            />
            <h2 id="rewards-title">Адаптация завершена</h2>
            <p>Ты прошёл все этапы «Пути первокурсника» в Высшей ИТ-школе КГУ.</p>
            <p className="rewards-total">
              <span className="rewards-total-value tabular">{totalPoints} XP</span>
              <span className="rewards-total-caption">набрано баллов</span>
            </p>
          </div>

          <h3 className="rewards-list-title">Полученные ачивки</h3>
          <ul className="list rewards-list">
            {REWARDS.map(({ id, title, desc, icon: Icon, points }) => (
              <li key={id} className="list-row reward">
                <span className="reward-icon" aria-hidden="true"><Icon size={20} strokeWidth={1.75} /></span>
                <div className="reward-text">
                  <span className="reward-title">{title}</span>
                  <span className="reward-desc">{desc}</span>
                </div>
                <span className="reward-points tabular">+{points} XP</span>
              </li>
            ))}
          </ul>

          <button type="button" onClick={() => setShowCertificate(true)} className="btn btn-primary btn-block">
            <Award size={18} strokeWidth={1.75} aria-hidden="true" />
            Получить диплом первокурсника
          </button>
        </div>
      ) : (
        <div className="rewards">
          <h2 id="rewards-title">Диплом первокурсника</h2>

          {/* PRINTABLE DIPLOMA */}
          <div id="diploma-certificate" className="diploma">
            <p className="diploma-org">Костромской государственный университет</p>
            <p className="diploma-school">Высшая ИТ-школа (ИВИТШ)</p>

            <p className="diploma-title">Диплом</p>
            <p className="diploma-subtitle">об успешном прохождении адаптации первокурсника</p>

            <p className="diploma-text">
              Настоящий диплом подтверждает, что первокурсник успешно прошёл все этапы адаптации, освоил правила
              ИВИТШ КГУ, нашёл кабинеты корпуса Б и набрал <strong className="tabular">{totalPoints} XP</strong>.
            </p>

            <div className="diploma-marks">
              <span className="badge badge-accent"><Award size={14} strokeWidth={1.75} aria-hidden="true" /> Адаптирован на 100%</span>
              <span className="badge badge-success"><BadgeCheck size={14} strokeWidth={1.75} aria-hidden="true" /> Одобрено ВИТШиком</span>
            </div>

            <div className="diploma-footer">
              <span>Академический год: <span className="tabular">2025–2026</span></span>
              <span className="diploma-seal">
                <img src="/img/mascot.png" alt="" width="40" height="40" />
                Дирекция ИВИТШ КГУ (Б-209)
              </span>
            </div>
          </div>

          <div className="diploma-actions">
            <button type="button" onClick={handlePrint} className="btn btn-primary">
              <Printer size={16} strokeWidth={1.75} aria-hidden="true" />
              Распечатать или сохранить PDF
            </button>
            <button type="button" onClick={() => setShowCertificate(false)} className="btn btn-secondary">
              Вернуться к ачивкам
            </button>
          </div>
        </div>
      )}
    </GuideDialog>
  );
}
