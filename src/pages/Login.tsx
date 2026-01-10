import { LoginForm } from "@/components/auth/LoginForm";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.08),_transparent_55%),_linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--muted)/0.3))] p-4">
      <div className="w-full max-w-md space-y-6">
        <LoginForm />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link to="/register">
              <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80 transition-colors">
                Criar conta
              </Button>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

