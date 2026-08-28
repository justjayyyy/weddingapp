"use client";
import { createContext, useContext, useState, useEffect, useMemo, useRef  } from "react";

// ── Constants ──────────────────────────────────────────────────────────────
const GROUP_GIFT_DEFAULTS = {
  'כללי':            350,
  'משפחה':           500,
  'משפחה גרעינית':   500,
  'חברים':           350,
  'חברים קרובים':    500,
  'עבודה':           350,
  'חברים של ההורים': 350,
};
const EXPENSE_CATEGORIES = ['אולם וקייטרינג','ספקים מרכזיים','לבוש ויופי','טבעות ותוספות'];
const GUEST_GROUPS       = Object.keys(GROUP_GIFT_DEFAULTS);
const GUEST_SIDES        = ['כלה','חתן','הורים'];
const RSVP_STATUSES      = ['ממתין','מגיע','לא מגיע'];
const VENDOR_STATUSES    = ['ליצור קשר','בתהליך','חתום','שולם במלואו'];
const VENDOR_CATEGORIES  = [...EXPENSE_CATEGORIES,'אחר'];
const CHECKLIST_CATS     = ['הכנות','ספקים','לבוש','חגיגה','הזמנות','אחר'];

const CAT_COLORS = {
  'אולם וקייטרינג':'#6366f1','ספקים מרכזיים':'#8b5cf6','לבוש ויופי':'#ec4899','טבעות ותוספות':'#f59e0b',
};
const RSVP_BADGE = {
  'מגיע':'bg-green-100 text-green-700','לא מגיע':'bg-red-100 text-red-700','ממתין':'bg-amber-100 text-amber-700',
};
const VENDOR_BADGE = {
  'ליצור קשר':'bg-gray-100 text-gray-600','בתהליך':'bg-blue-100 text-blue-700',
  'חתום':'bg-indigo-100 text-indigo-700','שולם במלואו':'bg-green-100 text-green-700',
};

// ── Helpers ────────────────────────────────────────────────────────────────
const uid  = () => Math.random().toString(36).slice(2, 10);
const num  = (v) => Number(v) || 0;
const fmt  = (n) => '₪' + num(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };

// ── Seed data ──────────────────────────────────────────────────────────────
const SEED_EXPENSES = [
  { id: uid(), name: 'אולם חתונה',          category: 'אולם וקייטרינג', total_cost: 45000, deposit_paid: 10000 },
  { id: uid(), name: 'קייטרינג',            category: 'אולם וקייטרינג', total_cost: 32000, deposit_paid:  5000 },
  { id: uid(), name: 'עוגת חתונה',          category: 'אולם וקייטרינג', total_cost:  3500, deposit_paid:  1000 },
  { id: uid(), name: 'DJ',                  category: 'ספקים מרכזיים',  total_cost:  8000, deposit_paid:  2000 },
  { id: uid(), name: 'צילום ווידאו',         category: 'ספקים מרכזיים',  total_cost: 15000, deposit_paid:  5000 },
  { id: uid(), name: 'מסדר טקסים',          category: 'ספקים מרכזיים',  total_cost:  4500, deposit_paid:  1500 },
  { id: uid(), name: 'תאורה ואפקטים',       category: 'ספקים מרכזיים',  total_cost:  6000, deposit_paid:  2000 },
  { id: uid(), name: 'שמלת כלה',            category: 'לבוש ויופי',     total_cost:  8000, deposit_paid:  3000 },
  { id: uid(), name: 'חליפת חתן',           category: 'לבוש ויופי',     total_cost:  3500, deposit_paid:  1500 },
  { id: uid(), name: 'שיער ואיפור',         category: 'לבוש ויופי',     total_cost:  2800, deposit_paid:   800 },
  { id: uid(), name: 'פרחים ועיצוב',        category: 'טבעות ותוספות',  total_cost:  6000, deposit_paid:  2000 },
  { id: uid(), name: 'טבעות נישואין',       category: 'טבעות ותוספות',  total_cost:  9000, deposit_paid:  9000 },
  { id: uid(), name: 'הזמנות ומתנות לאורחים', category: 'טבעות ותוספות', total_cost: 2500, deposit_paid:  2500 },
];
const SEED_GUESTS = [
  { id: uid(), name: 'דוד ומרים כהן',       group: 'משפחה גרעינית', side: 'כלה',   rsvp_status: 'מגיע',    estimated_gift: 500, actual_gift: 500 },
  { id: uid(), name: 'יוסף ורחל לוי',       group: 'משפחה גרעינית', side: 'חתן',   rsvp_status: 'מגיע',    estimated_gift: 500, actual_gift: 600 },
  { id: uid(), name: 'שמעון ולאה כהן',      group: 'משפחה גרעינית', side: 'כלה',   rsvp_status: 'מגיע',    estimated_gift: 500, actual_gift: 0   },
  { id: uid(), name: 'אברהם ושרה לוי',      group: 'משפחה גרעינית', side: 'חתן',   rsvp_status: 'מגיע',    estimated_gift: 500, actual_gift: 0   },
  { id: uid(), name: 'נועה שפירו',          group: 'חברים קרובים',  side: 'כלה',   rsvp_status: 'מגיע',    estimated_gift: 500, actual_gift: 500 },
  { id: uid(), name: 'ליאור ודנה אברהם',    group: 'חברים קרובים',  side: 'כלה',   rsvp_status: 'מגיע',    estimated_gift: 500, actual_gift: 0   },
  { id: uid(), name: 'אבי כץ',              group: 'חברים קרובים',  side: 'חתן',   rsvp_status: 'מגיע',    estimated_gift: 500, actual_gift: 0   },
  { id: uid(), name: 'רון ויעל בן-שלום',    group: 'חברים קרובים',  side: 'חתן',   rsvp_status: 'מגיע',    estimated_gift: 500, actual_gift: 0   },
  { id: uid(), name: 'מיה מזרחי',           group: 'כללי',          side: 'כלה',   rsvp_status: 'מגיע',    estimated_gift: 350, actual_gift: 0   },
  { id: uid(), name: 'גלי וניר סגל',        group: 'כללי',          side: 'כלה',   rsvp_status: 'מגיע',    estimated_gift: 350, actual_gift: 0   },
  { id: uid(), name: 'טל בן-דוד',           group: 'כללי',          side: 'חתן',   rsvp_status: 'ממתין',   estimated_gift: 350, actual_gift: 0   },
  { id: uid(), name: 'עומר ורחל פרץ',       group: 'כללי',          side: 'חתן',   rsvp_status: 'ממתין',   estimated_gift: 350, actual_gift: 0   },
  { id: uid(), name: 'כרמית אלון',          group: 'חברים של ההורים', side: 'הורים', rsvp_status: 'ממתין', estimated_gift: 350, actual_gift: 0   },
  { id: uid(), name: 'תמר גולדשטיין',       group: 'כללי',          side: 'הורים', rsvp_status: 'ממתין',   estimated_gift: 250, actual_gift: 0   },
  { id: uid(), name: 'אורי פרידמן',         group: 'כללי',          side: 'כלה',   rsvp_status: 'ממתין',   estimated_gift: 250, actual_gift: 0   },
  { id: uid(), name: 'שיר וגל נחמני',       group: 'כללי',          side: 'חתן',   rsvp_status: 'ממתין',   estimated_gift: 250, actual_gift: 0   },
  { id: uid(), name: 'איתי רוזנברג',        group: 'כללי',          side: 'חתן',   rsvp_status: 'לא מגיע', estimated_gift: 250, actual_gift: 0   },
  { id: uid(), name: 'מורן ביטון',          group: 'כללי',          side: 'כלה',   rsvp_status: 'לא מגיע', estimated_gift: 250, actual_gift: 0   },
];
const SEED_TASKS = [
  { id: uid(), text: 'לקבוע תאריך ואולם',              category: 'הכנות',   done: true,  due_date: '2025-12-01' },
  { id: uid(), text: 'לשלוח save the date',            category: 'הזמנות', done: true,  due_date: '2026-01-15' },
  { id: uid(), text: 'לחתום על חוזה קייטרינג',         category: 'ספקים',  done: true,  due_date: '2026-02-01' },
  { id: uid(), text: 'לשלוח הזמנות רשמיות',            category: 'הזמנות', done: false, due_date: '2026-04-01' },
  { id: uid(), text: 'לאשר תפריט קייטרינג',            category: 'ספקים',  done: false, due_date: '2026-05-01' },
  { id: uid(), text: 'ניסיון שיער ואיפור',              category: 'לבוש',   done: false, due_date: '2026-05-15' },
  { id: uid(), text: 'לקנות טבעות',                    category: 'חגיגה',  done: false, due_date: '2026-06-01' },
  { id: uid(), text: 'להכין רשימת שירים ל-DJ',          category: 'חגיגה',  done: false, due_date: '2026-06-15' },
  { id: uid(), text: 'לאשר פרחים ועיצוב סופי',         category: 'ספקים',  done: false, due_date: '2026-06-15' },
  { id: uid(), text: 'לסדר לינה לאורחים מרוחקים',      category: 'הכנות',  done: false, due_date: '2026-06-20' },
  { id: uid(), text: 'להכין סידורי ישיבה',              category: 'הכנות',  done: false, due_date: '2026-07-01' },
  { id: uid(), text: 'לאשר מספר אורחים סופי לאולם',   category: 'ספקים',  done: false, due_date: '2026-07-10' },
  { id: uid(), text: 'להכין תמונות לשולחן ה׳בריפינג׳', category: 'חגיגה',  done: false, due_date: '2026-07-15' },
];
const SEED_VENDORS = [
  { id: uid(), name: 'גן העדן — אולם אירועים',  category: 'אולם וקייטרינג', contact_name: 'יוסי כהן',    phone: '052-1234567', contract_amount: 45000, paid_amount: 10000, status: 'חתום',         notes: 'כולל שולחנות, כיסאות ומפות' },
  { id: uid(), name: 'קייטרינג מלכה',            category: 'אולם וקייטרינג', contact_name: 'מלכה אביב',   phone: '03-9876543',  contract_amount: 32000, paid_amount:  5000, status: 'חתום',         notes: 'תפריט מגוון, כולל אפשרות טבעונית' },
  { id: uid(), name: 'DJ מושיקו',                category: 'ספקים מרכזיים',  contact_name: 'משה לוי',     phone: '054-7654321', contract_amount:  8000, paid_amount:  2000, status: 'חתום',         notes: 'ציוד סאונד מקצועי' },
  { id: uid(), name: 'סטודיו שמחות',             category: 'ספקים מרכזיים',  contact_name: 'דנה מזרחי',  phone: '050-1111222', contract_amount: 15000, paid_amount:  5000, status: 'חתום',         notes: 'צילום + וידאו, אלבום דיגיטלי כלול' },
  { id: uid(), name: 'רב מאיר כהן',              category: 'ספקים מרכזיים',  contact_name: 'הרב מאיר',    phone: '052-3331111', contract_amount:  4500, paid_amount:  1500, status: 'חתום',         notes: 'כולל הכנת כתובה' },
  { id: uid(), name: 'תאורה פנטסטיק',            category: 'ספקים מרכזיים',  contact_name: 'אלון גרין',   phone: '054-2224444', contract_amount:  6000, paid_amount:  2000, status: 'בתהליך',       notes: '' },
  { id: uid(), name: 'בוטיק כלה "נסיכה"',        category: 'לבוש ויופי',     contact_name: 'רונית שרון',  phone: '03-5556789',  contract_amount:  8000, paid_amount:  3000, status: 'בתהליך',       notes: 'ניסיון שני בתאריך 15/05' },
  { id: uid(), name: 'שיער ואיפור — נטלי',        category: 'לבוש ויופי',     contact_name: 'נטלי בר',     phone: '050-9998877', contract_amount:  2800, paid_amount:   800, status: 'חתום',         notes: 'כולל ניסיון + יום החתונה' },
  { id: uid(), name: 'פרחי אביב',                category: 'טבעות ותוספות',  contact_name: 'אביב פרחים',  phone: '09-1234321',  contract_amount:  6000, paid_amount:  2000, status: 'בתהליך',       notes: 'סגנון בוהו-שיק' },
  { id: uid(), name: 'תכשיטי זהב — ירושלמי',    category: 'טבעות ותוספות',  contact_name: 'שלמה ירושלמי', phone: '02-6667777', contract_amount:  9000, paid_amount:  9000, status: 'שולם במלואו',  notes: 'טבעות מוכנות, לאסוף שבוע לפני' },
];
const SEED_TABLES = [
  { id: uid(), name: 'שולחן 1 — משפחה כלה',   capacity: 10, guest_ids: [] },
  { id: uid(), name: 'שולחן 2 — משפחה חתן',   capacity: 10, guest_ids: [] },
  { id: uid(), name: 'שולחן 3 — חברים כלה',   capacity:  8, guest_ids: [] },
  { id: uid(), name: 'שולחן 4 — חברים חתן',   capacity:  8, guest_ids: [] },
  { id: uid(), name: 'שולחן 5 — עמיתים',       capacity:  8, guest_ids: [] },
  { id: uid(), name: 'שולחן 6 — שכנים',        capacity:  6, guest_ids: [] },
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
  const [dark, setDark] = useState(() => load('wfgm_dark', false));
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
  const [ready, setReady]         = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [expenses, setExpenses]   = useState([]);
  const [guests,   setGuests]     = useState([]);
  const [tasks,    setTasks]      = useState([]);
  const [vendors,  setVendors]    = useState([]);
  const [tables,   setTables]     = useState([]);
  const hydrated = useRef(false);
  const saveGen  = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchWeddingData();
        if (cancelled) return;
        if (p.expenses) setExpenses(p.expenses);
        if (p.guests)   setGuests(p.guests);
        if (p.tasks)    setTasks(p.tasks);
        if (p.vendors)  setVendors(p.vendors);
        if (p.tables)   setTables(p.tables);
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
        await persistWeddingData({ expenses, guests, tasks, vendors, tables });
        if (gen !== saveGen.current) return;
        setSaveStatus('saved');
      } catch {
        if (gen !== saveGen.current) return;
        setSaveStatus('error');
      }
    }, 400);
    return () => clearTimeout(t);
  }, [expenses, guests, tasks, vendors, tables, ready, loadError]);

  const addExpense    = (d) => setExpenses(p => [...p, { ...d, id: uid(), total_cost: num(d.total_cost), deposit_paid: num(d.deposit_paid) }]);
  const updateExpense = (id, d) => setExpenses(p => p.map(e => e.id === id ? { ...e, ...d, total_cost: num(d.total_cost), deposit_paid: num(d.deposit_paid) } : e));
  const deleteExpense = (id) => setExpenses(p => p.filter(e => e.id !== id));

  const addGuest    = (d) => setGuests(p => [...p, { ...d, id: uid(), estimated_gift: num(d.estimated_gift), actual_gift: num(d.actual_gift) }]);
  const updateGuest = (id, d) => setGuests(p => p.map(g => g.id === id ? { ...g, ...d, estimated_gift: num(d.estimated_gift), actual_gift: num(d.actual_gift) } : g));
  const deleteGuest = (id) => setGuests(p => p.filter(g => g.id !== id));

  const addTask    = (d) => setTasks(p => [...p, { ...d, id: uid(), done: false }]);
  const toggleTask = (id) => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const updateTask = (id, d) => setTasks(p => p.map(t => t.id === id ? { ...t, ...d } : t));
  const deleteTask = (id) => setTasks(p => p.filter(t => t.id !== id));

  const addVendor    = (d) => setVendors(p => [...p, { ...d, id: uid(), contract_amount: num(d.contract_amount), paid_amount: num(d.paid_amount) }]);
  const updateVendor = (id, d) => setVendors(p => p.map(v => v.id === id ? { ...v, ...d, contract_amount: num(d.contract_amount), paid_amount: num(d.paid_amount) } : v));
  const deleteVendor = (id) => setVendors(p => p.filter(v => v.id !== id));

  const addTable      = (d) => setTables(p => [...p, { ...d, id: uid(), capacity: num(d.capacity), guest_ids: [] }]);
  const updateTable   = (id, d) => setTables(p => p.map(t => t.id === id ? { ...t, ...d, capacity: num(d.capacity) } : t));
  const deleteTable   = (id) => setTables(p => p.filter(t => t.id !== id));
  const assignGuest   = (guestId, tableId) => setTables(p => p.map(t => ({
    ...t, guest_ids: t.id === tableId
      ? (t.guest_ids.includes(guestId) ? t.guest_ids : [...t.guest_ids, guestId])
      : t.guest_ids.filter(id => id !== guestId),
  })));
  const unassignGuest = (guestId) => setTables(p => p.map(t => ({ ...t, guest_ids: t.guest_ids.filter(id => id !== guestId) })));

  const metrics = useMemo(() => {
    const totalExpenses           = expenses.reduce((s, e) => s + num(e.total_cost), 0);
    const totalOutOfPocket        = expenses.reduce((s, e) => s + num(e.deposit_paid), 0);
    const totalBalanceDue         = totalExpenses - totalOutOfPocket;
    const contingencyBuffer       = totalExpenses * 0.1;
    const totalExpensesWithBuffer = totalExpenses + contingencyBuffer;

    const attending = guests.filter(g => g.rsvp_status === 'מגיע');
    const pending   = guests.filter(g => g.rsvp_status === 'ממתין');
    const rsvpYesCount        = attending.length;
    const pendingCount        = pending.length;
    const safeVenueCommitment = Math.floor(rsvpYesCount * 0.9);
    const totalExpectedGifts  = [...attending, ...pending].reduce((s, g) => s + num(g.estimated_gift), 0);
    const totalActualGifts    = guests.reduce((s, g) => s + num(g.actual_gift), 0);

    const bepPerGuest   = safeVenueCommitment > 0 ? totalExpensesWithBuffer / safeVenueCommitment : 0;
    const netProfitLoss = totalExpectedGifts - totalExpensesWithBuffer;

    const expensesByCategory = EXPENSE_CATEGORIES
      .map(cat => ({ name: cat, value: expenses.filter(e => e.category === cat).reduce((s, e) => s + num(e.total_cost), 0) }))
      .filter(c => c.value > 0);

    const tasksDone  = tasks.filter(t => t.done).length;
    const tasksTotal = tasks.length;

    return {
      totalExpenses, totalOutOfPocket, totalBalanceDue,
      contingencyBuffer, totalExpensesWithBuffer,
      rsvpYesCount, pendingCount, totalInvited: guests.length,
      safeVenueCommitment, totalExpectedGifts, totalActualGifts,
      bepPerGuest, netProfitLoss, expensesByCategory,
      tasksDone, tasksTotal,
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
    expenses, guests, tasks, vendors, tables, metrics,
    addExpense, updateExpense, deleteExpense,
    addGuest, updateGuest, deleteGuest,
    addTask, toggleTask, updateTask, deleteTask,
    addVendor, updateVendor, deleteVendor,
    addTable, updateTable, deleteTable, assignGuest, unassignGuest,
    saveStatus,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

const useApp = () => useContext(AppCtx);

// ── SVG Charts ─────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="flex items-center justify-center h-44 text-gray-300 text-sm">אין נתוני הוצאות עדיין</div>;
  const SIZE = 180, R = 76, IR = 38, CX = SIZE/2, CY = SIZE/2;
  const slices = []; let angle = -Math.PI/2;
  data.forEach((item) => {
    const sweep = (item.value/total)*2*Math.PI, s = angle, e = angle+sweep; angle = e;
    const la = sweep > Math.PI ? 1 : 0, cos = Math.cos, sin = Math.sin;
    const d = [`M ${CX+R*cos(s)} ${CY+R*sin(s)}`,`A ${R} ${R} 0 ${la} 1 ${CX+R*cos(e)} ${CY+R*sin(e)}`,`L ${CX+IR*cos(e)} ${CY+IR*sin(e)}`,`A ${IR} ${IR} 0 ${la} 0 ${CX+IR*cos(s)} ${CY+IR*sin(s)}`,'Z'].join(' ');
    const mid = s+sweep/2, lr = (R+IR)/2;
    slices.push({ ...item, d, lx: CX+lr*cos(mid), ly: CY+lr*sin(mid), pct: (item.value/total*100).toFixed(0) });
  });
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg width={SIZE} height={SIZE} className="flex-shrink-0">
        {slices.map(s => (
          <g key={s.name}>
            <path d={s.d} fill={CAT_COLORS[s.name]||'#6366f1'} stroke="white" strokeWidth="2"><title>{s.name}: {fmt(s.value)}</title></path>
            {parseFloat(s.pct) >= 8 && <text x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="700" fill="white">{s.pct}%</text>}
          </g>
        ))}
      </svg>
      <div className="space-y-2.5 w-full min-w-0">
        {slices.map(s => (
          <div key={s.name} className="flex items-center gap-2 text-xs min-w-0">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: CAT_COLORS[s.name]||'#6366f1' }}></span>
            <span className="text-gray-600 dark:text-gray-300 truncate flex-1">{s.name}</span>
            <span className="font-bold text-gray-800 dark:text-gray-100 flex-shrink-0">{fmt(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ items }) {
  const maxVal = Math.max(...items.map(d => d.amount), 1);
  const W = 320, H = 200, pad = {t:32,r:16,b:52,l:58}, cW = W-pad.l-pad.r, cH = H-pad.t-pad.b, slot = cW/items.length, bW = slot*0.48, TICKS = 4;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
      {Array.from({length:TICKS+1},(_,i) => {
        const v = maxVal*i/TICKS, y = pad.t+cH-(v/maxVal)*cH;
        return <g key={i}><line x1={pad.l} y1={y} x2={pad.l+cW} y2={y} stroke="#f1f5f9" strokeWidth="1"/><text x={pad.l-5} y={y} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#94a3b8">₪{(v/1000).toFixed(0)}k</text></g>;
      })}
      {items.map((item,i) => {
        const bH = (item.amount/maxVal)*cH, x = pad.l+i*slot+slot/2-bW/2, y = pad.t+cH-bH;
        return (
          <g key={item.name}>
            <rect x={x} y={y} width={bW} height={bH} fill={item.fill} rx="4"><title>{item.name}: {fmt(item.amount)}</title></rect>
            <text x={x+bW/2} y={y-6} textAnchor="middle" fontSize="9" fontWeight="700" fill="#374151">{fmt(item.amount)}</text>
            <text x={x+bW/2} y={pad.t+cH+14} textAnchor="middle" fontSize="10" fill="#6b7280">
              {item.name.split(' ').map((w,wi) => <tspan key={wi} x={x+bW/2} dy={wi===0?0:12}>{w}</tspan>)}
            </text>
          </g>
        );
      })}
      <line x1={pad.l} y1={pad.t+cH} x2={pad.l+cW} y2={pad.t+cH} stroke="#e2e8f0" strokeWidth="1"/>
    </svg>
  );
}

// ── Shared UI atoms ────────────────────────────────────────────────────────
function Card({ children, className = '' }) {
  return <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>{children}</div>;
}
function KpiCard({ title, value, sub, color }) {
  const p = {
    indigo:'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    purple:'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    green: 'border-green-200  bg-green-50  text-green-700  dark:border-green-800  dark:bg-green-900/40  dark:text-green-300',
    amber: 'border-amber-200  bg-amber-50  text-amber-700  dark:border-amber-800  dark:bg-amber-900/40  dark:text-amber-300',
    blue:  'border-blue-200   bg-blue-50   text-blue-700   dark:border-blue-800   dark:bg-blue-900/40   dark:text-blue-300',
    red:   'border-red-200    bg-red-50    text-red-700    dark:border-red-800    dark:bg-red-900/40    dark:text-red-300',
  };
  return (
    <div className={`rounded-2xl border-2 p-5 ${p[color]||p.indigo}`}>
      <p className="text-[11px] font-semibold uppercase tracking-widest opacity-60">{title}</p>
      <p className="text-2xl font-bold mt-1 leading-tight">{value}</p>
      {sub && <p className="text-[11px] mt-1.5 opacity-70 leading-snug">{sub}</p>}
    </div>
  );
}
function Btn({ children, onClick, variant='primary', size='md', type='button', disabled=false }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none disabled:opacity-40';
  const sz = { sm:'px-2.5 py-1 text-xs', md:'px-4 py-2 text-sm' };
  const v = {
    primary:  'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    secondary:'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600',
    ghost:    'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
    danger:   'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30',
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
function TextInput({ name, value, onChange, type='text', placeholder, required, min }) {
  return (
    <input name={name} value={value} onChange={onChange} type={type} placeholder={placeholder} required={required} min={min}
      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
  );
}
function SelectInput({ name, value, onChange, options }) {
  return (
    <select name={name} value={value} onChange={onChange}
      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
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
function FilterPill({ active, color='indigo', onClick, children }) {
  const on  = color === 'indigo' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-purple-600 text-white border-purple-600';
  const off = 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700';
  return <button onClick={onClick} className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${active ? on : off}`}>{children}</button>;
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function Dashboard() {
  const { metrics } = useApp();
  const { totalExpensesWithBuffer, contingencyBuffer, totalOutOfPocket, totalBalanceDue,
    totalExpectedGifts, rsvpYesCount, pendingCount, safeVenueCommitment,
    totalInvited, bepPerGuest, netProfitLoss, expensesByCategory, tasksDone, tasksTotal } = metrics;

  const barItems = [
    { name: 'סה״כ הוצאות', amount: totalExpensesWithBuffer, fill: '#6366f1' },
    { name: 'מתנות צפויות', amount: totalExpectedGifts,      fill: '#10b981' },
  ];
  const isProfit = netProfitLoss >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">לוח בקרה ראשי</h2>
        <span className="text-[11px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-semibold px-3 py-1 rounded-full">חי</span>
      </div>

      {tasksTotal > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">התקדמות מטלות</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{tasksDone}/{tasksTotal}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${tasksTotal ? tasksDone/tasksTotal*100 : 0}%` }}></div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard title="סה״כ הוצאות צפויות" value={fmt(totalExpensesWithBuffer)} sub={`כולל 10% כרית ביטחון: ${fmt(contingencyBuffer)}`} color="indigo" />
        <KpiCard title="שולם מראש (מקדמות)"  value={fmt(totalOutOfPocket)}        sub="שולם לפני יום החתונה"                            color="purple" />
        <KpiCard title="יתרה לתשלום"          value={fmt(totalBalanceDue)}         sub="מכוסה על ידי מתנות"                             color="amber" />
        <KpiCard title="סה״כ מתנות צפויות"   value={fmt(totalExpectedGifts)}      sub={`${rsvpYesCount} מגיעים + ${pendingCount} ממתינים`} color="green" />
        <KpiCard title="נקודת איזון לאורח"   value={fmt(Math.round(bepPerGuest))} sub={`מבוסס על ${safeVenueCommitment} מגיעים (× 90%)`} color="blue" />
        <div className={`rounded-2xl border-2 p-5 ${isProfit ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/40' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/40'}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-widest opacity-60 ${isProfit ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>תחזית רווח / הפסד</p>
          <p className={`text-2xl font-bold mt-1 ${isProfit ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{isProfit ? '+' : ''}{fmt(netProfitLoss)}</p>
          <p className={`text-[11px] mt-1.5 leading-snug ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isProfit ? '✓ צפוי שתכסו את כל העלויות!' : `⚠️ צפוי מחסור של ${fmt(Math.abs(netProfitLoss))}.`}
          </p>
        </div>
      </div>

      <Card className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">סקירת אורחים</p>
        <div className="flex flex-wrap gap-8">
          {[
            { label: 'סה״כ מוזמנים',         val: totalInvited,         cls: 'text-gray-800 dark:text-gray-100' },
            { label: 'אישרו הגעה',            val: rsvpYesCount,         cls: 'text-green-600' },
            { label: 'ממתינים',               val: pendingCount,         cls: 'text-amber-600' },
            { label: 'התחייבות בטוחה לאולם', val: safeVenueCommitment,  cls: 'text-indigo-700 dark:text-indigo-400' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="text-center min-w-[64px]">
              <div className={`text-3xl font-bold ${cls}`}>{val}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 max-w-[96px]">{label}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-4 border-t border-dashed border-gray-200 dark:border-gray-600 pt-3">
          💡 התחייבות בטוחה = אישרו × 90% — מניח 10% אי-הגעה
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">פירוט הוצאות לפי קטגוריה</p>
          <DonutChart data={expensesByCategory} />
        </Card>
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">הוצאות מול מתנות צפויות</p>
          <BarChart items={barItems} />
        </Card>
      </div>
    </div>
  );
}

// ── Expenses ───────────────────────────────────────────────────────────────
function ExpenseModal({ expense, onSave, onClose }) {
  const blank = { name: '', category: 'אולם וקייטרינג', total_cost: '', deposit_paid: '' };
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
  const { expenses, addExpense, updateExpense, deleteExpense, metrics } = useApp();
  const [modal, setModal] = useState(null);
  const handleSave = (data) => { if (modal === 'new') addExpense(data); else updateExpense(modal.id, data); setModal(null); };
  return (
    <div className="space-y-6">
      {modal && <ExpenseModal expense={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">מעקב הוצאות</h2>
        <Btn onClick={() => setModal('new')}>+ הוסף הוצאה</Btn>
      </div>
      <div className="flex flex-wrap gap-4 text-[11px] text-gray-500 dark:text-gray-400">
        {[['#6366f1','עלות כוללת'],['#f97316','מקדמה ששולמה'],['#3b82f6','יתרה לתשלום']].map(([c,l]) => (
          <span key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: c }}></span>{l}</span>
        ))}
      </div>
      {expenses.length === 0 ? (
        <Card className="p-12 text-center text-gray-300"><p className="text-lg font-medium">אין הוצאות עדיין</p><p className="text-sm mt-1">לחץ על "+ הוסף הוצאה" כדי להתחיל</p></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 text-[11px] uppercase tracking-widest text-gray-400">
                  <th className="text-right px-4 py-3 font-semibold">הוצאה</th>
                  <th className="text-right px-4 py-3 font-semibold">קטגוריה</th>
                  <th className="text-right px-4 py-3 font-semibold">עלות כוללת</th>
                  <th className="text-right px-4 py-3 font-semibold">מקדמה ששולמה</th>
                  <th className="text-right px-4 py-3 font-semibold">יתרה לתשלום</th>
                  <th className="text-center px-4 py-3 font-semibold w-28">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{exp.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: (CAT_COLORS[exp.category]||'#6366f1')+'20', color: CAT_COLORS[exp.category]||'#6366f1' }}>{exp.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{fmt(exp.total_cost)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-500">{fmt(exp.deposit_paid)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600">{fmt(num(exp.total_cost)-num(exp.deposit_paid))}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Btn variant="ghost" size="sm" onClick={() => setModal(exp)}>ערוך</Btn>
                        <Btn variant="danger" size="sm" onClick={() => { if(window.confirm('למחוק הוצאה זו?')) deleteExpense(exp.id); }}>✕</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-4 py-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300"><span>סכום ביניים</span><span className="font-semibold text-gray-900 dark:text-gray-100">{fmt(metrics.totalExpenses)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-orange-600 font-medium">כרית ביטחון (10%)</span><span className="font-semibold text-orange-600">+ {fmt(metrics.contingencyBuffer)}</span></div>
            <div className="flex justify-between text-base font-bold border-t border-gray-300 dark:border-gray-600 pt-2">
              <span className="text-gray-900 dark:text-gray-100">סה״כ כולל כרית ביטחון</span>
              <span className="text-indigo-700 dark:text-indigo-400">{fmt(metrics.totalExpensesWithBuffer)}</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 border-t border-dashed border-gray-300 dark:border-gray-600">
              <span className="text-xs text-orange-500"><strong>מקדמות:</strong> {fmt(metrics.totalOutOfPocket)} <span className="text-gray-400">(מכיס לפני החתונה)</span></span>
              <span className="text-xs text-blue-500 mr-auto"><strong>יתרה:</strong> {fmt(metrics.totalBalanceDue)} <span className="text-gray-400">(מכוסה ע״י מתנות)</span></span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Guests ─────────────────────────────────────────────────────────────────
function GuestModal({ guest, onSave, onClose }) {
  const blank = { name: '', group: 'כללי', side: 'כלה', rsvp_status: 'ממתין', estimated_gift: GROUP_GIFT_DEFAULTS['כללי'], actual_gift: 0 };
  const [form, setForm] = useState(guest ? { ...guest } : blank);
  const set = e => {
    const { name, value } = e.target;
    if (name === 'group') setForm(p => ({ ...p, group: value, estimated_gift: GROUP_GIFT_DEFAULTS[value] || 350 }));
    else setForm(p => ({ ...p, [name]: value }));
  };
  return (
    <Modal title={guest ? 'ערוך אורח' : 'הוסף אורח'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Field label="שם האורח"><TextInput name="name" value={form.name} onChange={set} required placeholder="שם מלא או זוג" /></Field></div>
          <Field label="קבוצה"><SelectInput name="group" value={form.group} onChange={set} options={GUEST_GROUPS.includes(form.group) ? GUEST_GROUPS : [form.group, ...GUEST_GROUPS]} /></Field>
          <Field label="צד"><SelectInput name="side" value={form.side} onChange={set} options={GUEST_SIDES} /></Field>
          <Field label="סטטוס RSVP"><SelectInput name="rsvp_status" value={form.rsvp_status} onChange={set} options={RSVP_STATUSES} /></Field>
          <Field label="מתנה מוערכת (₪)" hint="— אוטומטי לפי קבוצה"><TextInput name="estimated_gift" value={form.estimated_gift} onChange={set} type="number" min="0" /></Field>
          <div className="col-span-2"><Field label="מתנה שהתקבלה בפועל (₪)"><TextInput name="actual_gift" value={form.actual_gift} onChange={set} type="number" min="0" placeholder="0" /></Field></div>
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
  const { guests, addGuest, updateGuest, deleteGuest, metrics } = useApp();
  const [modal, setModal]           = useState(null);
  const [rsvpFilter, setRsvpFilter] = useState('הכל');
  const [sideFilter, setSideFilter] = useState('הכל');
  const [groupFilter, setGroupFilter] = useState('הכל');
  const handleSave = (data) => { if (modal === 'new') addGuest(data); else updateGuest(modal.id, data); setModal(null); };
  const filtered = guests.filter(g =>
    (rsvpFilter === 'הכל' || g.rsvp_status === rsvpFilter) &&
    (sideFilter === 'הכל' || g.side === sideFilter) &&
    (groupFilter === 'הכל' || g.group === groupFilter)
  );
  const totalActual = guests.reduce((s, g) => s + num(g.actual_gift), 0);
  return (
    <div className="space-y-6">
      {modal && <GuestModal guest={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">אורחים ואומדן מתנות</h2>
        <Btn onClick={() => setModal('new')}>+ הוסף אורח</Btn>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'סה״כ מוזמנים',       val:metrics.totalInvited,        cls:'text-gray-800 dark:text-gray-100' },
          { label:'אישרו הגעה',          val:metrics.rsvpYesCount,        cls:'text-green-600' },
          { label:'ממתינים',             val:metrics.pendingCount,        cls:'text-amber-600' },
          { label:'התחייבות ×0.9',       val:metrics.safeVenueCommitment, cls:'text-indigo-700 dark:text-indigo-400' },
        ].map(({ label, val, cls }) => (
          <Card key={label} className="p-4 text-center">
            <div className={`text-2xl font-bold ${cls}`}>{val}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{label}</div>
          </Card>
        ))}
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
        <strong>אומדן מתנות שמרני:</strong> משפחה / משפחה גרעינית / חברים קרובים = ₪500 · כללי / חברים / עבודה / חברים של ההורים = ₪350
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-1">
          {['הכל', ...RSVP_STATUSES].map(s => <FilterPill key={s} active={rsvpFilter === s} color="indigo" onClick={() => setRsvpFilter(s)}>{s}</FilterPill>)}
        </div>
        <div className="hidden sm:block w-px bg-gray-200 dark:bg-gray-600 self-stretch"></div>
        <div className="flex flex-wrap gap-1">
          {['הכל', ...GUEST_SIDES].map(s => <FilterPill key={s} active={sideFilter === s} color="purple" onClick={() => setSideFilter(s)}>{s}</FilterPill>)}
        </div>
        <div className="hidden sm:block w-px bg-gray-200 dark:bg-gray-600 self-stretch"></div>
        <div className="flex flex-wrap gap-1">
          {['הכל', ...GUEST_GROUPS].map(s => <FilterPill key={s} active={groupFilter === s} color="indigo" onClick={() => setGroupFilter(s)}>{s}</FilterPill>)}
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 text-[11px] uppercase tracking-widest text-gray-400">
                <th className="text-right px-4 py-3 font-semibold">שם</th>
                <th className="text-right px-4 py-3 font-semibold">קבוצה</th>
                <th className="text-right px-4 py-3 font-semibold">צד</th>
                <th className="text-center px-4 py-3 font-semibold">RSVP</th>
                <th className="text-right px-4 py-3 font-semibold">מתנה מוערכת</th>
                <th className="text-right px-4 py-3 font-semibold">מתנה בפועל</th>
                <th className="text-center px-4 py-3 font-semibold w-28">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{g.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{g.group}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{g.side}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${RSVP_BADGE[g.rsvp_status]}`}>{g.rsvp_status}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">{fmt(g.estimated_gift)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    {num(g.actual_gift) > 0 ? fmt(g.actual_gift) : <span className="text-gray-300 font-normal">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Btn variant="ghost" size="sm" onClick={() => setModal(g)}>ערוך</Btn>
                      <Btn variant="danger" size="sm" onClick={() => { if(window.confirm('להסיר אורח זה?')) deleteGuest(g.id); }}>✕</Btn>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-300 text-sm">אין אורחים התואמים את הסינון הנוכחי</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-4 py-4 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
            <span>סה״כ מתנות צפויות (מגיעים + ממתינים)</span>
            <span className="font-bold text-indigo-700 dark:text-indigo-400">{fmt(metrics.totalExpectedGifts)}</span>
          </div>
          {totalActual > 0 && (
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>סה״כ מתנות שהתקבלו בפועל</span>
              <span className="font-bold text-green-700 dark:text-green-400">{fmt(totalActual)}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Checklist ──────────────────────────────────────────────────────────────
function TaskModal({ task, onSave, onClose }) {
  const blank = { text: '', category: 'הכנות', due_date: '' };
  const [form, setForm] = useState(task ? { ...task } : blank);
  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  return (
    <Modal title={task ? 'ערוך משימה' : 'הוסף משימה'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <Field label="תיאור המשימה"><TextInput name="text" value={form.text} onChange={set} required placeholder="לדוגמה: לשלוח הזמנות" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="קטגוריה"><SelectInput name="category" value={form.category} onChange={set} options={CHECKLIST_CATS} /></Field>
          <Field label="תאריך יעד"><TextInput name="due_date" value={form.due_date} onChange={set} type="date" /></Field>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn type="submit">{task ? 'שמור שינויים' : 'הוסף משימה'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function Checklist() {
  const { tasks, addTask, toggleTask, updateTask, deleteTask } = useApp();
  const [modal, setModal]         = useState(null);
  const [catFilter, setCatFilter] = useState('הכל');
  const handleSave = (data) => { if (modal === 'new') addTask(data); else updateTask(modal.id, data); setModal(null); };
  const filtered   = catFilter === 'הכל' ? tasks : tasks.filter(t => t.category === catFilter);
  const done = tasks.filter(t => t.done).length;
  return (
    <div className="space-y-6">
      {modal && <TaskModal task={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">רשימת מטלות</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{done} / {tasks.length} הושלמו</p>
        </div>
        <Btn onClick={() => setModal('new')}>+ הוסף משימה</Btn>
      </div>
      {tasks.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">התקדמות כללית</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{Math.round(done/tasks.length*100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${done/tasks.length*100}%` }}></div>
          </div>
        </Card>
      )}
      <div className="flex flex-wrap gap-1">
        {['הכל', ...CHECKLIST_CATS].map(c => <FilterPill key={c} active={catFilter === c} color="indigo" onClick={() => setCatFilter(c)}>{c}</FilterPill>)}
      </div>
      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-gray-300"><p className="text-lg font-medium">אין משימות</p><p className="text-sm mt-1">לחץ "+ הוסף משימה" כדי להתחיל</p></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <Card key={t.id} className={`p-4 flex items-center gap-3 transition-opacity ${t.done ? 'opacity-60' : ''}`}>
              <button onClick={() => toggleTask(t.id)}
                className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  t.done ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-500 hover:border-indigo-400'
                }`}>
                {t.done && <span className="text-white text-xs font-bold leading-none">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${t.done ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>{t.text}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{t.category}</span>
                  {t.due_date && <span className="text-[11px] text-gray-400">📅 {t.due_date}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Btn variant="ghost" size="sm" onClick={() => setModal(t)}>ערוך</Btn>
                <Btn variant="danger" size="sm" onClick={() => { if(window.confirm('למחוק משימה זו?')) deleteTask(t.id); }}>✕</Btn>
              </div>
            </Card>
          ))}
        </div>
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
  const { vendors, addVendor, updateVendor, deleteVendor } = useApp();
  const [modal, setModal]             = useState(null);
  const [statusFilter, setStatusFilter] = useState('הכל');
  const handleSave = (data) => { if (modal === 'new') addVendor(data); else updateVendor(modal.id, data); setModal(null); };
  const filtered      = statusFilter === 'הכל' ? vendors : vendors.filter(v => v.status === statusFilter);
  const totalContract = vendors.reduce((s, v) => s + num(v.contract_amount), 0);
  const totalPaid     = vendors.reduce((s, v) => s + num(v.paid_amount), 0);
  return (
    <div className="space-y-6">
      {modal && <VendorModal vendor={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ניהול ספקים</h2>
        <Btn onClick={() => setModal('new')}>+ הוסף ספק</Btn>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="סה״כ חוזים"    value={fmt(totalContract)}           color="indigo" />
        <KpiCard title="שולם לספקים"   value={fmt(totalPaid)}               color="green" />
        <KpiCard title="יתרה לספקים"   value={fmt(totalContract-totalPaid)} color="amber" />
      </div>
      <div className="flex flex-wrap gap-1">
        {['הכל', ...VENDOR_STATUSES].map(s => <FilterPill key={s} active={statusFilter === s} color="indigo" onClick={() => setStatusFilter(s)}>{s}</FilterPill>)}
      </div>
      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-gray-300"><p className="text-lg font-medium">אין ספקים</p><p className="text-sm mt-1">לחץ "+ הוסף ספק" כדי להתחיל</p></Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map(v => {
            const remaining = num(v.contract_amount) - num(v.paid_amount);
            const pct = v.contract_amount > 0 ? Math.min(100, num(v.paid_amount)/num(v.contract_amount)*100) : 0;
            return (
              <Card key={v.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">{v.name}</h3>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${VENDOR_BADGE[v.status]}`}>{v.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{v.category}</p>
                    {(v.contact_name || v.phone) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {v.contact_name}{v.contact_name && v.phone && ' · '}<span dir="ltr">{v.phone}</span>
                      </p>
                    )}
                    {v.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">{v.notes}</p>}
                    {v.contract_amount > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500 dark:text-gray-400">שולם {fmt(num(v.paid_amount))} מתוך {fmt(num(v.contract_amount))}</span>
                          <span className="text-amber-600 font-semibold">נותר: {fmt(remaining)}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Btn variant="ghost" size="sm" onClick={() => setModal(v)}>ערוך</Btn>
                    <Btn variant="danger" size="sm" onClick={() => { if(window.confirm('למחוק ספק זה?')) deleteVendor(v.id); }}>✕</Btn>
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
  const blank = { name: '', capacity: 10 };
  const [form, setForm] = useState(table ? { name: table.name, capacity: table.capacity } : blank);
  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  return (
    <Modal title={table ? 'ערוך שולחן' : 'הוסף שולחן'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <Field label="שם השולחן"><TextInput name="name" value={form.name} onChange={set} required placeholder="לדוגמה: שולחן 1 — משפחה" /></Field>
        <Field label="קיבולת (מספר מקומות)"><TextInput name="capacity" value={form.capacity} onChange={set} type="number" min="1" required /></Field>
        <div className="flex gap-2 justify-end pt-1">
          <Btn variant="secondary" onClick={onClose}>ביטול</Btn>
          <Btn type="submit">{table ? 'שמור שינויים' : 'הוסף שולחן'}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function Seating() {
  const { guests, tables, addTable, updateTable, deleteTable, assignGuest, unassignGuest } = useApp();
  const [modal, setModal] = useState(null);
  const handleSave = (data) => { if (modal === 'new') addTable(data); else updateTable(modal.id, data); setModal(null); };

  const assignedIds   = new Set(tables.flatMap(t => t.guest_ids));
  const unassigned    = guests.filter(g => g.rsvp_status === 'מגיע' && !assignedIds.has(g.id));
  const totalSeats    = tables.reduce((s, t) => s + num(t.capacity), 0);

  return (
    <div className="space-y-6">
      {modal && <TableModal table={modal === 'new' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">סידורי ישיבה</h2>
        <Btn onClick={() => setModal('new')}>+ הוסף שולחן</Btn>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="שולחנות"        value={tables.length}   color="indigo" />
        <KpiCard title="מושבים בסה״כ"  value={totalSeats}      color="blue" />
        <KpiCard title="ממתינים לשיבוץ" value={unassigned.length} color={unassigned.length > 0 ? 'amber' : 'green'} sub="מגיעים ללא שולחן" />
      </div>

      {unassigned.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">ממתינים לשיבוץ ({unassigned.length})</p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map(g => (
              <div key={g.id} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-amber-800 dark:text-amber-300 font-medium">{g.name}</span>
                {tables.length > 0 && (
                  <select onChange={e => { if (e.target.value) assignGuest(g.id, e.target.value); e.target.value = ''; }} defaultValue=""
                    className="text-xs border-0 bg-transparent text-amber-600 dark:text-amber-400 focus:outline-none cursor-pointer">
                    <option value="" disabled>שבץ ▾</option>
                    {tables.map(t => {
                      const free = num(t.capacity) - t.guest_ids.length;
                      return <option key={t.id} value={t.id} disabled={free <= 0}>{t.name} ({free} מקום)</option>;
                    })}
                  </select>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {tables.length === 0 ? (
        <Card className="p-12 text-center text-gray-300"><p className="text-lg font-medium">אין שולחנות עדיין</p><p className="text-sm mt-1">לחץ "+ הוסף שולחן" כדי להתחיל</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tables.map(t => {
            const seated  = t.guest_ids.map(id => guests.find(g => g.id === id)).filter(Boolean);
            const free    = num(t.capacity) - seated.length;
            const isFull  = free <= 0;
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
                    <Btn variant="danger" size="sm" onClick={() => { if(window.confirm('למחוק שולחן זה?')) deleteTable(t.id); }}>✕</Btn>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-3">
                  <div className={`h-1.5 rounded-full ${isFull ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, seated.length/num(t.capacity)*100)}%` }}></div>
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
      )}
    </div>
  );
}

// ── App shell ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'לוח בקרה', icon: '📊' },
  { id: 'expenses',  label: 'הוצאות',   icon: '💳' },
  { id: 'guests',    label: 'אורחים',   icon: '👥' },
  { id: 'checklist', label: 'מטלות',    icon: '✅' },
  { id: 'vendors',   label: 'ספקים',    icon: '🤝' },
  { id: 'seating',   label: 'ישיבה',    icon: '🪑' },
];

function HeaderButtons() {
  const { saveStatus } = useApp();
  const { dark, toggle } = useDark();
  const pill = saveStatus === 'saving'
    ? { text: 'שומר…', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
    : saveStatus === 'error'
    ? { text: 'שמירה נכשלה', cls: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300' }
    : { text: 'נשמר אוטומטית', cls: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' };
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-full ${pill.cls}`}>{pill.text}</span>
      <button onClick={toggle} title={dark ? 'מצב בהיר' : 'מצב כהה'}
        className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-base leading-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        {dark ? '☀️' : '🌙'}
      </button>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState('dashboard');
  return (
    <DarkProvider>
      <AppProvider>
        <div className="min-h-screen bg-slate-100 dark:bg-gray-900 transition-colors">
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">💍 מנהל כספים ואורחים לחתונה</h1>
                <p className="text-xs text-gray-400 mt-0.5">מודל חתונה ישראלי · נטען ונשמר אוטומטית ב-wedding-data.json</p>
              </div>
              <HeaderButtons />
            </div>
          </header>
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 shadow-sm">
            <div className="max-w-6xl mx-auto px-4">
              <nav className="flex overflow-x-auto">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                      tab === t.id
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                    }`}>
                    <span>{t.icon}</span><span>{t.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
          <main className="max-w-6xl mx-auto px-4 py-8">
            {tab === 'dashboard' && <Dashboard />}
            {tab === 'expenses'  && <Expenses />}
            {tab === 'guests'    && <Guests />}
            {tab === 'checklist' && <Checklist />}
            {tab === 'vendors'   && <Vendors />}
            {tab === 'seating'   && <Seating />}
          </main>
        </div>
      </AppProvider>
    </DarkProvider>
  );
}

export default App;
