import { useState, useEffect, useCallback } from 'react';
import supabase from './lib/supabase';
import { TABLE_GROUPS, ALL_TABLES, GROUP_COLORS, ACTIVITY_TABLES } from './adminTables';
import { BarRow, ActivityChart, StatCard } from './adminCharts';

const ACTIVITY_DAYS = 14;

function last14Days() {
  const days = [];
  const now = new Date();
  for (let i = ACTIVITY_DAYS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({ key: d.toISOString().slice(0, 10), label: `${d.getMonth() + 1}/${d.getDate()}`, count: 0 });
  }
  return days;
}

export default function AdminDashboard({ onOpenTable }) {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState({ syntarion: last14Days(), oracle: last14Days() });
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    const countResults = await Promise.all(
      ALL_TABLES.map(async (t) => {
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
        return [t, error ? 0 : count || 0];
      })
    );
    setCounts(Object.fromEntries(countResults));

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (ACTIVITY_DAYS - 1));
    cutoff.setHours(0, 0, 0, 0);

    const activityEntries = await Promise.all(
      Object.entries(ACTIVITY_TABLES).map(async ([groupId, tables]) => {
        const perTable = await Promise.all(
          tables.map(async (t) => {
            const { data, error } = await supabase.from(t).select('created_at').gte('created_at', cutoff.toISOString()).limit(2000);
            return error ? [] : data || [];
          })
        );
        const days = last14Days();
        const byKey = Object.fromEntries(days.map((d) => [d.key, d]));
        perTable.flat().forEach((row) => {
          const key = (row.created_at || '').slice(0, 10);
          if (byKey[key]) byKey[key].count += 1;
        });
        return [groupId, days];
      })
    );
    setActivity(Object.fromEntries(activityEntries));

    setUpdatedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasCounts = Object.keys(counts).length > 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ color: '#e8c84a', fontSize: 13 }}>DASHBOARD</div>
        <div style={{ fontSize: 10, color: '#5c564c' }}>{updatedAt ? `updated ${updatedAt.toLocaleTimeString()}` : ''}</div>
        <button
          onClick={load}
          disabled={loading}
          style={{ marginLeft: 'auto', background: 'rgba(200,168,74,0.14)', border: '1px solid rgba(200,168,74,0.5)', borderRadius: 6, padding: '5px 12px', color: '#e8c84a', fontSize: 10, cursor: loading ? 'default' : 'pointer', fontFamily: 'monospace', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABLE_GROUPS.map((group) => {
          const groupTables = group.categories.flatMap((c) => c.tables);
          const total = groupTables.reduce((sum, t) => sum + (counts[t] || 0), 0);
          return (
            <StatCard
              key={group.id}
              label={group.label}
              value={!hasCounts ? '…' : total.toLocaleString()}
              sub={`${groupTables.length} tables`}
              color={GROUP_COLORS[group.id]}
            />
          );
        })}
      </div>

      {TABLE_GROUPS.map((group) => (
        <div key={group.id} style={{ marginBottom: 26 }}>
          <div style={{ color: '#e8c84a', fontSize: 12, letterSpacing: '0.1em', marginBottom: 10 }}>{group.label.toUpperCase()}</div>

          <div style={{ border: '1px solid #2a251e', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#8a8378', marginBottom: 6 }}>Activity, last {ACTIVITY_DAYS} days</div>
            <ActivityChart days={activity[group.id] || last14Days()} color={GROUP_COLORS[group.id]} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '4px 24px' }}>
            {group.categories.map((cat) => {
              const catMax = Math.max(1, ...cat.tables.map((t) => counts[t] || 0));
              return (
                <div key={cat.label} style={{ border: '1px solid #2a251e', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#5c564c', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{cat.label}</div>
                  {cat.tables
                    .slice()
                    .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
                    .map((t) => (
                      <BarRow
                        key={t}
                        label={t}
                        value={counts[t] || 0}
                        max={catMax}
                        color={GROUP_COLORS[group.id]}
                        loading={!hasCounts}
                        onClick={() => onOpenTable(t)}
                      />
                    ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
