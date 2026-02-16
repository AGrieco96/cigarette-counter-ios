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
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    const { error } = await supabase.auth.signUp(values);
    if (error) return toast.error(error.message);
    toast.success('Registrazione completata. Controlla la mail.');
  };

  return (
    <Card className="mx-auto mt-10 max-w-md space-y-4">
      <h2 className="text-xl font-semibold">Crea account</h2>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <Input placeholder="Email" {...register('email')} />
        <Input type="password" placeholder="Password" {...register('password')} />
        <Button className="w-full" disabled={isSubmitting}>Sign up</Button>
      </form>
      <Link className="text-sm" to="/auth/login">Hai già un account? Login</Link>
    </Card>
  );
}
