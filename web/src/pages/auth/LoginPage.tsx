import { zodResolver } from '@hookform/resolvers/zod';
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
    </Card>
  );
}
