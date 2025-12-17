import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Since we use Firebase popup, we don't need a callback page.
    // Just redirect to home.
    navigate("/");
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="animate-spin mb-4">
        <Loader2 className="w-12 h-12 text-green-600" />
      </div>
      <p className="text-gray-600 font-medium">Completing sign in...</p>
    </div>
  );
}
