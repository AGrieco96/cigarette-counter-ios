import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Skeleton } from '@/components/ui';
import { supabase } from '@/lib/supabaseClient';
import { formatDay, lastNDaysStart } from '@/lib/date';
import type { SmokeEvent } from '@/types/db';

export function HistoryPage() {
  const [events, setEvents] = useState<SmokeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('smoke_events')
      .select('*')
      .gte('smoked_at', lastNDaysStart(30))
      .order('smoked_at', { ascending: false });
    setEvents(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, SmokeEvent[]>();
    for (const e of events) {
      const day = e.smoked_at.slice(0, 10);
      map.set(day, [...(map.get(day) ?? []), e]);
    }
    return [...map.entries()];
  }, [events]);

  const remove = async (id: string) => {
    const { error } = await supabase.from('smoke_events').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Event deleted');
    fetchEvents();
  };

  if (loading) return <Skeleton className="h-64" />;
  if (!grouped.length) return <Card>No events recorded yet.</Card>;

  return (
    <div className="space-y-3">
      {grouped.map(([day, dayEvents]) => (
        <Card key={day} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{formatDay(day)}</p>
            <p className="text-sm text-muted-foreground">Total {dayEvents.reduce((s, e) => s + e.count, 0)}</p>
          </div>
          {dayEvents.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-2 text-sm">
              <span>{new Date(e.smoked_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} · +{e.count}</span>
              <Button className="bg-transparent p-1 text-red-500" onClick={() => remove(e.id)}><Trash2 size={16} /></Button>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
