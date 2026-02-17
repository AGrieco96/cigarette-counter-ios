import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button, Card, Skeleton } from '@/components/ui';
import { supabase } from '@/lib/supabaseClient';
import { endOfToday, startOfToday } from '@/lib/date';
import type { SmokeEvent } from '@/types/db';
import { useAuth } from '@/hooks/useAuth';

export function TodayPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<SmokeEvent[]>([]);
  const [goal, setGoal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchToday = async () => {
    setLoading(true);
    const [{ data: userData }, { data: eventsData }] = await Promise.all([
      supabase.from('profiles').select('daily_goal').single(),
      supabase
        .from('smoke_events')
        .select('*')
        .gte('smoked_at', startOfToday())
        .lte('smoked_at', endOfToday())
        .order('smoked_at', { ascending: false })
    ]);
    setGoal(userData?.daily_goal ?? 0);
    setEvents(eventsData ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchToday();
  }, []);

  const total = events.reduce((sum, e) => sum + e.count, 0);
  const progress = goal > 0 ? Math.min((total / goal) * 100, 100) : 0;

  const addOne = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('smoke_events')
      .insert({ user_id: user.id, smoked_at: new Date().toISOString(), count: 1 });
    if (error) return toast.error(error.message);
    toast.success('Cigarette added');
    fetchToday();
  };

  const undo = async () => {
    const last = events[0];
    if (!last) return;
    const { error } = await supabase.from('smoke_events').delete().eq('id', last.id);
    if (error) return toast.error(error.message);
    toast.success('Last event removed');
    fetchToday();
  };

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <Card className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">Today</p>
        <p className="text-5xl font-bold">{total}</p>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button className="h-20 w-20 rounded-full text-3xl" onClick={addOne}>+1</Button>
        </motion.div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Goal {goal}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <Button className="w-full bg-muted text-foreground" onClick={undo}>Undo last event</Button>
      </Card>
    </div>
  );
}
