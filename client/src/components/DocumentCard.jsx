import React, { useEffect, useId, useState } from 'react';
import { FileText, Download, Pencil, Check, Loader2, AlertCircle } from 'lucide-react';
import { documentsApi } from '../services/api';

const ICON = { strokeWidth: 1.75, 'aria-hidden': true };
const TITLES = { explanatory: 'Объяснительная записка', retake: 'Заявление на пересдачу' };
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

// Short chip labels; the full wording goes into the document
const REASON_LABELS = {
  'получением неудовлетворительной оценки': 'неудовлетворительная оценка',
  'неявкой на промежуточную аттестацию по уважительной причине': 'неявка по уважительной причине',
  'участие в мероприятии университета': 'мероприятие университета',
};

const dayText = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}${y !== new Date().getFullYear() ? ` ${y}` : ''}`;
};
const shortName = (full = '') => {
  const [last, ...rest] = full.trim().split(/\s+/);
  return rest.length ? `${last} ${rest.map(p => `${p[0]}.`).join(' ')}` : full;
};

// What is still missing before the document can be downloaded
const missingOf = (kind, f) => {
  const missing = [];
  if ((f.full_name || '').trim().split(/\s+/).length < 2) missing.push('ФИО');
  if (!(f.group || '').trim()) missing.push('группу');
  if (kind === 'explanatory') {
    if (!f.date_from) missing.push('дату');
    if ((f.reason || '').trim().length < 2) missing.push('причину');
  } else {
    if ((f.discipline || '').trim().length < 2) missing.push('дисциплину');
    if ((f.reason || '').trim().length < 3) missing.push('причину');
  }
  return missing;
};

// The request body the server expects: only the checked pairs, without UI-only keys
const payloadOf = (kind, f) => {
  const person = { full_name: f.full_name.trim(), group: f.group.trim(), course: f.course || null };
  if (kind === 'explanatory') {
    const range = f.date_to && f.date_to !== f.date_from;
    return {
      ...person,
      date_from: f.date_from,
      date_to: range ? f.date_to : null,
      reason: f.reason.trim(),
      attachment: (f.attachment || '').trim(),
      pairs: range ? [] : f.pairs.filter(p => p.checked).map(({ start, end, discipline, kind: k, teacher }) => ({ start, end, discipline, kind: k || '', teacher: teacher || '' })),
    };
  }
  return { ...person, discipline: f.discipline.trim(), control: f.control, teacher: (f.teacher || '').trim(), reason: f.reason.trim() };
};

/** A document ВИТШик prepared in the chat: a short summary, fields to correct, Word and PDF buttons. */
const DocumentCard = ({ draft }) => {
  const { kind, options = {} } = draft;
  const [fields, setFields] = useState(draft.fields);
  const missing = missingOf(kind, fields);
  const [editing, setEditing] = useState(missing.length > 0);
  const [busy, setBusy] = useState('');
  const [status, setStatus] = useState(null); // { tone: 'ok' | 'error', text }
  const [pairsLoading, setPairsLoading] = useState(false);
  const uid = useId();
  const id = (name) => `${uid}-${name}`;

  const set = (patch) => { setFields(prev => ({ ...prev, ...patch })); setStatus(null); };

  // A new date brings that day's pairs from the timetable
  const [pairsDate, setPairsDate] = useState(draft.fields.date_from);
  useEffect(() => {
    if (kind !== 'explanatory' || !fields.date_from || fields.date_from === pairsDate) return undefined;
    let active = true;
    setPairsLoading(true);
    documentsApi.pairs(fields.date_from)
      .then(res => { if (active) set({ pairs: (res?.pairs || []).map(p => ({ ...p, checked: true })) }); })
      .catch(() => { if (active) set({ pairs: [] }); })
      .finally(() => { if (active) { setPairsLoading(false); setPairsDate(fields.date_from); } });
    return () => { active = false; };
  }, [fields.date_from]);

  const download = async (format) => {
    if (missing.length) { setEditing(true); return; }
    setBusy(format);
    setStatus(null);
    try {
      const name = await documentsApi.download(kind, format, payloadOf(kind, fields));
      setStatus({ tone: 'ok', text: `Скачан файл «${name}». Распечатай, подпиши и отнеси в дирекцию (Б-209).` });
    } catch (e) {
      setStatus({ tone: 'error', text: e.message || 'Не получилось собрать документ. Попробуй ещё раз.' });
    } finally {
      setBusy('');
    }
  };

  const checkedPairs = (fields.pairs || []).filter(p => p.checked);
  const isRange = kind === 'explanatory' && fields.date_to && fields.date_to !== fields.date_from;

  const summary = kind === 'explanatory' ? [
    ['От', <>{shortName(fields.full_name)}, <span className="nowrap">{fields.group}</span></>],
    ['Дата', isRange ? `${dayText(fields.date_from)} — ${dayText(fields.date_to)}` : dayText(fields.date_from)],
    !isRange && ['Пары', checkedPairs.length ? checkedPairs.map(p => p.discipline).join(', ') : 'не указаны'],
    ['Причина', fields.reason || '—'],
  ] : [
    ['От', <>{shortName(fields.full_name)}, <span className="nowrap">{fields.group}</span></>],
    ['Предмет', fields.discipline ? `${fields.discipline} · ${fields.control}` : '—'],
    fields.teacher && ['Преподаватель', fields.teacher],
    ['Причина', fields.reason || '—'],
  ];

  const pickDiscipline = (name) => {
    const option = (options.disciplines || []).find(o => o.discipline === name);
    set(option ? { discipline: name, teacher: option.teacher || '', control: option.control || fields.control } : { discipline: name });
  };

  return (
    <section className="doc-card" aria-labelledby={id('title')}>
      <header className="doc-card-head">
        <FileText size={18} {...ICON} />
        <h3 id={id('title')} className="doc-card-title">{TITLES[kind]}</h3>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm doc-card-edit"
          onClick={() => setEditing(!editing)}
          aria-expanded={editing}
          aria-controls={id('form')}
          aria-label={editing ? 'Свернуть поля' : 'Изменить данные документа'}
          title={editing ? 'Свернуть поля' : 'Изменить'}
        >
          {editing ? <Check size={16} {...ICON} /> : <Pencil size={16} {...ICON} />}
        </button>
      </header>

      {!editing && (
        <dl className="doc-card-summary">
          {summary.filter(Boolean).map(([term, value]) => (
            <div key={term} className="doc-card-row">
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {editing && (
        <div className="doc-card-form" id={id('form')}>
          <div className="doc-field-row">
            <div className="field doc-field">
              <label className="field-label" htmlFor={id('name')}>ФИО</label>
              <input id={id('name')} className="input" value={fields.full_name} onChange={e => set({ full_name: e.target.value })} autoComplete="name" />
            </div>
            <div className="field doc-field doc-field-group">
              <label className="field-label" htmlFor={id('group')}>Группа</label>
              <input id={id('group')} className="input" value={fields.group} onChange={e => set({ group: e.target.value })} />
            </div>
          </div>

          {kind === 'explanatory' ? (
            <>
              <div className="doc-field-row">
                <div className="field doc-field">
                  <label className="field-label" htmlFor={id('from')}>Пропустил(а)</label>
                  <input id={id('from')} type="date" className="input" value={fields.date_from || ''} onChange={e => set({ date_from: e.target.value })} />
                </div>
                <div className="field doc-field">
                  <label className="field-label" htmlFor={id('to')}>по (если несколько дней)</label>
                  <input id={id('to')} type="date" className="input" value={fields.date_to || ''} min={fields.date_from || undefined} onChange={e => set({ date_to: e.target.value || null })} />
                </div>
              </div>

              {!isRange && (
                <fieldset className="doc-pairs" aria-busy={pairsLoading}>
                  <legend className="field-label">Пропущенные пары</legend>
                  {pairsLoading ? (
                    <p className="doc-hint"><Loader2 size={14} className="spin-icon" {...ICON} /> Смотрю расписание…</p>
                  ) : fields.pairs?.length ? fields.pairs.map((p, i) => (
                    <label key={`${p.start}-${p.discipline}-${i}`} className="doc-pair">
                      <input
                        type="checkbox"
                        checked={p.checked}
                        onChange={() => set({ pairs: fields.pairs.map((x, j) => (j === i ? { ...x, checked: !x.checked } : x)) })}
                      />
                      <span className="tabular">{p.start}</span>
                      <span>{p.discipline}{p.subgroup ? ` · ${p.subgroup} подгруппа` : ''}</span>
                    </label>
                  )) : <p className="doc-hint">В расписании на этот день пар нет: можно не указывать.</p>}
                </fieldset>
              )}

              <div className="field doc-field">
                <label className="field-label" htmlFor={id('reason')}>Причина</label>
                <input id={id('reason')} className="input" value={fields.reason} onChange={e => set({ reason: e.target.value })} placeholder="например, болезнь" />
                <div className="doc-chips" role="group" aria-label="Частые причины">
                  {(options.reasons || []).map(r => (
                    <button key={r} type="button" className={`chip${fields.reason === r ? ' active' : ''}`} onClick={() => set({ reason: r })} aria-pressed={fields.reason === r}>{REASON_LABELS[r] || r}</button>
                  ))}
                </div>
              </div>

              <div className="field doc-field">
                <label className="field-label" htmlFor={id('attachment')}>Подтверждающий документ</label>
                <input id={id('attachment')} className="input" value={fields.attachment} onChange={e => set({ attachment: e.target.value })} placeholder="необязательно, например, справка из поликлиники" />
              </div>
            </>
          ) : (
            <>
              <div className="field doc-field">
                <label className="field-label" htmlFor={id('discipline')}>Дисциплина</label>
                <input
                  id={id('discipline')}
                  className="input"
                  list={id('disciplines')}
                  value={fields.discipline}
                  onChange={e => pickDiscipline(e.target.value)}
                  placeholder="начни вводить название"
                />
                <datalist id={id('disciplines')}>
                  {(options.disciplines || []).map(o => <option key={o.discipline} value={o.discipline} />)}
                </datalist>
              </div>
              <div className="doc-field-row">
                <div className="field doc-field">
                  <label className="field-label" htmlFor={id('control')}>Что пересдаёшь</label>
                  <select id={id('control')} className="select" value={fields.control} onChange={e => set({ control: e.target.value })}>
                    {(options.controls || ['экзамен', 'зачёт', 'дифференцированный зачёт']).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field doc-field">
                  <label className="field-label" htmlFor={id('teacher')}>Преподаватель</label>
                  <input id={id('teacher')} className="input" value={fields.teacher} onChange={e => set({ teacher: e.target.value })} placeholder="необязательно" />
                </div>
              </div>
              <div className="field doc-field">
                <label className="field-label" htmlFor={id('reason')}>В связи с</label>
                <input id={id('reason')} className="input" value={fields.reason} onChange={e => set({ reason: e.target.value })} />
                <div className="doc-chips" role="group" aria-label="Частые причины">
                  {(options.reasons || []).map(r => (
                    <button key={r} type="button" className={`chip${fields.reason === r ? ' active' : ''}`} onClick={() => set({ reason: r })} aria-pressed={fields.reason === r}>{REASON_LABELS[r] || r}</button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {missing.length > 0 && <p className="doc-hint doc-missing">Осталось указать: {missing.join(', ')}.</p>}

      <div className="doc-card-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => download('docx')} disabled={!!busy || missing.length > 0}>
          {busy === 'docx' ? <Loader2 size={14} className="spin-icon" {...ICON} /> : <Download size={14} {...ICON} />}
          Скачать Word
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => download('pdf')} disabled={!!busy || missing.length > 0}>
          {busy === 'pdf' ? <Loader2 size={14} className="spin-icon" {...ICON} /> : <Download size={14} {...ICON} />}
          PDF
        </button>
      </div>
      <p className={`doc-status${status ? ` is-${status.tone}` : ''}`} role="status">
        {status?.tone === 'error' && <AlertCircle size={14} {...ICON} />}
        {status?.text}
      </p>
    </section>
  );
};

export default DocumentCard;
