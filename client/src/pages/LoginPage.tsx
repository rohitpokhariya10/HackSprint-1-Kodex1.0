import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppDispatch } from "../app/hooks";
import { loginSchema, type LoginValues } from "../features/auth/schemas/authSchemas";
import { setUser } from "../features/auth/authSlice";
import { useLoginMutation } from "../services/api/baseApi";
import { Container } from "../shared/components/Container";
import { FormInput } from "../shared/components/FormInput";
import { Button } from "../shared/ui/Button";
import { Card } from "../shared/ui/Card";

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      const response = await login(values).unwrap();
      dispatch(setUser(response.data || response.user || null));
      toast.success("Welcome back to DevHub");
      navigate("/dashboard");
    } catch {
      toast.error("Login failed. Check your credentials.");
    }
  };

  return (
    <Container className="grid min-h-[calc(100vh-8rem)] place-items-center py-12">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.85fr]">
        <Card className="hidden min-h-[520px] flex-col justify-end overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.09),transparent_24rem)] p-8 lg:flex">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Your developer identity, one login away.</h1>
          <p className="mt-4 max-w-md text-zinc-400">Manage projects, publish blogs, and keep your portfolio ready for discovery.</p>
        </Card>
        <Card className="p-6 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Login</h2>
          <p className="mt-2 text-sm text-zinc-400">Continue building your DevHub presence.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div>
              <FormInput placeholder="Email" {...register("email")} />
              {errors.email ? <p className="mt-2 text-xs text-red-300">{errors.email.message}</p> : null}
            </div>
            <div>
              <FormInput type="password" placeholder="Password" {...register("password")} />
              {errors.password ? <p className="mt-2 text-xs text-red-300">{errors.password.message}</p> : null}
            </div>
            <Button className="w-full" disabled={isLoading}>{isLoading ? "Signing in..." : "Login"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-400">
            New here? <Link to="/register" className="font-semibold text-zinc-100 underline underline-offset-4">Create account</Link>
          </p>
        </Card>
      </div>
    </Container>
  );
}
