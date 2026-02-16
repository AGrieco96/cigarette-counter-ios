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

  console.debug('[auth][login] render', {
    isSubmitting,
    hasEmailError: Boolean(errors.email),
    hasPasswordError: Boolean(errors.password)
  });

  const onSubmit = async (values: FormData) => {
    console.debug('[auth][login] submit:start', { email: values.email });
    const { error, data } = await supabase.auth.signInWithPassword(values);
    console.debug('[auth][login] submit:response', {
      hasError: Boolean(error),
      hasSession: Boolean(data.session),
      hasUser: Boolean(data.user)
    });

    if (error) {
      console.error('[auth][login] submit:error', error);
      if ('status' in error && error.status === 404) {
        toast.error('Login non raggiungibile (404). Controlla VITE_SUPABASE_URL: usa solo https://<project-ref>.supabase.co');
        return;
      }
      toast.error(error.message);
      return;
    }

    console.debug('[auth][login] submit:success', { userId: data.user?.id });
    toast.success('Login effettuato');
    console.debug('[auth][login] navigate', { to: '/app/today' });
    navigate('/app/today');
  };

  return (
    <Card className="mx-auto mt-10 max-w-md space-y-4">
      <h2 className="text-xl font-semibold">Accedi a SmokeLess</h2>
      <form
        className="space-y-3"
        onSubmit={handleSubmit(onSubmit, (formErrors) => {
          console.warn('[auth][login] submit:invalid-form', formErrors);
          toast.error('Controlla email/password: form non valida.');
        })}
      >
        <Input placeholder="Email" {...register('email')} />
        {errors.email && <p className="text-xs text-red-500">Email non valida</p>}
        <Input type="password" placeholder="Password" {...register('password')} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>Login</Button>
      </form>
      <div className="flex justify-between text-sm">
        <Link to="/auth/signup" onClick={() => console.debug('[auth][login] link:signup')}>Crea account</Link>
        <Link to="/auth/reset" onClick={() => console.debug('[auth][login] link:reset')}>Reset password</Link>
      </div>
    </Card>
  );
}
