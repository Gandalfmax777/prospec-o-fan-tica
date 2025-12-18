import { LoginForm } from "@/components/auth/LoginForm";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <LoginForm />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link to="/register">
              <Button variant="link" className="p-0 h-auto">
                Criar conta
              </Button>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

