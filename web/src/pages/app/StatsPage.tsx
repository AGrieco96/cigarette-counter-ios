import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Skeleton } from '@/components/ui';
import { supabase } from '@/lib/supabaseClient';
import { endOfToday, formatDay, lastNDaysStart, startOfToday } from '@/lib/date';
import type { SmokeEvent } from '@/types/db';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function StatsPage() {
  const [events, setEvents] = useState<SmokeEvent[]>([]);
  const [goal, setGoal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: profile }, { data: ev }] = await Promise.all([
        supabase.from('profiles').select('daily_goal').single(),
        supabase.from('smoke_events').select('*').gte('smoked_at', lastNDaysStart(30)).lte('smoked_at', endOfToday())
      ]);
      setGoal(profile?.daily_goal ?? 0);
      setEvents(ev ?? []);
      setLoading(false);
    })();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      const day = e.smoked_at.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + e.count);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  const today = events.filter((e) => e.smoked_at >= startOfToday()).reduce((s, e) => s + e.count, 0);
  const total30 = events.reduce((s, e) => s + e.count, 0);
  const avg7 = grouped.slice(-7).reduce((s, [, v]) => s + v, 0) / Math.max(1, Math.min(7, grouped.length));
  let streak = 0;
  if (goal > 0) {
    for (const [, value] of [...grouped].reverse()) {
      if (value <= goal) streak += 1;
      else break;
    }
  }
  const chartData = grouped.slice(-14).map(([date, total]) => ({ date: date.slice(5), total, full: formatDay(date) }));

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[['Oggi', today], ['Avg 7 giorni', avg7.toFixed(1)], ['Totale 30 giorni', total30], ['Streak sotto target', streak]].map(([label, value]) => (
          <motion.div key={String(label)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></Card>
          </motion.div>
        ))}
      </div>
      <Card>
        <p className="mb-2 text-sm font-medium">Trend 14 giorni</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
