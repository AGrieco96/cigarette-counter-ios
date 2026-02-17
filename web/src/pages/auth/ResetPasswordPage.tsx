import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Button, Card, Input } from '@/components/ui';

const schema = z.object({ email: z.string().email() });

export function ResetPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: z.infer<typeof schema>) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return toast.error(error.message);
    toast.success('Reset email sent successfully.');
  };

  return (
    <Card className="mx-auto mt-8 max-w-md space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">Reset password</h2>
        <p className="text-sm text-muted-foreground">We will send you a secure reset link by email.</p>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <Input placeholder="Email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-red-500">Please enter a valid email.</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </Card>
  );
}
