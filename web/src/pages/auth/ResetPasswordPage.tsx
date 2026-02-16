import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Button, Card, Input } from '@/components/ui';

const schema = z.object({ email: z.string().email() });

export function ResetPasswordPage() {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: z.infer<typeof schema>) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return toast.error(error.message);
    toast.success('Email di reset inviata');
  };

  return (
    <Card className="mx-auto mt-10 max-w-md space-y-4">
      <h2 className="text-xl font-semibold">Reset password</h2>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <Input placeholder="Email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="text-xs text-red-500">Email non valida</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>Invia link reset</Button>
      </form>
    </Card>
  );
}
