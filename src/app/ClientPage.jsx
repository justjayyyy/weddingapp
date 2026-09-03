"use client";
import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// ── Constants ──────────────────────────────────────────────────────────────
const GROUP_GIFT_DEFAULTS = {
  'כללי': 350,
  'משפחה': 500,
  'משפחה גרעינית': 500,
  'חברים': 350,
  'חברים קרובים': 500,
  'עבודה': 350,
  'חברים של ההורים': 350,
};
const EXPENSE_CATEGORIES = ['אולם וקייטרינג', 'ספקים מרכזיים', 'לבוש ויופי', 'טבעות ותוספות'];
const GUEST_GROUPS = Object.keys(GROUP_GIFT_DEFAULTS);
const GUEST_SIDES = ['כלה', 'חתן'];
const RSVP_STATUSES = ['ממתין', 'מגיע', 'לא מגיע'];
const VENDOR_STATUSES = ['ליצור קשר', 'בתהליך', 'חתום', 'שולם במלואו'];
const VENDOR_CATEGORIES = [...EXPENSE_CATEGORIES, 'אחר'];
const CHECKLIST_CATS = ['הכנות', 'ספקים', 'לבוש', 'חגיגה', 'הזמנות', 'אחר'];
const TASK_URGENCIES = ['רגילה', 'בינונית', 'דחופה'];

const CAT_COLORS = {
  'אולם וקייטרינג': '#6366f1', 'ספקים מרכזיים': '#8b5cf6', 'לבוש ויופי': '#ec4899', 'טבעות ותוספות': '#f59e0b',
};
const RSVP_BADGE = {
  'מגיע': 'bg-green-100 text-green-700', 'לא מגיע': 'bg-red-100 text-red-700', 'ממתין': 'bg-amber-100 text-amber-700',
};
const VENDOR_BADGE = {
  'ליצור קשר': 'bg-gray-100 text-gray-600', 'בתהליך': 'bg-blue-100 text-blue-700',
  'חתום': 'bg-indigo-100 text-indigo-700', 'שולם במלואו': 'bg-green-100 text-green-700',
};
const URGENCY_COLORS = {
  'רגילה': 'bg-gray-400 dark:bg-gray-500',
  'בינונית': 'bg-yellow-400 dark:bg-yellow-500',
  'דחופה': 'bg-red-500 dark:bg-red-600',
};

// ── Helpers ────────────────────────────────────────────────────────────────
let PRIVACY_MODE = true;
const uid = () => Math.random().toString(36).slice(2, 10);
const num = (v) => Number(v) || 0;
const fmt = (n) => PRIVACY_MODE ? '₪ •••' : '₪' + num(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };

// ── Seed data ──────────────────────────────────────────────────────────────
const SEED_EXPENSES = [
  { id: uid(), name: 'אולם חתונה', category: 'אולם וקייטרינג', total_cost: 45000, deposit_paid: 10000 },
  { id: uid(), name: 'קייטרינג', category: 'אולם וקייטרינג', total_cost: 32000, deposit_paid: 5000 },
  { id: uid(), name: 'עוגת חתונה', category: 'אולם וקייטרינג', total_cost: 3500, deposit_paid: 1000 },
  { id: uid(), name: 'DJ', category: 'ספקים מרכזיים', total_cost: 8000, deposit_paid: 2000 },
  { id: uid(), name: 'צילום ווידאו', category: 'ספקים מרכזיים', total_cost: 15000, deposit_paid: 5000 },
  { id: uid(), name: 'מסדר טקסים', category: 'ספקים מרכזיים', total_cost: 4500, deposit_paid: 1500 },
  { id: uid(), name: 'תאורה ואפקטים', category: 'ספקים מרכזיים', total_cost: 6000, deposit_paid: 2000 },
  { id: uid(), name: 'שמלת כלה', category: 'לבוש ויופי', total_cost: 8000, deposit_paid: 3000 },
  { id: uid(), name: 'חליפת חתן', category: 'לבוש ויופי', total_cost: 3500, deposit_paid: 1500 },
  { id: uid(), name: 'שיער ואיפור', category: 'לבוש ויופי', total_cost: 2800, deposit_paid: 800 },
  { id: uid(), name: 'פרחים ועיצוב', category: 'טבעות ותוספות', total_cost: 6000, deposit_paid: 2000 },
  { id: uid(), name: 'טבעות נישואין', category: 'טבעות ותוספות', total_cost: 9000, deposit_paid: 9000 },
  { id: uid(), name: 'הזמנות ומתנות לאורחים', category: 'טבעות ותוספות', total_cost: 2500, deposit_paid: 2500 },
];
const SEED_GUESTS = [
  { id: uid(), name: 'דוד ומרים כהן', group: 'משפחה גרעינית', side: 'כלה', rsvp_status: 'מגיע', estimated_gift: 500, actual_gift: 500 },
  { id: uid(), name: 'יוסף ורחל לוי', group: 'משפחה גרעינית', side: 'חתן', rsvp_status: 'מגיע', estimated_gift: 500, actual_gift: 600 },
  { id: uid(), name: 'שמעון ולאה כהן', group: 'משפחה גרעינית', side: 'כלה', rsvp_status: 'מגיע', estimated_gift: 500, actual_gift: 0 },
  { id: uid(), name: 'אברהם ושרה לוי', group: 'משפחה גרעינית', side: 'חתן', rsvp_status: 'מגיע', estimated_gift: 500, actual_gift: 0 },
  { id: uid(), name: 'נועה שפירו', group: 'חברים קרובים', side: 'כלה', rsvp_status: 'מגיע', estimated_gift: 500, actual_gift: 500 },
  { id: uid(), name: 'ליאור ודנה אברהם', group: 'חברים קרובים', side: 'כלה', rsvp_status: 'מגיע', estimated_gift: 500, actual_gift: 0 },
  { id: uid(), name: 'אבי כץ', group: 'חברים קרובים', side: 'חתן', rsvp_status: 'מגיע', estimated_gift: 500, actual_gift: 0 },
  { id: uid(), name: 'רון ויעל בן-שלום', group: 'חברים קרובים', side: 'חתן', rsvp_status: 'מגיע', estimated_gift: 500, actual_gift: 0 },
  { id: uid(), name: 'מיה מזרחי', group: 'כללי', side: 'כלה', rsvp_status: 'מגיע', estimated_gift: 350, actual_gift: 0 },
  { id: uid(), name: 'גלי וניר סגל', group: 'כללי', side: 'כלה', rsvp_status: 'מגיע', estimated_gift: 350, actual_gift: 0 },
  { id: uid(), name: 'טל בן-דוד', group: 'כללי', side: 'חתן', rsvp_status: 'ממתין', estimated_gift: 350, actual_gift: 0 },
  { id: uid(), name: 'עומר ורחל פרץ', group: 'כללי', side: 'חתן', rsvp_status: 'ממתין', estimated_gift: 350, actual_gift: 0 },
  { id: uid(), name: 'כרמית אלון', group: 'חברים של ההורים', side: 'הורים', rsvp_status: 'ממתין', estimated_gift: 350, actual_gift: 0 },
  { id: uid(), name: 'תמר גולדשטיין', group: 'כללי', side: 'הורים', rsvp_status: 'ממתין', estimated_gift: 250, actual_gift: 0 },
  { id: uid(), name: 'אורי פרידמן', group: 'כללי', side: 'כלה', rsvp_status: 'ממתין', estimated_gift: 250, actual_gift: 0 },
  { id: uid(), name: 'שיר וגל נחמני', group: 'כללי', side: 'חתן', rsvp_status: 'ממתין', estimated_gift: 250, actual_gift: 0 },
  { id: uid(), name: 'איתי רוזנברג', group: 'כללי', side: 'חתן', rsvp_status: 'לא מגיע', estimated_gift: 250, actual_gift: 0 },
  { id: uid(), name: 'מורן ביטון', group: 'כללי', side: 'כלה', rsvp_status: 'לא מגיע', estimated_gift: 250, actual_gift: 0 },
];
const SEED_TASKS = [
  { id: uid(), text: 'לקבוע תאריך ואולם', category: 'הכנות', done: true, due_date: '2025-12-01', urgency: 'דחופה' },
  { id: uid(), text: 'לשלוח save the date', category: 'הזמנות', done: true, due_date: '2026-01-15', urgency: 'בינונית' },
  { id: uid(), text: 'לחתום על חוזה קייטרינג', category: 'ספקים', done: true, due_date: '2026-02-01', urgency: 'רגילה' },
  { id: uid(), text: 'לשלוח הזמנות רשמיות', category: 'הזמנות', done: false, due_date: '2026-04-01', urgency: 'דחופה' },
  { id: uid(), text: 'לאשר תפריט קייטרינג', category: 'ספקים', done: false, due_date: '2026-05-01', urgency: 'בינונית' },
  { id: uid(), text: 'ניסיון שיער ואיפור', category: 'לבוש', done: false, due_date: '2026-05-15', urgency: 'רגילה' },
  { id: uid(), text: 'לקנות טבעות', category: 'חגיגה', done: false, due_date: '2026-06-01', urgency: 'דחופה' },
  { id: uid(), text: 'להכין רשימת שירים ל-DJ', category: 'חגיגה', done: false, due_date: '2026-06-15', urgency: 'רגילה' },
  { id: uid(), text: 'לאשר פרחים ועיצוב סופי', category: 'ספקים', done: false, due_date: '2026-06-15', urgency: 'רגילה' },
  { id: uid(), text: 'לסדר לינה לאורחים מרוחקים', category: 'הכנות', done: false, due_date: '2026-06-20', urgency: 'רגילה' },
  { id: uid(), text: 'להכין סידורי ישיבה', category: 'הכנות', done: false, due_date: '2026-07-01', urgency: 'דחופה' },
  { id: uid(), text: 'לאשר מספר אורחים סופי לאולם', category: 'ספקים', done: false, due_date: '2026-07-10', urgency: 'בינונית' },
  { id: uid(), text: 'להכין תמונות לשולחן ה׳בריפינג׳', category: 'חגיגה', done: false, due_date: '2026-07-15', urgency: 'רגילה' },
];
const SEED_VENDORS = [
  { id: uid(), name: 'גן העדן — אולם אירועים', category: 'אולם וקייטרינג', contact_name: 'יוסי כהן', phone: '052-1234567', contract_amount: 45000, paid_amount: 10000, status: 'חתום', notes: 'כולל שולחנות, כיסאות ומפות' },
  { id: uid(), name: 'קייטרינג מלכה', category: 'אולם וקייטרינג', contact_name: 'מלכה אביב', phone: '03-9876543', contract_amount: 32000, paid_amount: 5000, status: 'חתום', notes: 'תפריט מגוון, כולל אפשרות טבעונית' },
  { id: uid(), name: 'DJ מושיקו', category: 'ספקים מרכזיים', contact_name: 'משה לוי', phone: '054-7654321', contract_amount: 8000, paid_amount: 2000, status: 'חתום', notes: 'ציוד סאונד מקצועי' },
  { id: uid(), name: 'סטודיו שמחות', category: 'ספקים מרכזיים', contact_name: 'דנה מזרחי', phone: '050-1111222', contract_amount: 15000, paid_amount: 5000, status: 'חתום', notes: 'צילום + וידאו, אלבום דיגיטלי כלול' },
  { id: uid(), name: 'רב מאיר כהן', category: 'ספקים מרכזיים', contact_name: 'הרב מאיר', phone: '052-3331111', contract_amount: 4500, paid_amount: 1500, status: 'חתום', notes: 'כולל הכנת כתובה' },
  { id: uid(), name: 'תאורה פנטסטיק', category: 'ספקים מרכזיים', contact_name: 'אלון גרין', phone: '054-2224444', contract_amount: 6000, paid_amount: 2000, status: 'בתהליך', notes: '' },
  { id: uid(), name: 'בוטיק כלה "נסיכה"', category: 'לבוש ויופי', contact_name: 'רונית שרון', phone: '03-5556789', contract_amount: 8000, paid_amount: 3000, status: 'בתהליך', notes: 'ניסיון שני בתאריך 15/05' },
  { id: uid(), name: 'שיער ואיפור — נטלי', category: 'לבוש ויופי', contact_name: 'נטלי בר', phone: '050-9998877', contract_amount: 2800, paid_amount: 800, status: 'חתום', notes: 'כולל ניסיון + יום החתונה' },
  { id: uid(), name: 'פרחי אביב', category: 'טבעות ותוספות', contact_name: 'אביב פרחים', phone: '09-1234321', contract_amount: 6000, paid_amount: 2000, status: 'בתהליך', notes: 'סגנון בוהו-שיק' },
  { id: uid(), name: 'תכשיטי זהב — ירושלמי', category: 'טבעות ותוספות', contact_name: 'שלמה ירושלמי', phone: '02-6667777', contract_amount: 9000, paid_amount: 9000, status: 'שולם במלואו', notes: 'טבעות מוכנות, לאסוף שבוע לפני' },
];
const SEED_TABLES = [
  { id: uid(), name: 'שולחן 1 — משפחה כלה', capacity: 10, guest_ids: [] },
  { id: uid(), name: 'שולחן 2 — משפחה חתן', capacity: 10, guest_ids: [] },
  { id: uid(), name: 'שולחן 3 — חברים כלה', capacity: 8, guest_ids: [] },
  { id: uid(), name: 'שולחן 4 — חברים חתן', capacity: 8, guest_ids: [] },
  { id: uid(), name: 'שולחן 5 — עמיתים', capacity: 8, guest_ids: [] },
  { id: uid(), name: 'שולחן 6 — שכנים', capacity: 6, guest_ids: [] },
];

// ── JSON persistence (wedding-data.json via local server) ───────────────────
const DATA_FILE = '/api/data';

async function fetchWeddingData() {
  const res = await fetch(DATA_FILE, { cache: 'no-store' });
  if (!res.ok) throw new Error('load failed');
  const p = await res.json();
  if (!p || typeof p !== 'object' || !Array.isArray(p.guests)) throw new Error('invalid');
  return p;
}
async function persistWeddingData(state) {
  const res = await fetch(DATA_FILE, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state, null, 2),
  });
  if (!res.ok) throw new Error('save failed');
}

// ── Dark mode context ──────────────────────────────────────────────────────
const DarkCtx = createContext(null);
function DarkProvider({ children }) {
  const [dark, setDark] = useState(() => load('wfgm_dark', true));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('wfgm_dark', JSON.stringify(dark));
  }, [dark]);
  return <DarkCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>{children}</DarkCtx.Provider>;
}
const useDark = () => useContext(DarkCtx);

// ── App context ────────────────────────────────────────────────────────────
const AppCtx = createContext(null);

function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [expenses, setExpenses] = useState([]);
  const [guests, setGuests] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [tables, setTables] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [weddingDate, setWeddingDate] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [privacyMode, setPrivacyModeState] = useState(true);
  
  // Privacy mode is always true by default on entry
  // PRIVACY_MODE is initialized to true globally.

  const togglePrivacyMode = () => {
    const newVal = !privacyMode;
    PRIVACY_MODE = newVal;
    setPrivacyModeState(newVal);
    localStorage.setItem('wfgm_privacy', JSON.stringify(newVal));
  };

  const confirmDialog = (msg) => new Promise(resolve => setConfirmState({ msg, resolve }));
  const handleConfirm = (res) => { if (confirmState) { confirmState.resolve(res); setConfirmState(null); } };
  const hydrated = useRef(false);
  const saveGen = useRef(0);

  const addToast = (msg, type = 'success') => {
    const id = uid();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, fading: true } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 300);
    }, 3000);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchWeddingData();
        if (cancelled) return;
        if (p.expenses) setExpenses(p.expenses);
        if (p.guests) setGuests(p.guests);
        if (p.tasks) setTasks(p.tasks);
        if (p.vendors) setVendors(p.vendors);
        if (p.tables) setTables(p.tables);
        if (p.timeline) setTimeline(p.timeline);
        if (p.ideas) setIdeas(p.ideas);
        if (p.weddingDate) setWeddingDate(p.weddingDate);
        setLoadError(false);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || loadError) return;
    if (!hydrated.current) {
      hydrated.current = true;
      setSaveStatus('saved');
      return;
    }
    const gen = ++saveGen.current;
    setSaveStatus('saving');
    const t = setTimeout(async () => {
      try {
        await persistWeddingData({ expenses, guests, tasks, vendors, tables, ideas, weddingDate, timeline });
        if (gen !== saveGen.current) return;
        setSaveStatus('saved');
      } catch {
        if (gen !== saveGen.current) return;
        setSaveStatus('error');
      }
    }, 400);
    return () => clearTimeout(t);
  }, [expenses, guests, tasks, vendors, tables, ideas, weddingDate, timeline, ready, loadError]);

  const addExpense = (d) => { setExpenses(p => [...p, { ...d, id: uid(), total_cost: num(d.total_cost), deposit_paid: num(d.deposit_paid) }]); addToast('הוצאה נוספה בהצלחה'); };
  const updateExpense = (id, d) => { setExpenses(p => p.map(e => e.id === id ? { ...e, ...d, total_cost: num(d.total_cost), deposit_paid: num(d.deposit_paid) } : e)); addToast('הוצאה עודכנה'); };
  const deleteExpense = (id) => { setExpenses(p => p.filter(e => e.id !== id)); addToast('הוצאה נמחקה'); };

  const addGuest = (d) => { setGuests(p => [...p, { ...d, id: uid(), estimated_gift: num(d.estimated_gift), actual_gift: num(d.actual_gift) }]); addToast('אורח נוסף בהצלחה'); };
  const addMultipleGuests = (guestsArr) => {
    setGuests(p => [...p, ...guestsArr.map(d => ({ ...d, id: uid(), estimated_gift: num(d.estimated_gift), actual_gift: num(d.actual_gift) }))]);
    addToast(`${guestsArr.length} אורחים נוספו בהצלחה`);
  };
  const updateGuest = (id, d) => { setGuests(p => p.map(g => g.id === id ? { ...g, ...d, estimated_gift: num(d.estimated_gift), actual_gift: num(d.actual_gift) } : g)); addToast('פרטי אורח עודכנו'); };
  const deleteGuest = (id) => { setGuests(p => p.filter(g => g.id !== id)); addToast('אורח נמחק'); };

  const addTask = (d) => { setTasks(p => [...p, { ...d, id: uid(), done: false }]); addToast('מטלה נוספה'); };
  const toggleTask = (id) => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const updateTask = (id, d) => setTasks(p => p.map(t => t.id === id ? { ...t, ...d } : t));
  const deleteTask = (id) => { setTasks(p => p.filter(t => t.id !== id)); addToast('מטלה נמחקה'); };
  const reorderTasks = (srcId, tgtId) => {
    setTasks(p => {
      const srcIdx = p.findIndex(t => t.id === srcId);
      const tgtIdx = p.findIndex(t => t.id === tgtId);
      if (srcIdx === -1 || tgtIdx === -1 || srcIdx === tgtIdx) return p;
      const next = [...p];
      const [item] = next.splice(srcIdx, 1);
      next.splice(tgtIdx, 0, item);
      return next;
    });
  };

  const addVendor = (d) => { setVendors(p => [...p, { ...d, id: uid(), contract_amount: num(d.contract_amount), paid_amount: num(d.paid_amount) }]); addToast('ספק נוסף בהצלחה'); };
  const updateVendor = (id, d) => { setVendors(p => p.map(v => v.id === id ? { ...v, ...d, contract_amount: num(d.contract_amount), paid_amount: num(d.paid_amount) } : v)); addToast('ספק עודכן'); };
  const deleteVendor = (id) => { setVendors(p => p.filter(v => v.id !== id)); addToast('ספק נמחק'); };

  const addTable = (d) => { setTables(p => [...p, { ...d, id: uid(), capacity: num(d.capacity), guest_ids: [] }]); addToast('שולחן חדש נוסף'); };
  const updateTable = (id, d) => setTables(p => p.map(t => t.id === id ? { ...t, ...d, capacity: d.capacity !== undefined ? num(d.capacity) : t.capacity } : t));
  const deleteTable = (id) => { setTables(p => p.filter(t => t.id !== id)); addToast('שולחן נמחק'); };
  const assignGuest = (guestId, tableId) => setTables(p => p.map(t => ({
    ...t, guest_ids: t.id === tableId
      ? (t.guest_ids.includes(guestId) ? t.guest_ids : [...t.guest_ids, guestId])
      : t.guest_ids.filter(id => id !== guestId),
  })));
  const unassignGuest = (guestId) => setTables(p => p.map(t => ({ ...t, guest_ids: t.guest_ids.filter(id => id !== guestId) })));

  const addIdea = (d) => { setIdeas(p => [{ ...d, id: uid(), created_at: new Date().toISOString() }, ...p]); addToast('רעיון נוסף בהצלחה'); };
  const updateIdea = (id, d) => { setIdeas(p => p.map(i => i.id === id ? { ...i, ...d } : i)); addToast('רעיון עודכן'); };
  const deleteIdea = (id) => { setIdeas(p => p.filter(i => i.id !== id)); addToast('רעיון נמחק'); };

  const addTimelineEvent = (d) => { setTimeline(p => [...p, { ...d, id: uid() }]); addToast('אירוע נוסף בהצלחה'); };
  const updateTimelineEvent = (id, d) => { setTimeline(p => p.map(i => i.id === id ? { ...i, ...d } : i)); addToast('אירוע עודכן'); };
  const deleteTimelineEvent = (id) => { setTimeline(p => p.filter(i => i.id !== id)); addToast('אירוע נמחק'); };

  const metrics = useMemo(() => {
    const totalActualExpenses = expenses.filter(e => !e.estimated).reduce((s, e) => s + num(e.total_cost), 0);
    const totalEstimatedExpenses = expenses.filter(e => e.estimated).reduce((s, e) => s + num(e.total_cost), 0);
    const totalExpenses = totalActualExpenses + totalEstimatedExpenses;
    const totalOutOfPocket = expenses.reduce((s, e) => s + num(e.deposit_paid), 0);
    const totalBalanceDue = totalExpenses - totalOutOfPocket;
    const contingencyBuffer = totalExpenses * 0.1;
    const totalExpensesWithBuffer = totalExpenses + contingencyBuffer;

    const attending = guests.filter(g => g.rsvp_status === 'מגיע');
    const pending = guests.filter(g => g.rsvp_status === 'ממתין');
    const rsvpYesCount = attending.reduce((s, g) => s + num(g.party_size || 1), 0);
    const pendingCount = pending.reduce((s, g) => s + num(g.party_size || 1), 0);
    const expectedAttendeesArriving = guests.reduce((sum, g) => {
      if (g.rsvp_status !== 'מגיע') return sum;
      return sum + (num(g.party_size || 1) * ((g.arrival_probability ?? 100) / 100));
    }, 0);
    const expectedAttendeesPending = guests.reduce((sum, g) => {
      if (g.rsvp_status !== 'ממתין') return sum;
      return sum + (num(g.party_size || 1) * ((g.arrival_probability ?? 100) / 100));
    }, 0);
    const expectedAttendees = expectedAttendeesArriving + expectedAttendeesPending;

    const safeVenueCommitment = Math.floor(expectedAttendees * 0.9);

    const expectedGiftsArriving = guests.reduce((sum, g) => {
      if (g.rsvp_status !== 'מגיע') return sum;
      return sum + (num(g.estimated_gift) * ((g.arrival_probability ?? 100) / 100));
    }, 0);
    const expectedGiftsPending = guests.reduce((sum, g) => {
      if (g.rsvp_status !== 'ממתין') return sum;
      return sum + (num(g.estimated_gift) * ((g.arrival_probability ?? 100) / 100));
    }, 0);
    const totalExpectedGifts = expectedGiftsArriving + expectedGiftsPending;
    
    const totalActualGifts = guests.reduce((s, g) => s + num(g.actual_gift), 0);

    const bepPerGuest = safeVenueCommitment > 0 ? totalExpensesWithBuffer / safeVenueCommitment : 0;
    const averageGiftExpected = expectedAttendees > 0 ? totalExpectedGifts / expectedAttendees : 0;
    const bepComparison = averageGiftExpected - bepPerGuest;
    const expenseProgress = totalExpensesWithBuffer > 0 ? Math.min(100, Math.round((totalOutOfPocket / totalExpensesWithBuffer) * 100)) : 0;

    const netProfitLoss = totalExpectedGifts - totalExpensesWithBuffer;
    const netProfitLossArriving = expectedGiftsArriving - totalExpensesWithBuffer;

    const expensesByCategory = EXPENSE_CATEGORIES
      .map(cat => ({ name: cat, value: expenses.filter(e => e.category === cat).reduce((s, e) => s + num(e.total_cost), 0) }))
      .filter(c => c.value > 0);

    const tasksDone = tasks.filter(t => t.done).length;
    const tasksTotal = tasks.length;
    
    const probabilityBreakdown = Array.from(new Set(guests.map(g => g.arrival_probability ?? 100)))
      .sort((a,b) => b-a)
      .map(p => {
        const matching = guests.filter(g => (g.arrival_probability ?? 100) === p);
        const count = matching.reduce((s, g) => s + num(g.party_size || 1), 0);
        const expectedGifts = matching.reduce((sum, g) => {
          if (g.rsvp_status === 'לא מגיע') return sum;
          return sum + (num(g.estimated_gift) * ((g.arrival_probability ?? 100) / 100));
        }, 0);
        return { prob: p, count, expectedGifts };
      })
      .filter(p => p.count > 0 || p.expectedGifts > 0);

    return {
      totalExpenses, totalActualExpenses, totalEstimatedExpenses, totalOutOfPocket, totalBalanceDue,
      contingencyBuffer, totalExpensesWithBuffer,
      rsvpYesCount, pendingCount, totalInvited: guests.reduce((s, g) => s + num(g.party_size || 1), 0),
      expectedAttendees, expectedAttendeesArriving, expectedAttendeesPending, safeVenueCommitment, 
      totalExpectedGifts, expectedGiftsArriving, expectedGiftsPending, totalActualGifts,
      bepPerGuest, averageGiftExpected, bepComparison, expenseProgress, netProfitLoss, netProfitLossArriving, expensesByCategory,
      tasksDone, tasksTotal, probabilityBreakdown,
    };
  }, [expenses, guests, tasks]);

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 dark:text-gray-500">טוען נתוני חתונה…</div>;
  }
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 dark:bg-gray-900">
        <div className="max-w-md text-center space-y-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">לא ניתן לטעון את קובץ הנתונים</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">הריצו בתיקיית הפרויקט ואז רעננו את הדף:</p>
          <code className="block bg-slate-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-indigo-700 dark:text-indigo-300" dir="ltr">python3 server.py</code>
          <p className="text-xs text-gray-400" dir="ltr">http://127.0.0.1:8765</p>
        </div>
      </div>
    );
  }

  const value = {
    expenses, guests, tasks, vendors, tables, ideas, weddingDate, setWeddingDate, metrics, timeline,
    privacyMode, togglePrivacyMode,
    addExpense, updateExpense, deleteExpense,
    addGuest, addMultipleGuests, updateGuest, deleteGuest,
    addTask, toggleTask, updateTask, deleteTask, reorderTasks,
    addVendor, updateVendor, deleteVendor,
    addTable, updateTable, deleteTable, assignGuest, unassignGuest,
    addIdea, updateIdea, deleteIdea,
    addTimelineEvent, updateTimelineEvent, deleteTimelineEvent,
    saveStatus,
    toasts, addToast, confirm: confirmDialog, confirmState, handleConfirm,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

const useApp = () => useContext(AppCtx);

// ── Toasts Component ───────────────────────────────────────────────────────
function ToastContainer() {
  const { toasts } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg shadow-black/10 text-sm font-semibold pointer-events-auto
            ${t.fading ? 'animate-fade-out' : 'animate-slide-up'}
            ${t.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'}
          `}>
          {t.type === 'success' && <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
          {t.type === 'error' && <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Confirm Modal ──────────────────────────────────────────────────────────
function ConfirmModal() {
  const { confirmState, handleConfirm } = useApp();
  if (!confirmState) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">אישור פעולה</h3>
        <p className="text-slate-600 dark:text-slate-300 mb-6">{confirmState.msg}</p>
        <div className="flex items-center gap-3 w-full">
          <button onClick={() => handleConfirm(false)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all">ביטול</button>
          <button onClick={() => handleConfirm(true)} className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-all shadow-md">אישור מחיקה</button>
        </div>
      </div>
    </div>
  );
}

// ── SVG Charts ─────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="flex items-center justify-center h-44 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">אין נתוני הוצאות עדיין</div>;
  const SIZE = 200, R = 85, IR = 45, CX = SIZE / 2, CY = SIZE / 2;
  const slices = []; let angle = -Math.PI / 2;
  data.forEach((item) => {
    const sweep = (item.value / total) * 2 * Math.PI, s = angle, e = angle + sweep; angle = e;
    const la = sweep > Math.PI ? 1 : 0, cos = Math.cos, sin = Math.sin;
    const d = [`M ${CX + R * cos(s)} ${CY + R * sin(s)}`, `A ${R} ${R} 0 ${la} 1 ${CX + R * cos(e)} ${CY + R * sin(e)}`, `L ${CX + IR * cos(e)} ${CY + IR * sin(e)}`, `A ${IR} ${IR} 0 ${la} 0 ${CX + IR * cos(s)} ${CY + IR * sin(s)}`, 'Z'].join(' ');
    const mid = s + sweep / 2, lr = (R + IR) / 2;
    slices.push({ ...item, d, lx: CX + lr * cos(mid), ly: CY + lr * sin(mid), pct: (item.value / total * 100).toFixed(0) });
  });
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
      <div className="relative group">
        <svg width={SIZE} height={SIZE} className="flex-shrink-0 drop-shadow-xl transition-transform duration-500 group-hover:scale-105">
          {slices.map(s => (
            <g key={s.name} className="transition-all duration-300 hover:opacity-80">
              <path d={s.d} fill={CAT_COLORS[s.name] || '#6366f1'} stroke="currentColor" className="stroke-white dark:stroke-slate-800" strokeWidth="3"><title>{s.name}: {fmt(s.value)}</title></path>
              {parseFloat(s.pct) >= 8 && <text x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="800" fill="white" style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.4)' }}>{s.pct}%</text>}
            </g>
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">סה״כ</span>
            <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{fmt(total)}</span>
          </div>
        </div>
      </div>
      <div className="space-y-3 w-full min-w-0">
        {slices.map(s => (
          <div key={s.name} className="flex items-center gap-3 text-xs min-w-0 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ background: CAT_COLORS[s.name] || '#6366f1' }}></span>
            <span className="text-slate-600 dark:text-slate-300 font-medium truncate flex-1">{s.name}</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 flex-shrink-0 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">{fmt(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ items }) {
  const maxVal = Math.max(...items.map(d => d.amount), 1);
  const W = 320, H = 220, pad = { t: 32, r: 16, b: 56, l: 60 }, cW = W - pad.l - pad.r, cH = H - pad.t - pad.b, slot = cW / items.length, bW = slot * 0.4, TICKS = 4;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }} className="drop-shadow-sm">
      <defs>
        {items.map((item, i) => (
          <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={item.fill} stopOpacity="1" />
            <stop offset="100%" stopColor={item.fill} stopOpacity="0.6" />
          </linearGradient>
        ))}
      </defs>
      {Array.from({ length: TICKS + 1 }, (_, i) => {
        const v = maxVal * i / TICKS, y = pad.t + cH - (v / maxVal) * cH;
        return <g key={i}><line x1={pad.l} y1={y} x2={pad.l + cW} y2={y} className="stroke-slate-200 dark:stroke-slate-700/50" strokeWidth="1" strokeDasharray="4 4" /><text x={pad.l - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" className="fill-slate-400 dark:fill-slate-500 font-medium">₪{(v / 1000).toFixed(0)}k</text></g>;
      })}
      {items.map((item, i) => {
        const bH = (item.amount / maxVal) * cH, x = pad.l + i * slot + slot / 2 - bW / 2, y = pad.t + cH - bH;
        return (
          <g key={item.name} className="transition-all duration-500 group">
            <rect x={x} y={y} width={bW} height={bH} fill={`url(#grad-${i})`} rx="6" className="cursor-pointer transition-all duration-300 group-hover:opacity-80"><title>{item.name}: {fmt(item.amount)}</title></rect>
            <text x={x + bW / 2} y={y - 8} textAnchor="middle" fontSize="11" fontWeight="800" className="fill-slate-700 dark:fill-slate-200">{fmt(item.amount)}</text>
            <text x={x + bW / 2} y={pad.t + cH + 16} textAnchor="middle" fontSize="10" className="fill-slate-500 dark:fill-slate-400 font-semibold">
              {item.name.split(' ').map((w, wi) => <tspan key={wi} x={x + bW / 2} dy={wi === 0 ? 0 : 14}>{w}</tspan>)}
            </text>
          </g>
        );
      })}
      <line x1={pad.l} y1={pad.t + cH} x2={pad.l + cW} y2={pad.t + cH} className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" />
    </svg>
  );
}

// ── Shared UI atoms ────────────────────────────────────────────────────────
function Card({ children, className = '' }) {
  return <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>{children}</div>;
}
function KpiCard({ title, value, sub, color }) {
  const p = {
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    purple: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    green: 'border-emerald-200  bg-emerald-50  text-emerald-700  dark:border-emerald-800  dark:bg-emerald-900/40  dark:text-emerald-300',
    amber: 'border-amber-200  bg-amber-50  text-amber-700  dark:border-amber-800  dark:bg-amber-900/40  dark:text-amber-300',
    blue: 'border-blue-200   bg-blue-50   text-blue-700   dark:border-blue-800   dark:bg-blue-900/40   dark:text-blue-300',
    red: 'border-rose-200    bg-rose-50    text-rose-700    dark:border-rose-800    dark:bg-rose-900/40    dark:text-rose-300',
  };
  return (
    <div className={`rounded-3xl border p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${p[color] || p.indigo}`}>
      <p className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-2">{title}</p>
      <p className="text-3xl font-extrabold leading-tight">{value}</p>
      {sub && <p className="text-[10px] mt-2 font-medium opacity-80 leading-snug bg-black/5 dark:bg-white/5 inline-block px-2 py-1 rounded">{sub}</p>}
    </div>
  );
}
function Btn({ children, onClick, variant = 'primary', size = 'md', type = 'button', disabled = false }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none disabled:opacity-40';
  const sz = { sm: 'px-2.5 py-1 text-xs', md: 'px-4 py-2 text-sm' };
  const v = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    secondary: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600',
    ghost: 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
    danger: 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30',
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sz[size]} ${v[variant]}`}>{children}</button>;
}
function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
        {label}{hint && <span className="mr-1 normal-case font-normal text-indigo-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
function TextInput({ name, value, onChange, type = 'text', placeholder, required, min }) {
  return (
    <input name={name} value={value} onChange={onChange} type={type} placeholder={placeholder} required={required} min={min}
      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
  );
}
function SelectInput({ name, value, onChange, options }) {
  const appCtx = useApp();
  
  const handleSelect = (e) => {
    if (e.target.value === '__add_new__') {
      const newVal = prompt('הזן אפשרות חדשה:');
      if (newVal && newVal.trim() !== '') {
        onChange({ target: { name, value: newVal.trim() } });
      } else {
        e.target.value = value;
      }
    } else {
      onChange(e);
    }
  };

  const customVals = [];
  if (appCtx) {
    const { expenses, guests, tasks, vendors } = appCtx;
    if (name === 'category') {
      if (expenses) expenses.forEach(e => customVals.push(e.category));
      if (tasks) tasks.forEach(t => customVals.push(t.category));
      if (vendors) vendors.forEach(v => customVals.push(v.category));
    }
    if (name === 'group' && guests) guests.forEach(g => customVals.push(g.group));
    if (name === 'side' && guests) guests.forEach(g => customVals.push(g.side));
    if (name === 'status' && vendors) vendors.forEach(v => customVals.push(v.status));
  }

  const allOptions = [...new Set([...options, ...customVals, value])].filter(Boolean);

  return (
    <select name={name} value={value || ''} onChange={handleSelect}
      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent">
      {allOptions.map(o => {
        const isObj = typeof o === 'object' && o !== null;
        const val = isObj ? o.value : o;
        const lbl = isObj ? o.label : o;
        return <option key={val} value={val}>{lbl}</option>;
      })}
      <option disabled>──────────</option>
      <option value="__add_new__" className="font-bold text-indigo-600 dark:text-indigo-400">+ הוסף חדש...</option>
    </select>
  );
}
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none w-7 h-7 flex items-center justify-center">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function FilterPill({ active, color = 'indigo', onClick, children }) {
  const on = color === 'indigo' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-purple-600 text-white border-purple-600';
  const off = 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700';
  return <button onClick={onClick} className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${active ? on : off}`}>{children}</button>;
}

// ── Dashboard ──────────────────────────────────────────────────────────────
// ── Countdown Widget ───────────────────────────────────────────────────────
function HeroSection() {
  const { weddingDate, setWeddingDate } = useApp();
  const parsedDate = weddingDate ? new Date(weddingDate) : null;
  const [timeLeft, setTimeLeft] = useState(null);
  const dateInputRef = useRef(null);

  const handleDateClick = () => {
    try {
      if (dateInputRef.current && 'showPicker' in HTMLInputElement.prototype) {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current?.focus();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!parsedDate) {
      setTimeLeft(null);
      return;
    }
    const calc = () => {
      const diff = parsedDate - new Date();
      if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
      return {
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      };
    };
    setTimeLeft(calc());
    const timer = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(timer);
  }, [weddingDate]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-8 sm:p-12 min-h-[300px] sm:min-h-[400px] flex items-center shadow-2xl group bg-cover animate-pan-image transition-all duration-700 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]"
      style={{ backgroundImage: "url('/couple.jpg')" }}
    >
      {/* Elegant dark overlay to ensure text is always readable against any photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-slate-900/20"></div>
      <div className="absolute inset-0 bg-indigo-900/30 mix-blend-multiply group-hover:bg-indigo-900/10 transition-colors duration-700"></div>

      <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 animate-float">
        <div className="text-center md:text-right space-y-3">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm">
            המסע לחופה מתחיל
          </h2>
          {!parsedDate ? (
            <p className="text-indigo-100 text-lg md:text-xl font-medium bg-white/10 backdrop-blur-sm inline-block px-4 py-1.5 rounded-full border border-white/20">
              תאריך טרם נקבע
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-indigo-100 text-lg md:text-xl font-medium drop-shadow-sm">
                {parsedDate.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="flex gap-2 relative z-20">
                <button onClick={handleDateClick} className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded text-white transition-colors" title="ערוך תאריך">
                  ✎
                </button>
                <input type="date" ref={dateInputRef} className="sr-only" onChange={(e) => setWeddingDate(e.target.value)} />
                <button onClick={() => setWeddingDate(null)} className="p-1.5 bg-white/20 hover:bg-red-500/80 backdrop-blur-md rounded text-white transition-colors" title="מחק תאריך">
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {!parsedDate ? (
          <div className="flex-shrink-0 relative z-20">
            <button onClick={handleDateClick} className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block text-center">
              + קבעו תאריך
            </button>
            <input type="date" ref={dateInputRef} className="sr-only" onChange={(e) => setWeddingDate(e.target.value)} />
          </div>
        ) : (
          timeLeft && (
            <div className="flex gap-4 sm:gap-6" dir="ltr">
              {[
                { label: 'ימים', value: timeLeft.d },
                { label: 'שעות', value: timeLeft.h },
                { label: 'דקות', value: timeLeft.m },
                { label: 'שניות', value: timeLeft.s }
              ].map((unit, i) => (
                <div key={i} className="flex flex-col items-center group/item">
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border border-white/30 shadow-inner group-hover/item:bg-white/20 transition-colors duration-300">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-md">{unit.value}</span>
                  </div>
                  <span className="text-xs sm:text-sm mt-3 text-indigo-100 font-semibold uppercase tracking-wider">{unit.label}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function ProbabilityGuestsListModal({ prob, guests, deleteGuest, onEditGuest, onClose }) {
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState('הכל');
  const [groupFilter, setGroupFilter] = useState('הכל');

  const baseGuests = guests.filter(g => (g.arrival_probability ?? 100) === prob && g.rsvp_status !== 'לא מגיע');
  const sides = ['הכל', ...Array.from(new Set(baseGuests.map(g => g.side).filter(Boolean)))];
  const groups = ['הכל', ...Array.from(new Set(baseGuests.map(g => g.group).filter(Boolean)))];

  const filtered = baseGuests.filter(g => {
    if (search && !g.name.includes(search)) return false;
    if (sideFilter !== 'הכל' && g.side !== sideFilter) return false;
    if (groupFilter !== 'הכל' && g.group !== groupFilter) return false;
    return true;
  });

  return (
    <Modal title={`אורחים בסבירות ${prob}%`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* Filters and search */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            placeholder="חיפוש אורח..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
          <select value={sideFilter} onChange={e => setSideFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
            {sides.map(s => <option key={s} value={s}>{s === 'הכל' ? 'כל הצדדים' : s}</option>)}
          </select>
          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
            {groups.map(s => <option key={s} value={s}>{s === 'הכל' ? 'כל הקבוצות' : s}</option>)}
          </select>
        </div>

        {/* Guest List */}
        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 -mr-1">
          {filtered.map(g => (
            <div key={g.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-all group">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  {g.name} 
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">{g.party_size || 1} {g.party_size > 1 ? 'אורחים' : 'אורח'}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${g.rsvp_status === 'מגיע' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  {g.rsvp_status} • {g.group} ({g.side}) • <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{fmt(g.estimated_gift)} מתנה צפויה</span>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEditGuest(g)} className="px-2.5 py-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">✎ ערוך</button>
                <button onClick={() => deleteGuest(g.id)} className="px-2.5 py-1.5 text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors">✕ הסר</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-slate-400 dark:text-slate-500 text-sm py-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              לא מצאנו אורחים תואמים לסינון 🧐
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700/50">
          <span>סה״כ {filtered.length} משפחות/זוגות</span>
          <span>צפי הגעה: {filtered.reduce((s, g) => s + num(g.party_size || 1), 0)} מוזמנים</span>
        </div>
      </div>
    </Modal>
  );
}

function Dashboard() {
  const { metrics, guests, updateGuest, deleteGuest, confirm } = useApp();
  const [selectedProbPopup, setSelectedProbPopup] = useState(null);
  const [editGuestPopup, setEditGuestPopup] = useState(null);

  const { totalExpensesWithBuffer, contingencyBuffer, totalOutOfPocket, totalBalanceDue,
    totalExpectedGifts, expectedGiftsArriving, expectedGiftsPending, rsvpYesCount, pendingCount, safeVenueCommitment, 
    expectedAttendees, expectedAttendeesArriving, expectedAttendeesPending,
    totalInvited, bepPerGuest, averageGiftExpected, bepComparison, expenseProgress, netProfitLoss, netProfitLossArriving, expensesByCategory, tasksDone, tasksTotal, probabilityBreakdown, totalActualExpenses, totalEstimatedExpenses } = metrics;

  const barItems = [
    { name: 'סה״כ הוצאות', amount: totalExpensesWithBuffer, fill: '#6366f1' },
    { name: 'מתנות צפויות', amount: totalExpectedGifts, fill: '#10b981' },
  ];
  const isProfit = netProfitLoss >= 0;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">לוח בקרה ראשי</h2>
      </div>

      <HeroSection />

      {/* TIER 1: HIGH LEVEL FINANCIAL PULSE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Profit/Loss Feature Card */}
        <div className={`xl:col-span-1 rounded-[2rem] p-8 shadow-lg border flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isProfit
          ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-300 text-white shadow-emerald-500/20'
          : 'bg-gradient-to-br from-rose-400 to-rose-600 border-rose-300 text-white shadow-rose-500/20'
          }`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-widest text-white/80">
              תחזית תקציב (רווח/הפסד)
            </p>
            <div className={`p-2 rounded-xl backdrop-blur-md bg-white/20 ${isProfit ? 'text-emerald-100' : 'text-rose-100'}`}>
              {isProfit ? '📈' : '📉'}
            </div>
          </div>
          <div className="mt-6 mb-8">
            <h3 className="text-6xl lg:text-7xl font-black tracking-tighter drop-shadow-sm">
              {isProfit ? '+' : ''}{fmt(netProfitLoss)}
            </h3>
            <p className="text-sm mt-4 font-medium bg-white/20 backdrop-blur-md inline-block px-4 py-2 rounded-xl">
              {isProfit ? '✨ מעולה! נראה שתכסו את ההוצאות ברוגע.' : `⚠️ זהירות, צפוי מחסור. יש להיערך בהתאם.`}
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-5 border-t border-white/20">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-white/80">מבוסס אך ורק על מאשרים:</span>
              <span className="font-bold bg-white/10 px-2 py-0.5 rounded">
                {netProfitLossArriving >= 0 ? '+' : ''}{fmt(netProfitLossArriving)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-white/80">פוטנציאל נוסף מממתינים:</span>
              <span className="font-bold bg-white/10 px-2 py-0.5 rounded">
                +{fmt(expectedGiftsPending)}
              </span>
            </div>
          </div>
        </div>

        {/* Expenses & Gifts Summary (Stacked or Side by Side) */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expenses */}
          <div className="rounded-[2rem] p-8 bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 hover:shadow-md flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-2 relative z-10">סה״כ הוצאות</p>
            <h3 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-slate-100 relative z-10">{fmt(totalExpensesWithBuffer)}</h3>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 relative z-10">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">הוצאות ודאיות:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{fmt(totalActualExpenses)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">הוצאות משוערות:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{fmt(totalEstimatedExpenses)}</span>
                </div>
                <div className="flex justify-between items-center text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2 py-1.5 rounded mt-1 border border-orange-100/50 dark:border-orange-800/30">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                    כרית ביטחון (10%):
                  </span>
                  <span className="font-bold">{fmt(contingencyBuffer)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expected Gifts */}
          <div className="rounded-[2rem] p-8 bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 hover:shadow-md flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-2 relative z-10">סה״כ מתנות צפויות</p>
            <h3 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-slate-100 relative z-10">{fmt(totalExpectedGifts)}</h3>
            
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 relative z-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">חלוקה לפי סבירות:</p>
              <div className="flex flex-wrap gap-1.5">
                {probabilityBreakdown.map(({ prob, expectedGifts }) => (
                  <button key={prob} onClick={() => setSelectedProbPopup(prob)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-900/20 border border-slate-200/50 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800 shadow-sm transition-all cursor-pointer text-left group/btn">
                    <span className="text-[10px] font-semibold text-slate-500 group-hover/btn:text-emerald-600 dark:group-hover/btn:text-emerald-400">{prob}%:</span>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover/btn:text-emerald-700 dark:group-hover/btn:text-emerald-300">{fmt(expectedGifts)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TIER 2: GUEST LOGISTICS & CASHFLOW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Guest Overview */}
        <div className="lg:col-span-2 rounded-[2rem] p-8 bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">סטטוס מוזמנים</h3>
            <div className="text-right flex items-end gap-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">סה״כ הוזמנו:</p>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{totalInvited}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 text-center">
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500 mb-1">{rsvpYesCount}</p>
              <p className="text-[11px] text-emerald-800/70 dark:text-emerald-400 font-bold uppercase tracking-wider">אישרו ({Math.round(expectedAttendeesArriving)} יגיעו)</p>
            </div>
            <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/30 text-center">
              <p className="text-3xl font-black text-amber-500 dark:text-amber-500 mb-1">{pendingCount}</p>
              <p className="text-[11px] text-amber-800/70 dark:text-amber-400 font-bold uppercase tracking-wider">ממתינים ({Math.round(expectedAttendeesPending)} יגיעו)</p>
            </div>
            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-indigo-500"></div>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">{Math.round(expectedAttendees)}</p>
              <p className="text-[11px] text-indigo-800/70 dark:text-indigo-400 font-bold uppercase tracking-wider">צפי הגעה סופי</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-3xl font-black text-slate-700 dark:text-slate-300 mb-1">{safeVenueCommitment}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">התחייבות אולם (90%)</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">פילוח צפי הגעה:</p>
            <div className="flex flex-wrap gap-2">
              {probabilityBreakdown.map(({ prob, count }) => (
                <button key={prob} onClick={() => setSelectedProbPopup(prob)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-600 shadow-sm transition-all cursor-pointer">
                  <span className="text-[11px] font-bold text-slate-500">{prob}%:</span>
                  <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">{count} אנשים</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actionable Finance (BEP & Cashflow) */}
        <div className="flex flex-col gap-6">
          
          {/* Break Even Point */}
          <div className="rounded-[2rem] p-6 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 shadow-sm border border-indigo-100 dark:border-indigo-800/50 flex-1 flex flex-col justify-center">
            <h3 className="text-sm font-extrabold text-indigo-900/60 dark:text-indigo-300 uppercase tracking-widest mb-1">ממוצע מתנה מול עלות מנה</h3>
            <div className="flex items-end gap-3 mt-2">
              <p className="text-4xl font-black text-indigo-700 dark:text-indigo-300">{fmt(Math.round(bepPerGuest))}</p>
              <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 mb-2">עלות מנה (נק&apos; איזון)</p>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-indigo-900/70 dark:text-indigo-200/70">צפי מתנה ממוצע לאורח:</span>
                <span className="font-bold text-indigo-800 dark:text-indigo-200">{fmt(Math.round(averageGiftExpected))}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium pt-2 border-t border-indigo-200/50 dark:border-indigo-700/50">
                <span className="text-indigo-900/70 dark:text-indigo-200/70">הפרש:</span>
                <span className={`font-black px-2 py-0.5 rounded-md ${bepComparison >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'}`}>
                  {bepComparison >= 0 ? '+' : ''}{fmt(Math.round(bepComparison))}
                </span>
              </div>
            </div>
          </div>

          {/* Cashflow */}
          <div className="rounded-[2rem] p-6 bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex-1 flex flex-col justify-center">
            <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">תזרים תשלומים</h3>
            <div className="space-y-4">
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-4 shadow-inner overflow-hidden relative">
                <div className="bg-emerald-500 h-4 rounded-full transition-all duration-1000 ease-out" style={{ width: `${expenseProgress}%` }}></div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">שולם מראש ({expenseProgress}%)</p>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200">{fmt(totalOutOfPocket)}</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-amber-500 dark:text-amber-400 font-bold uppercase">יתרה לתשלום</p>
                  <p className="text-lg font-black text-amber-600 dark:text-amber-500">{fmt(totalBalanceDue)}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* TIER 3: INSIGHTS & TASKS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="rounded-[2rem] p-8 bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">פירוט הוצאות (לפי קטגוריות)</h3>
          </div>
          <DonutChart data={expensesByCategory} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[2rem] p-8 bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 hover:shadow-md flex-1">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">מאזן הוצאות מול מתנות</h3>
            </div>
            <BarChart items={barItems} />
          </div>

          {tasksTotal > 0 && (
            <div className="rounded-[2rem] p-6 bg-slate-50 dark:bg-slate-900/50 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest">התקדמות מטלות</span>
                </div>
                <span className="text-[11px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full">{tasksDone} / {tasksTotal} הושלמו</span>
              </div>
              <div className="w-full bg-white dark:bg-slate-800 rounded-full h-3 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${tasksTotal ? tasksDone / tasksTotal * 100 : 0}%` }}></div>
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" style={{ backgroundSize: '1rem 1rem' }}></div>
              </div>
            </div>
          )}
        </div>

      </div>

      {selectedProbPopup !== null && (
        <ProbabilityGuestsListModal 
          prob={selectedProbPopup} 
          guests={guests}
          deleteGuest={id => confirm('להסיר אורח זה?').then(y => { if(y) deleteGuest(id); })}
          onEditGuest={g => setEditGuestPopup(g)}
          onClose={() => setSelectedProbPopup(null)} 
        />
      )}
      {editGuestPopup && (
        <GuestModal 
          guest={editGuestPopup} 
          onSave={data => { updateGuest(editGuestPopup?.id, data); setEditGuestPopup(null); }} 
          onClose={() => setEditGuestPopup(null)} 
        />
      )}
    </div>
  );
}

// ── Expenses ───────────────────────────────────────────────────────────────
function ExpenseModal({ expense, onSave, onClose }) {
  const blank = { name: '', category: 'אולם וקייטרינג', total_cost: '', deposit_paid: '', estimated: false };
  const [form, setForm] = useState(expense ? { ...expense } : blank);
  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const balanceDue = num(form.total_cost) - num(form.deposit_paid);
  return (
    <Modal title={expense ? 'ערוך הוצאה' : 'הוסף הוצאה'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Field label="שם ההוצאה"><TextInput name="name" value={form.name} onChange={set} required placeholder="לדוגמה: אולם חתונה" /></Field></div>
          <div className="col-span-2"><Field label="קטגוריה"><SelectInput name="category" value={form.category} onChange={set} options={EXPENSE_CATEGORIES} /></Field></div>
          <Field label="עלות כוללת (₪)"><TextInput name="total_cost" value={form.total_cost} onChange={set} type="number" min="0" required placeholder="0" /></Field>
          <Field label="מקדמה ששולמה (₪)"><TextInput name="deposit_paid" value={form.deposit_paid} onChange={set} type="number" min="0" required placeholder="0" /></Field>
          <div className="col-span-2 flex items-center gap-2 mt-1">
            <input type="checkbox" id="estimated" name="estimated" checked={form.estimated || false} onChange={e => setForm(p => ({ ...p, estimated: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
            <label htmlFor="estimated" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">הוצאה משוערת (המחיר אינו סופי)</label>
          </div>
        </div>
        {form.total_cost !== '' && form.deposit_paid !== '' && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 rounded-xl px-4 py-2.5 text-sm">
            <span className="text-blue-600 dark:text-blue-300">יתרה לתשלום אחרי החתונה</span>
            <span className="font-bold text-blue-700 dark:text-blue-300">{fmt(balanceDue)}</span>
          </div>
        )}
        <div className="flex gap-2 justify-end pt-1">
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn type="submit">{expense ? 'שמור שינויים' : 'הוסף הוצאה'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense, metrics, confirm } = useApp();
  const [modal, setModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSave = (data) => { if (modal === 'new') addExpense(data); else updateExpense(modal.id, data); setModal(null); };

  const filteredExpenses = expenses.filter(exp =>
    exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {modal && <ExpenseModal expense={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">מעקב הוצאות</h2>
        <Btn onClick={() => setModal('new')}>+ הוסף הוצאה</Btn>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="w-full md:w-72 relative">
          <input
            type="text"
            placeholder="חיפוש הוצאה או קטגוריה..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
        </div>
        <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 dark:text-slate-400">
          {[['#6366f1', 'עלות כוללת'], ['#f97316', 'מקדמה ששולמה'], ['#3b82f6', 'יתרה לתשלום']].map(([c, l]) => (
            <span key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shadow-sm" style={{ background: c }}></span>{l}</span>
          ))}
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 border-dashed border-2 bg-transparent"><p className="text-lg font-medium">לא נמצאו הוצאות</p><p className="text-sm mt-1">נסה חיפוש אחר או הוסף הוצאה חדשה</p></Card>
      ) : (
        <Card className="overflow-hidden shadow-sm">
          {/* Mobile View: Cards */}
          <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
            {filteredExpenses.map(exp => (
              <div key={exp.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {exp.name}
                      {exp.estimated && <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-bold">משוער</span>}
                    </h3>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: (CAT_COLORS[exp.category] || '#6366f1') + '20', color: CAT_COLORS[exp.category] || '#6366f1' }}>{exp.category}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setModal(exp)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 rounded-md">✎</button>
                    <button onClick={() => { confirm('למחוק הוצאה זו?').then(yes => { if (yes) deleteExpense(exp.id); }) }} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 rounded-md">✕</button>
                  </div>
                </div>
                <div className="flex justify-between text-xs mt-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
                  <div className="flex flex-col"><span className="text-slate-500">עלות</span><span className="font-semibold">{fmt(exp.total_cost)}</span></div>
                  <div className="flex flex-col items-center"><span className="text-slate-500">מקדמה</span><span className="font-semibold text-orange-500">{fmt(exp.deposit_paid)}</span></div>
                  <div className="flex flex-col items-end"><span className="text-slate-500">יתרה</span><span className="font-semibold text-blue-600">{fmt(num(exp.total_cost) - num(exp.deposit_paid))}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600 text-[11px] uppercase tracking-widest text-slate-500">
                  <th className="text-right px-4 py-3 font-semibold">הוצאה</th>
                  <th className="text-right px-4 py-3 font-semibold">קטגוריה</th>
                  <th className="text-right px-4 py-3 font-semibold">עלות כוללת</th>
                  <th className="text-right px-4 py-3 font-semibold">מקדמה ששולמה</th>
                  <th className="text-right px-4 py-3 font-semibold">יתרה לתשלום</th>
                  <th className="text-center px-4 py-3 font-semibold w-28">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        {exp.name}
                        {exp.estimated && <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-bold">משוער</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: (CAT_COLORS[exp.category] || '#6366f1') + '20', color: CAT_COLORS[exp.category] || '#6366f1' }}>{exp.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">{fmt(exp.total_cost)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-500">{fmt(exp.deposit_paid)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600">{fmt(num(exp.total_cost) - num(exp.deposit_paid))}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Btn variant="ghost" size="sm" onClick={() => setModal(exp)}>ערוך</Btn>
                        <Btn variant="danger" size="sm" onClick={() => { confirm('למחוק הוצאה זו?').then(yes => { if (yes) deleteExpense(exp.id); }) }}>✕</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-4 py-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300"><span>סכום ביניים</span><span className="font-semibold text-slate-900 dark:text-slate-100">{fmt(metrics.totalExpenses)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-orange-600 font-medium">כרית ביטחון (10%)</span><span className="font-semibold text-orange-600">+ {fmt(metrics.contingencyBuffer)}</span></div>
            <div className="flex justify-between text-base font-bold border-t border-slate-300 dark:border-slate-600 pt-2">
              <span className="text-slate-900 dark:text-slate-100">סה״כ כולל כרית ביטחון</span>
              <span className="text-indigo-600 dark:text-indigo-400">{fmt(metrics.totalExpensesWithBuffer)}</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 border-t border-dashed border-slate-300 dark:border-slate-600">
              <span className="text-xs text-orange-500"><strong>מקדמות:</strong> {fmt(metrics.totalOutOfPocket)} <span className="text-slate-400">(מכיס לפני החתונה)</span></span>
              <span className="text-xs text-blue-500 mr-auto"><strong>יתרה:</strong> {fmt(metrics.totalBalanceDue)} <span className="text-slate-400">(מכוסה ע״י מתנות)</span></span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Guests ─────────────────────────────────────────────────────────────────
function GuestModal({ guest, onSave, onClose }) {
  const blank = { name: '', phone: '', party_size: 1, group: 'כללי', side: 'כלה', rsvp_status: 'ממתין', estimated_gift: GROUP_GIFT_DEFAULTS['כללי'], actual_gift: 0, arrival_probability: 100 };
  const [form, setForm] = useState(guest ? { party_size: 1, ...guest } : blank);
  const set = e => {
    const { name, value } = e.target;
    if (name === 'group') setForm(p => ({ ...p, group: value, estimated_gift: (GROUP_GIFT_DEFAULTS[value] || 350) * num(p.party_size || 1) }));
    else if (name === 'party_size') setForm(p => ({ ...p, party_size: value, estimated_gift: (GROUP_GIFT_DEFAULTS[p.group] || 350) * num(value || 1) }));
    else setForm(p => ({ ...p, [name]: value }));
  };
  return (
    <Modal title={guest ? 'ערוך אורח' : 'הוסף אורח'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="שם האורח / משפחה"><TextInput name="name" value={form.name} onChange={set} required placeholder="שם מלא או זוג" /></Field>
          <Field label="טלפון"><TextInput name="phone" value={form.phone} onChange={set} type="tel" placeholder="050-0000000" /></Field>
          <Field label="כמות אורחים"><TextInput name="party_size" value={form.party_size} onChange={set} type="number" min="1" required placeholder="1" /></Field>
          <Field label="קבוצה"><SelectInput name="group" value={form.group} onChange={set} options={GUEST_GROUPS.includes(form.group) ? GUEST_GROUPS : [form.group, ...GUEST_GROUPS]} /></Field>
          <Field label="צד"><SelectInput name="side" value={form.side} onChange={set} options={GUEST_SIDES} /></Field>
          <Field label="סטטוס"><SelectInput name="rsvp_status" value={form.rsvp_status} onChange={set} options={RSVP_STATUSES} /></Field>
          <Field label="מתנה מוערכת (₪)" hint="— מחושב אוטומטית"><TextInput name="estimated_gift" value={form.estimated_gift} onChange={set} type="number" min="0" /></Field>
          <div className="col-span-2"><Field label="מתנה שהתקבלה בפועל (₪)"><TextInput name="actual_gift" value={form.actual_gift} onChange={set} type="number" min="0" placeholder="0" /></Field></div>
          <div className="col-span-2">
            <Field label={`סבירות הגעה: ${form.arrival_probability ?? 100}%`}>
              <input type="range" name="arrival_probability" min="0" max="100" step="10" value={form.arrival_probability ?? 100} onChange={set} className="w-full accent-indigo-600 cursor-pointer" />
            </Field>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn type="submit">{guest ? 'שמור שינויים' : 'הוסף אורח'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function Guests() {
  const { guests, addGuest, addMultipleGuests, updateGuest, deleteGuest, metrics, addToast, confirm } = useApp();
  const [modal, setModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState('הכל');
  const [sideFilter, setSideFilter] = useState('הכל');
  const [groupFilter, setGroupFilter] = useState('הכל');
  const [phoneFilter, setPhoneFilter] = useState('הכל');
  const [probFilter, setProbFilter] = useState([]);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const handleSave = (data) => { if (modal === 'new') addGuest(data); else updateGuest(modal.id, data); setModal(null); };

  const filtered = guests.filter(g =>
    (rsvpFilter === 'הכל' || g.rsvp_status === rsvpFilter) &&
    (sideFilter === 'הכל' || g.side === sideFilter) &&
    (groupFilter === 'הכל' || g.group === groupFilter) &&
    (phoneFilter === 'הכל' || (phoneFilter === 'יש טלפון' ? g.phone && g.phone.trim() !== '' : !g.phone || g.phone.trim() === '')) &&
    (probFilter.length === 0 || probFilter.includes(`${g.arrival_probability ?? 100}%`)) &&
    (g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     (g.phone && g.phone.includes(searchQuery)))
  );
  const totalActual = guests.reduce((s, g) => s + num(g.actual_gift), 0);
  const countHeads = (arr) => arr.reduce((acc, g) => acc + (parseInt(g.party_size) || 1), 0);

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(guests.map(g => ({
        'שם האורח': g.name,
        'טלפון': g.phone || '',
        'צד': g.side,
        'קבוצה': g.group,
        'כמות אורחים': g.party_size,
        'סטטוס': g.rsvp_status,
        'סבירות הגעה (%)': g.arrival_probability ?? 100,
        'מתנה משוערת': g.estimated_gift,
        'מתנה בפועל': g.actual_gift,
        'הגבלות תזונה / הערות': g.dietary || ''
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "אורחים");
      XLSX.writeFile(wb, "wedding_guests.xlsx");
      addToast('הקובץ יוצא בהצלחה!', 'success');
    } catch (err) {
      addToast('שגיאה בייצוא הקובץ', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {modal && <GuestModal guest={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">אורחים ואומדן מתנות</h2>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            ייצא Excel
          </button>
          <Btn onClick={() => setModal('new')}>+ הוסף אורח</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'סה״כ מוזמנים', val: metrics.totalInvited, cls: 'text-slate-800 dark:text-slate-100' },
          { label: 'אישרו הגעה', val: metrics.rsvpYesCount, cls: 'text-emerald-600' },
          { label: 'ממתינים', val: metrics.pendingCount, cls: 'text-amber-600' },
          { label: 'צפי הגעה משוקלל', val: Math.round(metrics.expectedAttendees), cls: 'text-blue-600 dark:text-blue-400' },
          { label: 'התחייבות ×0.9', val: metrics.safeVenueCommitment, cls: 'text-indigo-600 dark:text-indigo-400' },
        ].map(({ label, val, cls }) => (
          <Card key={label} className="p-4 text-center shadow-sm">
            <div className={`text-2xl font-bold ${cls}`}>{val}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{label}</div>
          </Card>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
        <strong>💡 אומדן מתנות שמרני:</strong> משפחה קרובה = ₪500 · כללי / חברים = ₪350
      </div>

      <div className="flex flex-col gap-4 bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex w-full md:w-auto gap-2">
            <div className="w-full md:w-72 relative">
              <input
                type="text"
                placeholder="חיפוש לפי שם אורח או טלפון..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
            </div>
            <button 
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="md:hidden px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 font-medium text-xs transition-colors whitespace-nowrap"
            >
              {showFiltersMobile ? 'הסתר סינון' : 'סינון מתקדם'}
            </button>
          </div>
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
            מציג <span className="text-indigo-600 dark:text-indigo-400">{countHeads(filtered)}</span> מתוך {countHeads(guests)} מוזמנים
          </div>
        </div>

        <div className={`${showFiltersMobile ? 'flex' : 'hidden'} md:flex flex-col gap-4`}>
          <div className="flex flex-col xl:flex-row gap-5 xl:gap-6">
          {/* Status Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">סטטוס הגעה</span>
            <div className="flex flex-wrap gap-1.5">
              {['הכל', ...RSVP_STATUSES].map(s => {
                const count = s === 'הכל' ? countHeads(guests) : countHeads(guests.filter(g => g.rsvp_status === s));
                return <FilterPill key={s} active={rsvpFilter === s} color="indigo" onClick={() => setRsvpFilter(s)}>{s} <span className="opacity-70 text-[10px] font-normal mr-0.5">({count})</span></FilterPill>;
              })}
            </div>
          </div>
          
          <div className="hidden xl:block w-px bg-slate-100 dark:bg-slate-700/50"></div>

          {/* Side Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">צד</span>
            <div className="flex flex-wrap gap-1.5">
              {['הכל', ...GUEST_SIDES].map(s => {
                const count = s === 'הכל' ? countHeads(guests) : countHeads(guests.filter(g => g.side === s));
                return <FilterPill key={s} active={sideFilter === s} color="purple" onClick={() => setSideFilter(s)}>{s} <span className="opacity-70 text-[10px] font-normal mr-0.5">({count})</span></FilterPill>;
              })}
            </div>
          </div>

          <div className="hidden xl:block w-px bg-slate-100 dark:bg-slate-700/50"></div>

          {/* Phone Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">טלפון</span>
            <div className="flex flex-wrap gap-1.5">
              {['הכל', 'יש טלפון', 'חסר טלפון'].map(s => {
                let count = countHeads(guests);
                if (s === 'יש טלפון') count = countHeads(guests.filter(g => g.phone && g.phone.trim() !== ''));
                if (s === 'חסר טלפון') count = countHeads(guests.filter(g => !g.phone || g.phone.trim() === ''));
                return <FilterPill key={s} active={phoneFilter === s} color="blue" onClick={() => setPhoneFilter(s)}>{s} <span className="opacity-70 text-[10px] font-normal mr-0.5">({count})</span></FilterPill>;
              })}
            </div>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-700/50 my-1" />

        <div className="flex flex-col xl:flex-row gap-5 xl:gap-6">
          {/* Group Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">קבוצה</span>
            <div className="flex flex-wrap gap-1.5">
              {['הכל', ...Array.from(new Set(guests.map(g => g.group).filter(Boolean)))].map(s => {
                const count = s === 'הכל' ? countHeads(guests) : countHeads(guests.filter(g => g.group === s));
                return <FilterPill key={s} active={groupFilter === s} color="emerald" onClick={() => setGroupFilter(s)}>{s} <span className="opacity-70 text-[10px] font-normal mr-0.5">({count})</span></FilterPill>;
              })}
            </div>
          </div>

          <div className="hidden xl:block w-px bg-slate-100 dark:bg-slate-700/50"></div>

          {/* Prob Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">סבירות הגעה</span>
            <div className="flex flex-wrap gap-1.5">
              <FilterPill active={probFilter.length === 0} color="teal" onClick={() => setProbFilter([])}>
                הכל <span className="opacity-70 text-[10px] font-normal mr-0.5">({countHeads(guests)})</span>
              </FilterPill>
              {Array.from(new Set(guests.map(g => g.arrival_probability ?? 100))).sort((a,b)=>b-a).map(p => `${p}%`).map(s => {
                const count = countHeads(guests.filter(g => `${g.arrival_probability ?? 100}%` === s));
                const isActive = probFilter.includes(s);
                return (
                  <FilterPill 
                    key={s} 
                    active={isActive} 
                    color="teal" 
                    onClick={() => setProbFilter(prev => isActive ? prev.filter(x => x !== s) : [...prev, s])}
                  >
                    {s} <span className="opacity-70 text-[10px] font-normal mr-0.5">({count})</span>
                  </FilterPill>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>

      <Card className="overflow-hidden shadow-sm">
        {/* Mobile View: Cards */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
          {filtered.map(g => (
            <div key={g.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{g.name} <span className="text-sm font-normal text-slate-500">({g.party_size || 1})</span></h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{g.group} • {g.side}</span>
                    {g.phone && <a href={`tel:${g.phone}`} className="text-xs font-medium text-indigo-500 hover:text-indigo-600 flex items-center gap-1" onClick={e => e.stopPropagation()}>📞 {g.phone}</a>}
                  </div>
                </div>
                <div className="flex gap-1 items-center">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${RSVP_BADGE[g.rsvp_status]}`}>{g.rsvp_status}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{g.arrival_probability ?? 100}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
                <div className="flex flex-col"><span className="text-[10px] text-slate-500">מוערכת</span><span className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">{fmt(g.estimated_gift)}</span></div>
                <div className="flex flex-col items-center"><span className="text-[10px] text-slate-500">בפועל</span><span className="font-semibold text-emerald-600 text-sm">{num(g.actual_gift) > 0 ? fmt(g.actual_gift) : '—'}</span></div>
                <div className="flex gap-1">
                  <button onClick={() => setModal(g)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-600">✎</button>
                  <button onClick={() => { confirm('להסיר אורח זה?').then(yes => { if (yes) deleteGuest(g.id); }) }} className="p-1.5 text-slate-400 hover:text-rose-600 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-600">✕</button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">אין אורחים התואמים את הסינון</div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600 text-[11px] uppercase tracking-widest text-slate-500">
                <th className="text-right px-4 py-3 font-semibold">שם</th>
                <th className="text-right px-4 py-3 font-semibold">טלפון</th>
                <th className="text-center px-4 py-3 font-semibold">כמות</th>
                <th className="text-right px-4 py-3 font-semibold">קבוצה</th>
                <th className="text-right px-4 py-3 font-semibold">צד</th>
                <th className="text-center px-4 py-3 font-semibold">סטטוס</th>
                <th className="text-center px-4 py-3 font-semibold">הגעה</th>
                <th className="text-right px-4 py-3 font-semibold">מתנה מוערכת</th>
                <th className="text-right px-4 py-3 font-semibold">מתנה בפועל</th>
                <th className="text-center px-4 py-3 font-semibold w-28">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{g.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {g.phone ? <a href={`tel:${g.phone}`} className="text-indigo-500 hover:underline">{g.phone}</a> : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-semibold text-slate-500">{g.party_size || 1}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{g.group}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{g.side}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${RSVP_BADGE[g.rsvp_status]}`}>{g.rsvp_status}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {g.arrival_probability ?? 100}%
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">{fmt(g.estimated_gift)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                    {num(g.actual_gift) > 0 ? fmt(g.actual_gift) : <span className="text-slate-300 font-normal">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Btn variant="ghost" size="sm" onClick={() => setModal(g)}>ערוך</Btn>
                      <Btn variant="danger" size="sm" onClick={() => { confirm('להסיר אורח זה?').then(yes => { if (yes) deleteGuest(g.id); }) }}>✕</Btn>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm border-dashed border-2 m-4 bg-transparent">לא נמצאו אורחים מתאימים</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-4 py-4 space-y-1.5">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>סה״כ מתנות צפויות (מגיעים + ממתינים)</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{fmt(metrics.totalExpectedGifts)}</span>
          </div>
          {totalActual > 0 && (
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
              <span>סה״כ מתנות שהתקבלו בפועל</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalActual)}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Checklist ──────────────────────────────────────────────────────────────
function TaskModal({ task, onSave, onClose }) {
  const blank = { text: '', category: 'הכנות', due_date: '', urgency: 'רגילה' };
  const [form, setForm] = useState(task ? { ...task } : blank);
  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  return (
    <Modal title={task ? 'ערוך משימה' : 'הוסף משימה'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <Field label="תיאור המשימה"><TextInput name="text" value={form.text} onChange={set} required placeholder="לדוגמה: לשלוח הזמנות" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="קטגוריה"><SelectInput name="category" value={form.category} onChange={set} options={CHECKLIST_CATS} /></Field>
          <Field label="דחיפות"><SelectInput name="urgency" value={form.urgency || 'רגילה'} onChange={set} options={TASK_URGENCIES} /></Field>
        </div>
        <Field label="תאריך יעד"><TextInput name="due_date" value={form.due_date} onChange={set} type="date" /></Field>
        <div className="flex gap-2 justify-end pt-1">
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn type="submit">{task ? 'שמור שינויים' : 'הוסף משימה'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function Checklist() {
  const { tasks, addTask, toggleTask, updateTask, deleteTask, reorderTasks, confirm } = useApp();
  const [modal, setModal] = useState(null);
  const [catFilter, setCatFilter] = useState('הכל');
  const [searchQuery, setSearchQuery] = useState('');

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    
    // We map the visual index back to the actual item id
    const srcId = filtered[result.source.index].id;
    const tgtId = filtered[result.destination.index].id;
    reorderTasks(srcId, tgtId);
  };

  const handleSave = (data) => { if (modal === 'new') addTask(data); else updateTask(modal.id, data); setModal(null); };

  const filtered = tasks.filter(t =>
    (catFilter === 'הכל' || t.category === catFilter) &&
    (t.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const done = tasks.filter(t => t.done).length;

  return (
    <div className="space-y-6">
      {modal && <TaskModal task={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">רשימת מטלות</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{done} / {tasks.length} הושלמו</p>
        </div>
        <Btn onClick={() => setModal('new')}>+ הוסף משימה</Btn>
      </div>

      {tasks.length > 0 && (
        <Card className="p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">התקדמות כללית</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{Math.round(done / tasks.length * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${done / tasks.length * 100}%` }}></div>
          </div>
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="w-full md:w-64 relative">
          <input
            type="text"
            placeholder="חיפוש משימה..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {['הכל', ...CHECKLIST_CATS].map(c => <FilterPill key={c} active={catFilter === c} color="indigo" onClick={() => setCatFilter(c)}>{c}</FilterPill>)}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 border-dashed border-2 bg-transparent"><p className="text-lg font-medium">אין משימות</p><p className="text-sm mt-1">נסה חיפוש אחר או הוסף משימה חדשה</p></Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks-list">
            {(provided) => (
              <div 
                className="space-y-3"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {filtered.map((t, idx) => (
                  <Draggable key={t.id} draggableId={t.id} index={idx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{ ...provided.draggableProps.style }}
                      >
                        <Card 
                          className={`p-4 flex items-center gap-4 transition-all duration-300 ${snapshot.isDragging ? 'shadow-xl ring-2 ring-indigo-500 scale-[1.02] z-50 opacity-100' : 'hover:shadow-md'} ${t.done && !snapshot.isDragging ? 'opacity-60 bg-slate-50 dark:bg-slate-800/50' : ''}`}
                        >
                          <div 
                            className="text-slate-300 hover:text-indigo-500 dark:text-slate-600 cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors p-1"
                            {...provided.dragHandleProps}
                          >
                            <svg width="16" height="24" viewBox="0 0 16 24" fill="currentColor">
                              <circle cx="6" cy="6" r="1.5"/><circle cx="10" cy="6" r="1.5"/>
                              <circle cx="6" cy="12" r="1.5"/><circle cx="10" cy="12" r="1.5"/>
                              <circle cx="6" cy="18" r="1.5"/><circle cx="10" cy="18" r="1.5"/>
                            </svg>
                          </div>
                          <button onClick={() => toggleTask(t.id)}
                            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${t.done ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-500 hover:border-indigo-400'}`}>
                            {t.done && <span className="text-white text-xs font-bold leading-none">✓</span>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium text-slate-900 dark:text-slate-100 ${t.done ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>{t.text}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{t.category}</span>
                              {t.due_date && <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">📅 {t.due_date}</span>}
                              <span className={`w-3 h-3 rounded-full flex-shrink-0 shadow-sm ${URGENCY_COLORS[t.urgency || 'רגילה']}`} title={`דחיפות: ${t.urgency || 'רגילה'}`}></span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => setModal(t)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 rounded-md">✎</button>
                            <button onClick={() => { confirm('למחוק משימה זו?').then(yes => { if (yes) deleteTask(t.id); }) }} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 rounded-md">✕</button>
                          </div>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}

// ── Vendors ────────────────────────────────────────────────────────────────
function VendorModal({ vendor, onSave, onClose }) {
  const blank = { name: '', category: 'ספקים מרכזיים', contact_name: '', phone: '', contract_amount: '', paid_amount: '', status: 'ליצור קשר', notes: '' };
  const [form, setForm] = useState(vendor ? { ...vendor } : blank);
  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const remaining = num(form.contract_amount) - num(form.paid_amount);
  return (
    <Modal title={vendor ? 'ערוך ספק' : 'הוסף ספק'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Field label="שם הספק"><TextInput name="name" value={form.name} onChange={set} required placeholder="לדוגמה: DJ מושיקו" /></Field></div>
          <Field label="קטגוריה"><SelectInput name="category" value={form.category} onChange={set} options={VENDOR_CATEGORIES} /></Field>
          <Field label="סטטוס"><SelectInput name="status" value={form.status} onChange={set} options={VENDOR_STATUSES} /></Field>
          <Field label="איש קשר"><TextInput name="contact_name" value={form.contact_name} onChange={set} placeholder="שם" /></Field>
          <Field label="טלפון"><TextInput name="phone" value={form.phone} onChange={set} type="tel" placeholder="050-0000000" /></Field>
          <Field label="סכום חוזה (₪)"><TextInput name="contract_amount" value={form.contract_amount} onChange={set} type="number" min="0" placeholder="0" /></Field>
          <Field label="שולם (₪)"><TextInput name="paid_amount" value={form.paid_amount} onChange={set} type="number" min="0" placeholder="0" /></Field>
          <div className="col-span-2"><Field label="הערות"><TextInput name="notes" value={form.notes} onChange={set} placeholder="פרטים נוספים..." /></Field></div>
        </div>
        {form.contract_amount !== '' && (
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-2.5 text-sm">
            <span className="text-amber-600 dark:text-amber-300">יתרה לתשלום לספק</span>
            <span className="font-bold text-amber-700 dark:text-amber-300">{fmt(remaining)}</span>
          </div>
        )}
        <div className="flex gap-2 justify-end pt-1">
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn type="submit">{vendor ? 'שמור שינויים' : 'הוסף ספק'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function Vendors() {
  const { vendors, addVendor, updateVendor, deleteVendor, confirm } = useApp();
  const [modal, setModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('הכל');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSave = (data) => { if (modal === 'new') addVendor(data); else updateVendor(modal.id, data); setModal(null); };

  const filtered = vendors.filter(v =>
    (statusFilter === 'הכל' || v.status === statusFilter) &&
    (v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalContract = vendors.reduce((s, v) => s + num(v.contract_amount), 0);
  const totalPaid = vendors.reduce((s, v) => s + num(v.paid_amount), 0);

  return (
    <div className="space-y-6">
      {modal && <VendorModal vendor={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">ניהול ספקים</h2>
        <Btn onClick={() => setModal('new')}>+ הוסף ספק</Btn>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="סה״כ חוזים" value={fmt(totalContract)} color="indigo" />
        <KpiCard title="שולם לספקים" value={fmt(totalPaid)} color="green" />
        <KpiCard title="יתרה לספקים" value={fmt(totalContract - totalPaid)} color="amber" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="w-full md:w-64 relative">
          <input
            type="text"
            placeholder="חיפוש ספק או קטגוריה..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {['הכל', ...VENDOR_STATUSES].map(s => <FilterPill key={s} active={statusFilter === s} color="indigo" onClick={() => setStatusFilter(s)}>{s}</FilterPill>)}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 border-dashed border-2 bg-transparent"><p className="text-lg font-medium">אין ספקים</p><p className="text-sm mt-1">נסה חיפוש אחר או הוסף ספק חדש</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(v => {
            const remaining = num(v.contract_amount) - num(v.paid_amount);
            const pct = v.contract_amount > 0 ? Math.min(100, num(v.paid_amount) / num(v.contract_amount) * 100) : 0;
            return (
              <Card key={v.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{v.name}</h3>
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${VENDOR_BADGE[v.status]}`}>{v.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{v.category}</p>
                    {(v.contact_name || v.phone) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 inline-block px-2 py-1 rounded">
                        <span>👤 {v.contact_name}</span>
                        {v.contact_name && v.phone && <span className="text-slate-300">|</span>}
                        {v.phone && <span dir="ltr">📞 {v.phone}</span>}
                      </p>
                    )}
                    {v.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">{v.notes}</p>}

                    {v.contract_amount > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-[11px] mb-1.5">
                          <span className="text-slate-500 dark:text-slate-400">שולם <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(num(v.paid_amount))}</span> מתוך {fmt(num(v.contract_amount))}</span>
                          <span className="text-amber-600 font-semibold">נותר: {fmt(remaining)}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <button onClick={() => setModal(v)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 rounded-md">✎</button>
                    <button onClick={() => { confirm('למחוק ספק זה?').then(yes => { if (yes) deleteVendor(v.id); }) }} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 rounded-md">✕</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Seating ────────────────────────────────────────────────────────────────
function TableModal({ table, onSave, onClose }) {
  const blank = { name: '', capacity: 10, shape: 'round' };
  const [form, setForm] = useState(table ? { name: table.name, capacity: table.capacity, shape: table.shape || 'round' } : blank);
  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  return (
    <Modal title={table ? 'ערוך שולחן' : 'הוסף שולחן'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <Field label="שם השולחן"><TextInput name="name" value={form.name} onChange={set} required placeholder="לדוגמה: שולחן 1 — משפחה" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="קיבולת (מספר מקומות)"><TextInput name="capacity" value={form.capacity} onChange={set} type="number" min="0" required /></Field>
          <Field label="צורת השולחן / סוג האלמנט">
            <SelectInput name="shape" value={form.shape} onChange={set} options={[
              { value: 'round', label: 'שולחן עגול' },
              { value: 'rect', label: 'שולחן מלבני' },
              { value: 'chuppah', label: 'חופה 🏕️' },
              { value: 'dancefloor', label: 'רחבת ריקודים 🪩' },
              { value: 'bar', label: 'בר משקאות 🍸' },
              { value: 'buffet', label: 'מזנון 🍽️' }
            ]} />
          </Field>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn type="submit">{table ? 'שמור שינויים' : 'הוסף שולחן'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function TableInspectorModal({ table, onClose, onEdit, onDelete, onUnassign, onScale, guestsList }) {
  const seated = table.guest_ids.map(id => guestsList.find(g => g.id === id)).filter(Boolean);
  const isMapEl = ['chuppah', 'dancefloor', 'bar', 'buffet'].includes(table.shape);
  const free = num(table.capacity) - seated.length;
  const scale = table.scale || 1;
  
  return (
    <Modal title={table.name} onClose={onClose}>
      <div className="space-y-6">
        {!isMapEl && (
          <div className="grid grid-cols-2 gap-4 mb-4">
             <KpiCard title="יושבים" value={seated.length} color="indigo" />
             <KpiCard title="פנוי" value={free} color={free < 0 ? 'red' : 'green'} />
          </div>
        )}
        
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">גודל במפה:</span>
          <div className="flex items-center gap-3">
            <Btn variant="secondary" size="sm" onClick={() => onScale(scale - 0.25)}>-</Btn>
            <span className="w-8 text-center text-sm font-mono text-slate-500">{scale}x</span>
            <Btn variant="secondary" size="sm" onClick={() => onScale(scale + 0.25)}>+</Btn>
          </div>
        </div>

        {!isMapEl && seated.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            <h4 className="font-semibold text-sm text-slate-500">רשימת אורחים ({seated.length}):</h4>
            {seated.map(g => (
              <div key={g.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-2 border border-slate-100 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{g.name}</span>
                <button onClick={() => onUnassign(g.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="הסר מהשולחן">✕</button>
              </div>
            ))}
          </div>
        )}
        {!isMapEl && seated.length === 0 && <div className="text-center text-sm text-slate-400 py-4">השולחן ריק</div>}

        <div className="flex gap-2 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <Btn variant="danger" onClick={onDelete}>מחק {isMapEl ? 'אלמנט' : 'שולחן'}</Btn>
          <Btn variant="secondary" onClick={onEdit}>ערוך פרטים</Btn>
        </div>
      </div>
    </Modal>
  );
}

function Seating() {
  const { guests, tables, addTable, updateTable, deleteTable, assignGuest, unassignGuest, confirm } = useApp();
  const [modal, setModal] = useState(null);
  const [inspector, setInspector] = useState(null);
  const handleSave = (data) => { 
    if (modal === 'new') {
      const scrollEl = document.getElementById('map-scroll-container');
      const innerEl = document.getElementById('map-inner-container');
      if (scrollEl && innerEl && viewMode === 'map') {
        const rect = scrollEl.getBoundingClientRect();
        const innerRect = innerEl.getBoundingClientRect();
        data.x = (rect.left + rect.width / 2 - innerRect.left) / zoom - 60;
        data.y = (rect.top + rect.height / 2 - innerRect.top) / zoom - 60;
      }
      addTable(data);
    } else {
      updateTable(modal.id, data);
    }
    setModal(null);
  };

  const assignedIds = new Set(tables.flatMap(t => t.guest_ids));
  const unassigned = guests.filter(g => g.rsvp_status === 'מגיע' && !assignedIds.has(g.id));
  const totalSeats = tables.reduce((s, t) => s + num(t.capacity), 0);

  const [viewMode, setViewMode] = useState('map');
  const [zoom, setZoom] = useState(1);
  const [listWaitlistOpen, setListWaitlistOpen] = useState(false);
  const inspectorTable = tables.find(t => t.id === inspector);

  const hasCenteredMap = useRef(false);
  useEffect(() => {
    if (viewMode === 'map' && !hasCenteredMap.current) {
      const scrollEl = document.getElementById('map-scroll-container');
      if (scrollEl) {
        hasCenteredMap.current = true;
        setTimeout(() => {
           scrollEl.scrollLeft = -9999;
           scrollEl.scrollTop = 0;
        }, 50);
      }
    }
  }, [viewMode]);

  return (
    <div className="space-y-6">
      {modal && <TableModal table={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      {inspectorTable && (
        <TableInspectorModal 
          table={inspectorTable}
          guestsList={guests}
          onClose={() => setInspector(null)}
          onEdit={() => { setModal(inspectorTable); setInspector(null); }}
          onDelete={() => { confirm(`למחוק את ${inspectorTable.name}?`).then(y => { if(y){ deleteTable(inspectorTable.id); setInspector(null); } }) }}
          onUnassign={id => unassignGuest(id)}
          onScale={s => updateTable(inspectorTable.id, { scale: Math.max(0.5, Math.min(3, s)) })}
        />
      )}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700/50">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">סידורי ישיבה</h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>רשימה</button>
            <button onClick={() => setViewMode('map')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>מפה חכמה</button>
          </div>
          <Btn onClick={() => setModal('new')}>+ הוסף שולחן</Btn>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="שולחנות" value={tables.length} color="indigo" />
        <KpiCard title="מושבים בסה״כ" value={totalSeats} color="blue" />
        <KpiCard title="ממתינים לשיבוץ" value={unassigned.length} color={unassigned.length > 0 ? 'amber' : 'green'} sub="מגיעים ללא שולחן" />
      </div>

      {unassigned.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between cursor-pointer group mb-3" onClick={() => setListWaitlistOpen(!listWaitlistOpen)}>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">ממתינים לשיבוץ ({unassigned.length})</p>
            <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">{listWaitlistOpen ? '▼' : '▶'}</span>
          </div>
          {listWaitlistOpen && (
          <div className="flex flex-wrap gap-2">
            {unassigned.map(g => (
              <div key={g.id} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-amber-800 dark:text-amber-300 font-medium">{g.name}</span>
                {tables.length > 0 && (
                  <select onChange={e => { if (e.target.value) assignGuest(g.id, e.target.value); e.target.value = ''; }} defaultValue=""
                    className="text-xs border-0 bg-transparent text-amber-600 dark:text-amber-400 focus:outline-none cursor-pointer">
                    <option value="" disabled>שבץ ▾</option>
                    {tables.filter(t => !['chuppah', 'dancefloor', 'bar', 'buffet'].includes(t.shape)).map(t => {
                      const free = num(t.capacity) - t.guest_ids.length;
                      return <option key={t.id} value={t.id}>{t.name} ({free} מקום)</option>;
                    })}
                  </select>
                )}
              </div>
            ))}
          </div>
          )}
        </Card>
      )}

      {viewMode === 'map' && (
        <div className="flex flex-col xl:flex-row gap-4 h-[600px]">
          {/* Sidebar */}
          <div className="w-full xl:w-64 flex-shrink-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 h-full overflow-y-auto">
            <h3 className="font-bold mb-4 text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span>ממתינים לשיבוץ</span>
              <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full text-xs">{unassigned.length}</span>
            </h3>
            <div className="space-y-2">
              {unassigned.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-10">כולם שובצו בהצלחה! 🎉</div>
              ) : (
                unassigned.map(g => (
                  <div key={g.id}
                       draggable
                       onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('guestId', g.id); }}
                       className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:scale-[1.02]">
                    <div className="font-semibold text-sm text-indigo-900 dark:text-indigo-100">{g.name}</div>
                    <div className="text-xs text-indigo-600/70 dark:text-indigo-400/70">{g.group} • {g.side}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Map Canvas */}
          <div className="relative flex-grow h-full bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner">
            <div className="absolute top-4 left-4 text-xs font-semibold text-slate-500 bg-white/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm pointer-events-none z-20">
              💡 גרור אנשים לשולחנות, או לחיצה אחת על שולחן לעריכה
            </div>
            
            <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-md backdrop-blur-sm flex items-center p-1 border border-slate-200 dark:border-slate-700 z-20">
              <button onClick={() => setZoom(p => Math.max(0.5, p - 0.1))} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full font-bold text-lg">-</button>
              <span className="w-12 text-center text-xs font-bold text-slate-700 dark:text-slate-300">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(p => Math.min(2, p + 0.1))} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full font-bold text-lg">+</button>
            </div>

            <div id="map-scroll-container" className="w-full h-full overflow-auto custom-scrollbar relative"
                 onDragOver={e => e.preventDefault()} 
                 onDrop={e => {
                   e.preventDefault();
                   const guestId = e.dataTransfer.getData('guestId');
                   if (guestId) { unassignGuest(guestId); return; }
                   
                   const tableId = e.dataTransfer.getData('tableId');
                   if (tableId) {
                     const innerEl = document.getElementById('map-inner-container');
                     if (innerEl) {
                       const innerRect = innerEl.getBoundingClientRect();
                       const x = (e.clientX - innerRect.left) / zoom - 40;
                       const y = (e.clientY - innerRect.top) / zoom - 40;
                       const boundedX = Math.max(0, Math.min(3000 - 100, x));
                       const boundedY = Math.max(0, Math.min(3000 - 100, y));
                       updateTable(tableId, { x: boundedX, y: boundedY });
                     }
                   }
                 }}>
              
              <div style={{ width: 3000 * zoom, height: 3000 * zoom }} className="relative">
                <div id="map-inner-container" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: '3000px', height: '3000px' }} 
                     className="absolute top-0 left-0 bg-[length:20px_20px] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] transition-transform duration-200">
                {tables.map((t, index) => {
              const seatedCount = t.guest_ids.length;
              const isFull = seatedCount >= num(t.capacity);
              const cols = 4;
              const defX = 40 + (index % cols) * 120;
              const defY = 40 + Math.floor(index / cols) * 120;
              const px = t.x ?? defX;
              const py = t.y ?? defY;
              const isRect = t.shape === 'rect';
              const isMapEl = ['chuppah', 'dancefloor', 'bar', 'buffet'].includes(t.shape);
              
              if (isMapEl) {
                 const icons = { chuppah: '🏕️', dancefloor: '🪩', bar: '🍸', buffet: '🍽️' };
                 return (
                   <div key={t.id}
                        draggable
                        onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('tableId', t.id); }}
                        onClick={() => setInspector(t.id)}
                        style={{ left: px, top: py, position: 'absolute', transform: `scale(${t.scale || 1})`, transformOrigin: 'center' }}
                        className="w-32 h-32 rounded-2xl flex flex-col items-center justify-center cursor-move shadow-lg transition-shadow hover:shadow-xl border-2 border-slate-300 dark:border-slate-600 bg-gradient-to-br from-white to-slate-100 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-200 z-0">
                     <span className="text-4xl mb-2 pointer-events-none drop-shadow-sm">{icons[t.shape]}</span>
                     <span className="text-xs font-bold text-center leading-tight truncate w-[90%] pointer-events-none">{t.name}</span>
                   </div>
                 );
              }
              
              return (
                <div key={t.id}
                     draggable
                     onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('tableId', t.id); }}
                     onDragOver={e => e.preventDefault()}
                     onDrop={e => {
                        e.preventDefault();
                        e.stopPropagation(); 
                        const guestId = e.dataTransfer.getData('guestId');
                        if (guestId) assignGuest(guestId, t.id);
                        const tableId = e.dataTransfer.getData('tableId');
                        if (tableId) {
                           const innerEl = document.getElementById('map-inner-container');
                           if (innerEl) {
                             const innerRect = innerEl.getBoundingClientRect();
                             const x = (e.clientX - innerRect.left) / zoom - 40; 
                             const y = (e.clientY - innerRect.top) / zoom - 40;
                             const boundedX = Math.max(0, Math.min(3000 - 100, x));
                             const boundedY = Math.max(0, Math.min(3000 - 100, y));
                             updateTable(tableId, { x: boundedX, y: boundedY });
                           }
                        }
                     }}
                     onClick={() => setInspector(t.id)}
                     style={{ left: px, top: py, position: 'absolute', transform: `scale(${t.scale || 1})`, transformOrigin: 'center' }}
                     className={`${isRect ? 'w-28 h-16 rounded-xl' : 'w-24 h-24 rounded-full'} flex flex-col items-center justify-center cursor-move shadow-md transition-shadow hover:shadow-lg border-4 z-10 ${isFull ? 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-100' : 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100'}`}>
                  <span className="text-xs font-bold text-center leading-tight truncate w-[90%] pointer-events-none">{t.name}</span>
                  <span className="text-[10px] font-medium opacity-80 mt-1 pointer-events-none">{seatedCount}/{t.capacity}</span>
                </div>
              );
            })}
                </div>
              </div>
            {tables.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium z-0 pointer-events-none">הוסף שולחן או רחבה כדי להתחיל</div>}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        tables.length === 0 ? (
          <Card className="p-12 text-center text-gray-300"><p className="text-lg font-medium">אין שולחנות עדיין</p><p className="text-sm mt-1">לחץ &quot;+ הוסף שולחן&quot; כדי להתחיל</p></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tables.map(t => {
            const seated = t.guest_ids.map(id => guests.find(g => g.id === id)).filter(Boolean);
            const free = num(t.capacity) - seated.length;
            const isFull = free <= 0;
            return (
              <Card key={t.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{t.name}</h3>
                    <p className={`text-[11px] mt-0.5 ${isFull ? 'text-red-500' : 'text-gray-400'}`}>
                      {seated.length}/{t.capacity} {isFull ? '— מלא' : `(${free} פנויים)`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Btn variant="ghost" size="sm" onClick={() => setModal(t)}>ערוך</Btn>
                    <Btn variant="danger" size="sm" onClick={() => { confirm('למחוק שולחן זה?').then(yes => { if (yes) deleteTable(t.id); }) }}>✕</Btn>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-3">
                  <div className={`h-1.5 rounded-full ${isFull ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, seated.length / num(t.capacity) * 100)}%` }}></div>
                </div>
                <div className="space-y-1.5">
                  {seated.map(g => (
                    <div key={g.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-1.5">
                      <span className="text-xs text-gray-700 dark:text-gray-300">{g.name}</span>
                      <button onClick={() => unassignGuest(g.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                    </div>
                  ))}
                  {seated.length === 0 && <p className="text-xs text-gray-300 text-center py-2">אין אורחים משובצים</p>}
                </div>
              </Card>
            );
          })}
          </div>
        )
      )}
    </div>
  );
}

// ── Ideas ────────────────────────────────────────────────────────────────
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

function IdeaModal({ idea, onSave, onClose }) {
  const { addToast } = useApp();
  const [imgData, setImgData] = useState(idea?.image || null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file);
      setImgData(compressed);
    } catch (err) {
      addToast('שגיאה בהעלאת התמונה', 'error');
    }
    setIsCompressing(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const text = fd.get('text').trim();
    if (!text && !imgData) return addToast('נא להזין טקסט או להעלות תמונה', 'error');
    onSave({ text, link: fd.get('link').trim(), image: imgData });
  };
  return (
    <Modal title={idea ? 'ערוך רעיון' : 'רעיון חדש'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">הרעיון שלך</label>
          <textarea name="text" defaultValue={idea?.text} rows={4} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="למשל: צלם מגנטים עם מסגרת עץ, שיר כניסה לחופה..."></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">קישור (אופציונלי)</label>
          <input type="text" name="link" defaultValue={idea?.link} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="pinterest.com/..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">תמונה (אופציונלי)</label>
          <div className="flex flex-col gap-2">
            <input type="file" accept="image/*" onChange={handleImage} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/50 dark:file:text-indigo-300" />
            {isCompressing && <span className="text-xs text-slate-500 animate-pulse">מעבד תמונה...</span>}
            {imgData && (
              <div className="relative inline-block mt-2 self-start">
                <img src={imgData} alt="Preview" className="h-32 w-auto object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                <button type="button" onClick={() => setImgData(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center shadow hover:bg-red-600 transition-colors">✕</button>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn type="submit" disabled={isCompressing}>{idea ? 'שמור' : 'הוסף'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function Ideas() {
  const { ideas, addIdea, updateIdea, deleteIdea, confirm } = useApp();
  const [modal, setModal] = useState(null);

  const handleSave = (data) => {
    if (modal === 'new') addIdea(data);
    else updateIdea(modal.id, data);
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (await confirm('למחוק את הרעיון הזה?')) deleteIdea(id);
  };

  return (
    <div className="space-y-6">
      {modal && <IdeaModal idea={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">רעיונות והשראה 💡</h2>
        <Btn onClick={() => setModal('new')}>+ הוסף רעיון</Btn>
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {ideas.length === 0 && (
           <div className="col-span-full py-12 text-center text-slate-400 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 break-inside-avoid">
             אין רעיונות עדיין. הוסיפו משהו שאהבתם!
           </div>
        )}
        {ideas.map(idea => (
          <div key={idea.id} className="break-inside-avoid bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 p-4 md:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative group">
             <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
               <button onClick={() => setModal(idea)} className="p-1.5 bg-white/80 dark:bg-slate-800/80 rounded-lg text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 backdrop-blur shadow-sm">
                 <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
               </button>
               <button onClick={() => handleDelete(idea.id)} className="p-1.5 bg-white/80 dark:bg-slate-800/80 rounded-lg text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 backdrop-blur shadow-sm">
                 <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
               </button>
             </div>
             <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-sm leading-relaxed mt-4 sm:mt-0">{idea.text}</p>
             {idea.image && (
               <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                 <img src={idea.image} alt="השראה" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500" />
               </div>
             )}
             {idea.link && (
               <a href={idea.link.match(/^https?:\/\//) ? idea.link : `https://${idea.link}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                 <span>🔗</span> פתח קישור
               </a>
             )}
             <div className="mt-4 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
               {idea.created_at ? `נוצר ב-${new Date(idea.created_at).toLocaleDateString('he-IL')}` : ''}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Timeline ───────────────────────────────────────────────────────────────
function TimelineModal({ event, onSave, onClose }) {
  const blank = { time: '10:00', title: '', description: '', assignee: '' };
  const [form, setForm] = useState(event ? { ...event } : blank);
  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  return (
    <Modal title={event ? 'ערוך אירוע בלו״ז' : 'הוסף אירוע ללו״ז'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="שעה (לדוגמה 10:00)"><TextInput name="time" type="time" value={form.time} onChange={set} required /></Field>
          <Field label="כותרת (לדוגמה: איפור ושיער)"><TextInput name="title" value={form.title} onChange={set} required /></Field>
          <div className="col-span-2"><Field label="תיאור (אופציונלי, למשל: בחדר במלון)"><TextInput name="description" value={form.description} onChange={set} /></Field></div>
          <div className="col-span-2"><Field label="אחראי (אופציונלי, למשל: חתן, מלווה)"><TextInput name="assignee" value={form.assignee} onChange={set} /></Field></div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn type="submit">{event ? 'שמור שינויים' : 'הוסף אירוע'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function Timeline() {
  const { timeline, addTimelineEvent, updateTimelineEvent, deleteTimelineEvent, confirm } = useApp();
  const [modal, setModal] = useState(null);

  const sortedTimeline = [...timeline].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700/50">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          לוח זמנים ליום האירוע ⏱️
        </h2>
        <Btn onClick={() => setModal({})}>+ אירוע ללו״ז</Btn>
      </div>

      <div className="relative border-r-2 border-indigo-200 dark:border-indigo-900/50 mr-4 pr-6 space-y-6">
        {sortedTimeline.length === 0 && (
          <div className="text-slate-400 py-10 text-center text-sm bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            הלו״ז שלך עדיין ריק.<br />לחץ על &quot;+ אירוע ללו״ז&quot; כדי להתחיל.
          </div>
        )}
        {sortedTimeline.map((ev, i) => (
          <div key={ev.id} className="relative group">
            <div className="absolute -right-[33px] top-1.5 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white dark:border-slate-900 shadow-sm"></div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">{ev.time}</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{ev.title}</h3>
                  </div>
                  {ev.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{ev.description}</p>}
                  {ev.assignee && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2">
                      👤 {ev.assignee}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal(ev)} className="text-slate-400 hover:text-indigo-600 transition-colors p-1" title="ערוך">✎</button>
                  <button onClick={() => confirm('למחוק אירוע זה?').then(y => y && deleteTimelineEvent(ev.id))} className="text-slate-400 hover:text-rose-600 transition-colors p-1" title="מחק">✕</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <TimelineModal 
          event={modal.id ? modal : null} 
          onSave={data => { modal.id ? updateTimelineEvent(modal.id, data) : addTimelineEvent(data); setModal(null); }} 
          onClose={() => setModal(null)} 
        />
      )}
    </div>
  );
}

// ── App shell ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'לוח בקרה', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg> },
  { id: 'expenses', label: 'הוצאות', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg> },
  { id: 'guests', label: 'אורחים', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
  { id: 'checklist', label: 'מטלות', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg> },
  { id: 'vendors', label: 'ספקים', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg> },
  { id: 'seating', label: 'ישיבה', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M5 5l1.5 1.5" /><path d="M17.5 17.5L19 19" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M5 19l1.5-1.5" /><path d="M17.5 6.5L19 5" /></svg> },
  { id: 'timeline', label: 'לו״ז', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { id: 'ideas', label: 'רעיונות', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21h6" /><path d="M12 17v4" /><path d="M12 2a5.5 5.5 0 0 0-4.7 8.3 4 4 0 0 1 1.7 3.7V17h6v-3a4 4 0 0 1 1.7-3.7A5.5 5.5 0 0 0 12 2Z" /></svg> },
];

function HeaderButtons() {
  const { saveStatus, privacyMode, togglePrivacyMode } = useApp();
  const { dark, toggle } = useDark();
  const pill = saveStatus === 'saving'
    ? { text: 'שומר…', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
    : saveStatus === 'error'
      ? { text: 'שמירה נכשלה', cls: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300' }
      : null;
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {pill && <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-full ${pill.cls}`}>{pill.text}</span>}
      <button onClick={togglePrivacyMode} title={privacyMode ? 'הצג סכומים' : 'הסתר סכומים'}
        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-medium leading-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        {privacyMode ? '👀' : '🙈'}
      </button>
      <button onClick={toggle} title={dark ? 'מצב בהיר' : 'מצב כהה'}
        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-medium leading-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        {dark ? 'מצב בהיר' : 'מצב כהה'}
      </button>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState('dashboard');
  return (
    <DarkProvider>
      <AppProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors pb-20 md:pb-0 font-sans">
          <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-indigo-600 bg-clip-text text-transparent">Wedding Planner</h1>
                <p className="text-xs text-slate-400 mt-0.5">תכנון החתונה של דניאל ותמר האהובים</p>
              </div>
              <HeaderButtons />
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:block max-w-6xl mx-auto px-4">
              <nav className="flex overflow-x-auto no-scrollbar">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2.5 px-5 py-4 text-[13px] font-semibold border-b-2 transition-all whitespace-nowrap ${tab === t.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300'
                      }`}>
                    <span className="opacity-90">{t.icon}</span><span>{t.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 py-8">
            {tab === 'dashboard' && <Dashboard />}
            {tab === 'expenses' && <Expenses />}
            {tab === 'guests' && <Guests />}
            {tab === 'checklist' && <Checklist />}
            {tab === 'vendors' && <Vendors />}
            {tab === 'seating' && <Seating />}
            {tab === 'timeline' && <Timeline />}
            {tab === 'ideas' && <Ideas />}
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 z-40 px-2 py-2 flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.03)] pb-safe">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${tab === t.id
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}>
                <span className={`mb-1 transition-transform duration-300 ${tab === t.id ? 'scale-110 drop-shadow-sm' : ''}`}>{t.icon}</span>
                <span className={`text-[10px] transition-all duration-300 ${tab === t.id ? 'font-bold' : 'font-medium'}`}>{t.label}</span>
              </button>
            ))}
          </nav>

          <ToastContainer />
          <ConfirmModal />
        </div>
      </AppProvider>
    </DarkProvider>
  );
}

export default App;
