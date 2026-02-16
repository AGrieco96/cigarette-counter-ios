import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Button, Card, Input } from '@/components/ui';

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
type FormData = z.infer<typeof schema>;

export function SignupPage() {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  console.debug('[auth][signup] render', {
    isSubmitting,
    hasEmailError: Boolean(errors.email),
    hasPasswordError: Boolean(errors.password)
  });

  const onSubmit = async (values: FormData) => {
    console.debug('[auth][signup] submit:start', { email: values.email });
    const { error, data } = await supabase.auth.signUp(values);
    console.debug('[auth][signup] submit:response', {
      hasError: Boolean(error),
      hasUser: Boolean(data.user),
      hasSession: Boolean(data.session)
    });

    if (error) {
      console.error('[auth][signup] submit:error', error);
      if ('status' in error && error.status === 404) {
        toast.error('Signup non raggiungibile (404). Controlla VITE_SUPABASE_URL: usa solo https://<project-ref>.supabase.co');
        return;
      }
      toast.error(error.message);
      return;
    }

    console.debug('[auth][signup] submit:success', { userId: data.user?.id });
    toast.success('Registrazione completata. Controlla la mail.');
  };

  return (
    <Card className="mx-auto mt-10 max-w-md space-y-4">
      <h2 className="text-xl font-semibold">Crea account</h2>
      <form
        className="space-y-3"
        onSubmit={handleSubmit(onSubmit, (formErrors) => {
          console.warn('[auth][signup] submit:invalid-form', formErrors);
          toast.error('Controlla email/password: form non valida.');
        })}
      >
        <Input placeholder="Email" {...register('email')} />
        {errors.email && <p className="text-xs text-red-500">Email non valida</p>}
        <Input type="password" placeholder="Password" {...register('password')} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>Sign up</Button>
      </form>
      <Link className="text-sm" to="/auth/login" onClick={() => console.debug('[auth][signup] link:login')}>Hai già un account? Login</Link>
    </Card>
  );
}
