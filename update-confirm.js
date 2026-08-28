const fs = require('fs');

let code = fs.readFileSync('src/app/ClientPage.jsx', 'utf8');

// 1. AppCtx logic
code = code.replace(
  `const [toasts,   setToasts]     = useState([]);`,
  `const [toasts,   setToasts]     = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  
  const confirmDialog = (msg) => new Promise(resolve => setConfirmState({ msg, resolve }));
  const handleConfirm = (res) => { if (confirmState) { confirmState.resolve(res); setConfirmState(null); } };`
);

// 2. Export confirm and handleConfirm
code = code.replace(
  `toasts, addToast,`,
  `toasts, addToast, confirm: confirmDialog, confirmState, handleConfirm,`
);

// 3. Add ConfirmModal UI right after ToastContainer
code = code.replace(
  `// ── SVG Charts ─────────────────────────────────────────────────────────────`,
  `// ── Confirm Modal ──────────────────────────────────────────────────────────
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

// ── SVG Charts ─────────────────────────────────────────────────────────────`
);

// 4. Mount ConfirmModal in App
code = code.replace(
  `<ToastContainer />`,
  `<ToastContainer />\n          <ConfirmModal />`
);

// 5. Replace useApp() destructuring
code = code.replace(
  /const \{ expenses, addExpense, updateExpense, deleteExpense, metrics \} = useApp\(\);/g, 
  `const { expenses, addExpense, updateExpense, deleteExpense, metrics, confirm } = useApp();`
);
code = code.replace(
  /const \{ guests, addGuest, updateGuest, deleteGuest, metrics, addToast \} = useApp\(\);/g, 
  `const { guests, addGuest, updateGuest, deleteGuest, metrics, addToast, confirm } = useApp();`
);
code = code.replace(
  /const \{ tasks, addTask, toggleTask, updateTask, deleteTask \} = useApp\(\);/g, 
  `const { tasks, addTask, toggleTask, updateTask, deleteTask, confirm } = useApp();`
);
code = code.replace(
  /const \{ vendors, addVendor, updateVendor, deleteVendor \} = useApp\(\);/g, 
  `const { vendors, addVendor, updateVendor, deleteVendor, confirm } = useApp();`
);
code = code.replace(
  /const \{ guests, tables, addTable, updateTable, deleteTable, assignGuest, unassignGuest \} = useApp\(\);/g, 
  `const { guests, tables, addTable, updateTable, deleteTable, assignGuest, unassignGuest, confirm } = useApp();`
);

// 6. Replace window.confirm calls
code = code.replace(
  /if\s*\(\s*window\.confirm\('([^']+)'\)\s*\)\s*([a-zA-Z0-9_]+\([^)]+\));/g, 
  `confirm('$1').then(yes => { if(yes) $2; })`
);

fs.writeFileSync('src/app/ClientPage.jsx', code);
console.log('Update complete!');
