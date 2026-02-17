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
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    const { error } = await supabase.auth.signUp(values);
    if (error) {
      if ('status' in error && error.status === 404) {
        return toast.error('Signup endpoint not reachable (404). Check VITE_SUPABASE_URL.');
      }
      return toast.error(error.message);
    }
    toast.success('Signup complete. Check your email to confirm your account.');
  };

  return (
    <Card className="mx-auto mt-8 max-w-md space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">Create your account</h2>
        <p className="text-sm text-muted-foreground">Start your smoke-free tracking journey.</p>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <Input placeholder="Email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-red-500">Please enter a valid email.</p>}
        </div>

        <div className="space-y-1">
          <Input type="password" placeholder="Password" autoComplete="new-password" {...register('password')} />
          {errors.password && <p className="text-xs text-red-500">Password must be at least 6 characters.</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Sign up
        </Button>
      </form>

      <Link className="text-sm text-primary underline-offset-2 hover:underline" to="/auth/login">
        Already have an account? Log in
      </Link>
    </Card>
  );
}
