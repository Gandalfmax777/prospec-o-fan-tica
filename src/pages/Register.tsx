import { RegisterForm } from "@/components/auth/RegisterForm";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <RegisterForm />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/login">
              <Button variant="link" className="p-0 h-auto">
                Fazer login
              </Button>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

