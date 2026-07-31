import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolNameAr, setSchoolNameAr] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!schoolName.trim()) {
      setError("School name is required.");
      return;
    }

    setIsLoading(true);
    try {
      await signup(email, password, {
        displayName,
        newSchool: {
          name: schoolName.trim(),
          nameAr: schoolNameAr.trim(),
        },
      });
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create account.";
      // Translate common Firebase error codes
      if (message.includes("email-already-in-use")) {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-950 px-4 py-12">
      {/* Ambient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[350px] w-[500px] rounded-full bg-indigo-600/15 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-7 w-7 text-white"
            >
              <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
              <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.71 47.87 47.87 0 0 1-8.105 2.571.75.75 0 0 1-.832-.621 48.494 48.494 0 0 1-.764-4.065v-.001c-.065-.542-.116-1.09-.148-1.637Z" />
              <path d="M5.072 15.282a48.553 48.553 0 0 1 7.664 3.282c-.163.91-.337 1.802-.523 2.676a47.856 47.856 0 0 1-8.107-2.57.75.75 0 0 1-.46-.71 48.462 48.462 0 0 1 .426-2.678Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            EduSaaS
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Register your school — free to start
          </p>
        </div>

        <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-white">Create your school</CardTitle>
            <CardDescription className="text-gray-400">
              You'll be the administrator. Add teachers and students later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* School Info */}
              <div className="space-y-1.5">
                <Label htmlFor="school-name" className="text-gray-300">
                  School Name *
                </Label>
                <Input
                  id="school-name"
                  placeholder="Al-Rasheed High School"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="school-name-ar" className="text-gray-300">
                  Secondary / Local School Name (Optional)
                </Label>
                <Input
                  id="school-name-ar"
                  placeholder="Al-Rasheed Secondary"
                  value={schoolNameAr}
                  onChange={(e) => setSchoolNameAr(e.target.value)}
                  className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="my-2 border-t border-white/10" />

              {/* Admin Info */}
              <div className="space-y-1.5">
                <Label htmlFor="display-name" className="text-gray-300">
                  Your Full Name
                </Label>
                <Input
                  id="display-name"
                  placeholder="Ahmed Al-Karimi"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="admin@yourschool.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-password" className="text-gray-300">
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-gray-300">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 focus-visible:ring-indigo-500"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating school…
                  </span>
                ) : (
                  "Create School & Account"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already registered?{" "}
              <Link
                to="/login"
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
