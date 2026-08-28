const fs = require('fs');
let code = fs.readFileSync('src/app/ClientPage.jsx', 'utf8');

// 1. Update metrics calculation in AppCtx
code = code.replace(
  `    const safeVenueCommitment = Math.floor(rsvpYesCount * 0.9);
    const totalExpectedGifts  = [...attending, ...pending].reduce((s, g) => s + num(g.estimated_gift), 0);`,
  `    const expectedAttendees = guests.reduce((sum, g) => {
      if (g.rsvp_status === 'לא מגיע') return sum;
      return sum + ((g.arrival_probability ?? 100) / 100);
    }, 0);
    const safeVenueCommitment = Math.floor(expectedAttendees * 0.9);
    const totalExpectedGifts  = guests.reduce((sum, g) => {
      if (g.rsvp_status === 'לא מגיע') return sum;
      return sum + (num(g.estimated_gift) * ((g.arrival_probability ?? 100) / 100));
    }, 0);`
);

// 2. Export expectedAttendees from metrics
code = code.replace(
  `      safeVenueCommitment, totalExpectedGifts, totalActualGifts,`,
  `      expectedAttendees, safeVenueCommitment, totalExpectedGifts, totalActualGifts,`
);

// 3. Update Guests tab summary cards
code = code.replace(
  `{ label:'התחייבות ×0.9',       val:metrics.safeVenueCommitment, cls:'text-indigo-600 dark:text-indigo-400' },`,
  `{ label:'צפי הגעה משוקלל',      val:Math.round(metrics.expectedAttendees), cls:'text-blue-600 dark:text-blue-400' },
          { label:'התחייבות ×0.9',       val:metrics.safeVenueCommitment, cls:'text-indigo-600 dark:text-indigo-400' },`
);

// We need to change the grid to grid-cols-2 sm:grid-cols-5 in Guests tab
code = code.replace(
  `<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">`,
  `<div className="grid grid-cols-2 sm:grid-cols-5 gap-3">`
);

// 4. Update Dashboard metrics destructuring
code = code.replace(
  `    totalExpectedGifts, rsvpYesCount, pendingCount, safeVenueCommitment,`,
  `    totalExpectedGifts, rsvpYesCount, pendingCount, safeVenueCommitment, expectedAttendees,`
);

// 5. Update Dashboard Guest Overview grid
const oldGrid = `<div className="grid grid-cols-3 gap-2 text-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{rsvpYesCount}</p>
              <p className="text-[10px] text-slate-500 font-medium">אישרו</p>
            </div>
            <div className="border-x border-slate-200 dark:border-slate-700">
              <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
              <p className="text-[10px] text-slate-500 font-medium">ממתינים</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{safeVenueCommitment}</p>
              <p className="text-[10px] text-slate-500 font-medium whitespace-nowrap">התחייבות (90%)</p>
            </div>
          </div>`;

const newGrid = `<div className="grid grid-cols-4 gap-2 text-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 divide-x divide-x-reverse divide-slate-200 dark:divide-slate-700">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{rsvpYesCount}</p>
              <p className="text-[10px] text-slate-500 font-medium">אישרו</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
              <p className="text-[10px] text-slate-500 font-medium">ממתינים</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{Math.round(expectedAttendees)}</p>
              <p className="text-[10px] text-slate-500 font-medium">צפי הגעה</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{safeVenueCommitment}</p>
              <p className="text-[10px] text-slate-500 font-medium whitespace-nowrap">התחייבות (90%)</p>
            </div>
          </div>`;

code = code.replace(oldGrid, newGrid);

fs.writeFileSync('src/app/ClientPage.jsx', code);
console.log('Update complete!');
