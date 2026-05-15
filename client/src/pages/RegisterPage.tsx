import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppDispatch } from "../app/hooks";
import { registerSchema, type RegisterValues } from "../features/auth/schemas/authSchemas";
import { setUser } from "../features/auth/authSlice";
import { useRegisterMutation } from "../services/api/baseApi";
import { Container } from "../shared/components/Container";
import { FormInput } from "../shared/components/FormInput";
import { Button } from "../shared/ui/Button";
import { Card } from "../shared/ui/Card";

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterValues) => {
    try {
      const response = await registerUser(values).unwrap();
      dispatch(setUser(response.data || response.user || null));
      toast.success("Account created");
      navigate("/profile/setup");
    } catch {
      toast.error("Registration failed. Try a different email.");
    }
  };

  return (
    <Container className="grid min-h-[calc(100vh-8rem)] place-items-center py-12">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.85fr]">
        <Card className="hidden min-h-[560px] flex-col justify-end overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.09),transparent_24rem)] p-8 lg:flex">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Create a profile that makes your work impossible to miss.</h1>
          <p className="mt-4 max-w-md text-zinc-400">Show skills, launch projects, publish writing, and connect with the community.</p>
        </Card>
        <Card className="p-6 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Register</h2>
          <p className="mt-2 text-sm text-zinc-400">Start your DevHub journey.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div>
              <FormInput placeholder="Name" {...register("name")} />
              {errors.name ? <p className="mt-2 text-xs text-red-300">{errors.name.message}</p> : null}
            </div>
            <div>
              <FormInput placeholder="Email" {...register("email")} />
              {errors.email ? <p className="mt-2 text-xs text-red-300">{errors.email.message}</p> : null}
            </div>
            <div>
              <FormInput type="password" placeholder="Password" {...register("password")} />
              {errors.password ? <p className="mt-2 text-xs text-red-300">{errors.password.message}</p> : null}
            </div>
            <Button className="w-full" disabled={isLoading}>{isLoading ? "Creating..." : "Create account"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-400">
            Already registered? <Link to="/login" className="font-semibold text-zinc-100 underline underline-offset-4">Login</Link>
          </p>
        </Card>
      </div>
    </Container>
  );
}
