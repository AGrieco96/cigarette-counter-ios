import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button, Card, Input, Skeleton } from '@/components/ui';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({ display_name: z.string().optional(), daily_goal: z.coerce.number().min(0) });

export function ProfilePage() {
  const { user } = useAuth();
  const { register, handleSubmit, reset, formState: { isSubmitting, isLoading } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: async () => {
      const { data } = await supabase.from('profiles').select('display_name, daily_goal').single();
      return { display_name: data?.display_name ?? '', daily_goal: data?.daily_goal ?? 0 };
    }
  });

  useEffect(() => {
    supabase.from('profiles').select('display_name, daily_goal').single().then(({ data }) => {
      if (data) reset(data);
    });
  }, [reset]);

  const save = async (values: z.infer<typeof schema>) => {
    const { error } = await supabase.from('profiles').update(values).eq('id', user?.id);
    if (error) return toast.error(error.message);
    toast.success('Profilo aggiornato');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success('Logout effettuato');
  };

  if (isLoading) return <Skeleton className="h-60" />;

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Email</p>
        <p>{user?.email}</p>
      </div>
      <form className="space-y-3" onSubmit={handleSubmit(save)}>
        <Input placeholder="Display name" {...register('display_name')} />
        <Input type="number" min={0} placeholder="Daily goal" {...register('daily_goal')} />
        <Button className="w-full" disabled={isSubmitting}>Salva</Button>
      </form>
      <Button className="w-full bg-muted text-foreground" onClick={logout}>Logout</Button>
    </Card>
  );
}
