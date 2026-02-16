import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Button, Card, Input } from '@/components/ui';

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [mockClicks, setMockClicks] = useState(0);
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    console.debug('[auth][login] submit', { email: values.email });
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      console.error('[auth][login] error', error);
      if ('status' in error && error.status === 404) {
        return toast.error('Login non raggiungibile (404). Controlla VITE_SUPABASE_URL: usa solo https://<project-ref>.supabase.co');
      }
      return toast.error(error.message);
    }
    toast.success('Login effettuato');
    navigate('/app/today');
  };

  const testMockButton = () => {
    const next = mockClicks + 1;
    setMockClicks(next);
    console.info('[debug][mock-button] click', {
      clickCount: next,
      pathname: window.location.pathname,
      href: window.location.href
    });
    toast.success(`Mock button OK (#${next})`);
  };

  return (
    <Card className="mx-auto mt-10 max-w-md space-y-4">
      <h2 className="text-xl font-semibold">Accedi a SmokeLess</h2>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit, (formErrors) => { console.warn('[auth][login] invalid form', formErrors); })}>
        <Input placeholder="Email" {...register('email')} />
        {errors.email && <p className="text-xs text-red-500">Email non valida</p>}
        <Input type="password" placeholder="Password" {...register('password')} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>Login</Button>
      </form>

      <div className="flex justify-between text-sm">
        <Link to="/auth/signup">Crea account</Link>
        <Link to="/auth/reset">Reset password</Link>
      </div>

      <div className="rounded-xl border border-dashed border-primary/40 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Debug locale bottoni</p>
        <div className="grid grid-cols-1 gap-2">
          <Button className="w-full" onClick={testMockButton}>Mock button test</Button>
          <p className="text-xs text-muted-foreground">Click mock registrati: {mockClicks}</p>
        </div>
      </div>
    </Card>
  );
}
