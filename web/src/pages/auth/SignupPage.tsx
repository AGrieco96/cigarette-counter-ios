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

  const onSubmit = async (values: FormData) => {
    console.debug('[auth][signup] submit', { email: values.email });
    const { error } = await supabase.auth.signUp(values);
    if (error) {
      console.error('[auth][signup] error', error);
      if ('status' in error && error.status === 404) {
        return toast.error('Signup non raggiungibile (404). Controlla VITE_SUPABASE_URL: usa solo https://<project-ref>.supabase.co');
      }
      return toast.error(error.message);
    }
    toast.success('Registrazione completata. Controlla la mail.');
  };

  return (
    <Card className="mx-auto mt-10 max-w-md space-y-4">
      <h2 className="text-xl font-semibold">Crea account</h2>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit, (formErrors) => { console.warn('[auth][signup] invalid form', formErrors); })}>
        <Input placeholder="Email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="text-xs text-red-500">Email non valida</p>}
        <Input type="password" placeholder="Password" autoComplete="new-password" {...register('password')} />
        {errors.password && <p className="text-xs text-red-500">Password richiesta (minimo 6 caratteri)</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>Sign up</Button>
      </form>
      <Link className="text-sm" to="/auth/login">Hai già un account? Login</Link>
    </Card>
  );
}
