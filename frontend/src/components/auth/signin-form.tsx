import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";

const signInSchema = z.object({
  username: z.string().min(3, { message: "Ten dang nhap bat buoc phai co" }),
  password: z.string().min(6, { message: "Mat khau phai co it nhat 6 ky tu" }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function SignInForm({ 
    className,
  ...props
}: React.ComponentProps<"div">) {
    const {signIn} = useAuthStore();
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
      } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
      });
    
      const onSubmit = async (data: SignInFormValues) => {
        //goi api tu backend
        const {username, password} = data;
        await signIn(username, password);
        navigate("/");
    };
    return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* header logo */}
              <div className="flex flex-col items-center text-center gap-2">
                <a href="/" className="mx-auto block w-fit text-center">
                  <img src="/logo.svg" alt="logo" />
                </a>
                <h1 className="text-2xl font-bold">Chao mung quay lai</h1>
                <p className="text-muted-foreground text_balance">
                  Chao mung ban hay dang nhap de tiep tuc
                </p>
              </div>
              {/* username */}
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <Label htmlFor="username" className="block text-sm">
                    Ten dang nhap
                  </Label>
                  <Input
                    type="text"
                    id="username"
                    {...register("username")}
                    placeholder="Moji"
                  />
                  {errors.username && (
                    <p className="error-message">
                      {errors.username.message}
                    </p>
                  )}
                </div>
              </div>
              {/* Password */}
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <Label htmlFor="password" className="block text-sm">
                    Password
                  </Label>
                  <Input
                    type="password"
                    id="password"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-destructive text-sm">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>
              {/* nut dang nhap */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Dang nhap
              </Button>
              <div className="text-center text-sm">
                Chua co tai khoan?{" "}
                <a href="/signup" className="underline underline-offset-4">
                  Dang ky
                </a>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.png"
              alt="Image"
              className="absolute top-1/2 -translate-y-1/2 object-cover"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}