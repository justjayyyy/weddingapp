const fs = require('fs');
let code = fs.readFileSync('src/app/ClientPage.jsx', 'utf8');

// 1. GuestModal blank state
code = code.replace(
  `const blank = { name: '', group: 'כללי', side: 'כלה', rsvp_status: 'ממתין', estimated_gift: GROUP_GIFT_DEFAULTS['כללי'], actual_gift: 0 };`,
  `const blank = { name: '', group: 'כללי', side: 'כלה', rsvp_status: 'ממתין', estimated_gift: GROUP_GIFT_DEFAULTS['כללי'], actual_gift: 0, arrival_probability: 100 };`
);

// 2. RSVP Field label in GuestModal
code = code.replace(
  `<Field label="סטטוס RSVP">`,
  `<Field label="סטטוס">`
);

// 3. Add arrival_probability slider in GuestModal (insert after actual_gift field)
code = code.replace(
  `<div className="col-span-2"><Field label="מתנה שהתקבלה בפועל (₪)"><TextInput name="actual_gift" value={form.actual_gift} onChange={set} type="number" min="0" placeholder="0" /></Field></div>`,
  `<div className="col-span-2"><Field label="מתנה שהתקבלה בפועל (₪)"><TextInput name="actual_gift" value={form.actual_gift} onChange={set} type="number" min="0" placeholder="0" /></Field></div>
          <div className="col-span-2">
            <Field label={\`סבירות הגעה: \${form.arrival_probability ?? 100}%\`}>
              <input type="range" name="arrival_probability" min="0" max="100" step="10" value={form.arrival_probability ?? 100} onChange={set} className="w-full accent-indigo-600 cursor-pointer" />
            </Field>
          </div>`
);

// 4. Update exportExcel headers
code = code.replace(
  `'סטטוס הגעה': g.rsvp_status,`,
  `'סטטוס': g.rsvp_status,\n        'סבירות הגעה (%)': g.arrival_probability ?? 100,`
);

// 5. Update mobile card badges
code = code.replace(
  `<span className={\`text-[10px] font-semibold px-2 py-0.5 rounded-full \${RSVP_BADGE[g.rsvp_status]}\`}>{g.rsvp_status}</span>`,
  `<div className="flex gap-1 items-center">
                  <span className={\`text-[10px] font-semibold px-2 py-0.5 rounded-full \${RSVP_BADGE[g.rsvp_status]}\`}>{g.rsvp_status}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{g.arrival_probability ?? 100}%</span>
                </div>`
);

// 6. Update Desktop Table Header
code = code.replace(
  `<th className="text-center px-4 py-3 font-semibold">RSVP</th>`,
  `<th className="text-center px-4 py-3 font-semibold">סטטוס</th>
                <th className="text-center px-4 py-3 font-semibold">הגעה</th>`
);

// 7. Update Desktop Table Row
code = code.replace(
  `<td className="px-4 py-3 text-center">
                    <span className={\`text-[11px] font-semibold px-2.5 py-0.5 rounded-full \${RSVP_BADGE[g.rsvp_status]}\`}>{g.rsvp_status}</span>
                  </td>`,
  `<td className="px-4 py-3 text-center">
                    <span className={\`text-[11px] font-semibold px-2.5 py-0.5 rounded-full \${RSVP_BADGE[g.rsvp_status]}\`}>{g.rsvp_status}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {g.arrival_probability ?? 100}%
                  </td>`
);

// 8. Add colspan fix for empty state
code = code.replace(
  `<td colSpan={7} className="px-4 py-10`,
  `<td colSpan={8} className="px-4 py-10`
);

fs.writeFileSync('src/app/ClientPage.jsx', code);
console.log('Update complete!');
