// 纯函数：对 device payload（{ items, ledger, mileage, exportedAt }）做查询和汇总。
// 口径与网页保持一致：记录的使用期是 [start, end)，按天摊销只针对支出，
// 只有「个人 · 人民币」订阅计入个人收支（PROJECT_MEMORY.md 第 5 节）。

const DAY = 864e5;
const toDate = s => new Date(`${s}T00:00:00Z`);
const iso = d => d.toISOString().slice(0, 10);
const days = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY);
const round = (n, k = 2) => Math.round(n * 10 ** k) / 10 ** k;
export const today = () => {
    const now = new Date(Date.now() + 8 * 3600e3);   // 北京时间
    return iso(now);
};

const isLoan = item => item.type === 'rental' && item.kind === 'loan';
const records = item => (Array.isArray(item.records) ? item.records : []);

function findItem(items, name) {
    const exact = items.find(i => i.name === name);
    if (exact) return exact;
    const hits = items.filter(i => String(i.name).includes(name));
    if (hits.length === 1) return hits[0];
    if (hits.length > 1) throw new Error(`「${name}」匹配到多个项目：${hits.map(i => i.name).join('、')}`);
    throw new Error(`找不到项目「${name}」。可用 list_items 查看全部名称`);
}

function currentRecord(item, on) {
    return records(item).find(r => r.start && r.end && r.start <= on && on < r.end) || null;
}

export function status(doc) {
    const { payload } = doc;
    const items = payload.items || [];
    const byType = {};
    for (const i of items) byType[i.type] = (byType[i.type] || 0) + 1;
    const ledgerDays = Object.keys(payload.ledger || {}).sort();
    return {
        source: doc.source,
        updatedAt: doc.updatedAt,
        cloudError: doc.cloudError || undefined,
        items: items.length,
        itemsByType: byType,
        ledgerDays: ledgerDays.length,
        ledgerRange: ledgerDays.length ? [ledgerDays[0], ledgerDays[ledgerDays.length - 1]] : null,
        today: today(),
    };
}

export function listItems(payload, { type, activeOnly = false } = {}) {
    const on = today();
    return (payload.items || [])
        .filter(i => !type || i.type === type)
        .map(i => {
            const recs = records(i);
            const base = { name: i.name, type: i.type };
            if (i.kind) base.kind = i.kind;
            if (i.type === 'asset') {
                return { ...base, price: i.price, bought: i.date, status: i.status, endDate: i.endDate, residual: i.residual,
                         active: i.status !== 'sold' && !i.endDate };
            }
            if (i.type === 'checkin') {
                const keys = Object.keys(i.records || {}).sort();
                return { ...base, checkinType: i.checkinType, entries: keys.length, last: keys[keys.length - 1] || null, active: true };
            }
            const cur = currentRecord(i, on);
            const last = [...recs].sort((a, b) => (a.start < b.start ? 1 : -1))[0] || null;
            const out = { ...base, records: recs.length, totalPaid: round(recs.reduce((t, r) => t + (Number(r.price) || 0), 0)),
                          current: cur ? { start: cur.start, end: cur.end, price: cur.price, note: cur.note } : null,
                          lastRecord: last ? { start: last.start, end: last.end, price: last.price } : null, active: Boolean(cur) };
            if (i.type === 'sub') Object.assign(out, { payer: i.payer, currency: i.currency });
            return out;
        })
        .filter(i => !activeOnly || i.active);
}

export function getItem(payload, name) {
    return findItem(payload.items || [], name);
}

export function rentals(payload, { name = '租车', from, to } = {}) {
    const item = findItem(payload.items || [], name);
    if (item.type !== 'rental') throw new Error(`「${item.name}」不是租赁项目`);
    const seen = new Map();
    const dupes = [];
    for (const r of records(item)) {
        const k = `${r.start}|${r.end}|${r.price}`;
        if (seen.has(k)) { dupes.push({ start: r.start, end: r.end, price: r.price }); if (!seen.get(k).note && r.note) seen.set(k, r); continue; }
        seen.set(k, r);
    }
    const rows = [...seen.values()]
        .filter(r => (!from || r.end > from) && (!to || r.start < to))
        .sort((a, b) => (a.start < b.start ? -1 : 1))
        .map(r => {
            const d = Math.max(1, days(r.start, r.end));
            const row = { start: r.start, end: r.end, days: d, price: r.price, perDay: round(r.price / d) };
            if (r.mileage) Object.assign(row, { km: r.mileage, perKm: round(r.price / r.mileage) });
            if (r.paid) row.paid = r.paid;
            if (r.note) row.note = r.note;
            return row;
        });
    const total = rows.reduce((t, r) => t + r.price, 0), nd = rows.reduce((t, r) => t + r.days, 0);
    const withKm = rows.filter(r => r.km);
    const byYear = {};
    for (const r of rows) { const y = r.start.slice(0, 4); byYear[y] = round((byYear[y] || 0) + r.price); }
    return {
        item: item.name,
        summary: {
            orders: rows.length, days: nd, total: round(total), perDay: nd ? round(total / nd) : null,
            withMileage: withKm.length, km: round(withKm.reduce((t, r) => t + r.km, 0), 1),
            perKm: withKm.length ? round(withKm.reduce((t, r) => t + r.price, 0) / withKm.reduce((t, r) => t + r.km, 0)) : null,
            byYear,
        },
        duplicatesSkipped: dupes,
        records: rows,
    };
}

export function carLoan(payload) {
    const item = (payload.items || []).find(isLoan);
    if (!item) throw new Error('没有找到车贷项目（type=rental, kind=loan）');
    const on = today();
    const recs = [...records(item)].sort((a, b) => (a.start < b.start ? -1 : 1));
    const paid = recs.filter(r => (r.paid || r.start) <= on);
    const monthly = recs[0]?.price ?? item.loan.total / item.loan.periods;
    const next = recs.find(r => (r.paid || r.start) > on) || null;
    return {
        name: item.name,
        loan: item.loan,
        monthly,
        periodsPaid: paid.length,
        periodsLeft: recs.length - paid.length,
        paidAmount: round(paid.reduce((t, r) => t + r.price, 0)),
        remaining: round(recs.slice(paid.length).reduce((t, r) => t + r.price, 0)),
        nextPayment: next ? { date: next.paid || next.start, amount: next.price, note: next.note } : null,
        lastPayment: recs.length ? recs[recs.length - 1].paid || recs[recs.length - 1].start : null,
        asOf: on,
    };
}

export function ledgerRows(payload, { from, to, category } = {}) {
    const L = payload.ledger || {};
    const rows = [];
    for (const date of Object.keys(L).sort()) {
        if ((from && date < from) || (to && date > to)) continue;
        for (const kind of ['expenses', 'incomes']) {
            for (const r of L[date]?.[kind] || []) {
                if (category && r.name !== category && !String(r.name).includes(category)) continue;
                rows.push({ date, kind: kind === 'expenses' ? 'expense' : 'income', name: r.name, amount: r.amount,
                            ...(r.note ? { note: r.note } : {}), ...(r.until ? { until: r.until } : {}) });
            }
        }
    }
    const sum = k => round(rows.filter(r => r.kind === k).reduce((t, r) => t + (Number(r.amount) || 0), 0));
    return { from: from || null, to: to || null, rows: rows.length, expenseTotal: sum('expense'), incomeTotal: sum('income'), items: rows };
}

// 某段日期 [from, to]（含 to）内的收支汇总。周期项目（订阅、租赁、车贷）按天摊销到这段时间。
export function spendingSummary(payload, { from, to }) {
    const end = iso(new Date(toDate(to).getTime() + DAY));   // 改成不含当天的结束日
    const span = days(from, end);
    const exp = {}, inc = {};
    for (const r of ledgerRows(payload, { from, to }).items) {
        const bucket = r.kind === 'expense' ? exp : inc;
        bucket[r.name] = round((bucket[r.name] || 0) + Number(r.amount || 0));
    }
    const recurring = [];
    for (const i of payload.items || []) {
        if (i.type !== 'sub' && i.type !== 'rental') continue;
        if (i.type === 'sub' && !((i.payer || 'personal') === 'personal' && (i.currency || 'CNY') === 'CNY')) continue;
        let amt = 0;
        for (const r of records(i)) {
            if (!r.start || !r.end) continue;
            const a = r.start > from ? r.start : from, b = r.end < end ? r.end : end;
            const overlap = days(a, b), len = days(r.start, r.end);
            if (overlap > 0 && len > 0) amt += r.price * overlap / len;
        }
        if (amt > 0.004) recurring.push({ name: i.name, type: isLoan(i) ? 'loan' : i.type, amount: round(amt) });
    }
    recurring.sort((a, b) => b.amount - a.amount);
    const sum = o => round(Object.values(o).reduce((t, v) => t + v, 0));
    const recTotal = round(recurring.reduce((t, r) => t + r.amount, 0));
    const expTotal = sum(exp), incTotal = sum(inc);
    return {
        from, to, days: span,
        ledger: { expenses: Object.fromEntries(Object.entries(exp).sort((a, b) => b[1] - a[1])), expenseTotal: expTotal,
                  incomes: inc, incomeTotal: incTotal },
        recurringAmortized: recurring, recurringTotal: recTotal,
        totalSpending: round(expTotal + recTotal),
        net: round(incTotal - expTotal - recTotal),
        note: '周期项目按使用期 [start,end) 按天摊销；只计个人人民币订阅；收入按到账日计入。与网页「按天摊销」口径一致，不含网页把本月车贷待还整期计入的特殊处理。',
    };
}

export function checkins(payload, { name, from, to } = {}) {
    return (payload.items || [])
        .filter(i => i.type === 'checkin' && (!name || i.name === name || String(i.name).includes(name)))
        .map(i => {
            const entries = Object.entries(i.records || {}).filter(([d]) => (!from || d >= from) && (!to || d <= to)).sort();
            return { name: i.name, checkinType: i.checkinType, entries: entries.length, first: entries[0]?.[0] || null,
                     last: entries[entries.length - 1]?.[0] || null, records: Object.fromEntries(entries) };
        });
}
