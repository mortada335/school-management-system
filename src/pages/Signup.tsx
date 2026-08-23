import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sun, Moon, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Signup() {
  const { signup } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, setLang } = useTranslation();
  const navigate = useNavigate();

  const [displayName,     setDisplayName]     = useState("");
  const [schoolName,      setSchoolName]      = useState("");
  const [schoolNameAr,    setSchoolNameAr]    = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error,           setError]           = useState("");
  const [isLoading,       setIsLoading]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("errPasswordMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("errPasswordShort"));
      return;
    }
    if (!schoolName.trim()) {
      setError(t("errSchoolRequired"));
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
      const message = err instanceof Error ? err.message : t("errCreateAccount");
      if (message.includes("email-already-in-use")) {
        setError(t("errEmailInUse"));
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 dark:bg-gray-950 px-4 py-12 transition-colors">
      {/* Top-right quick settings */}
      <div className="absolute top-4 end-4 flex items-center gap-2 z-10">
        <button
          onClick={toggleTheme}
          className="rounded-xl border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors shadow-2xs"
          title={theme === "dark" ? t("lightMode") : t("darkMode")}
        >
          {theme === "dark"
            ? <Sun  className="h-4 w-4 text-amber-400" strokeWidth={2} />
            : <Moon className="h-4 w-4 text-indigo-500" strokeWidth={2} />
          }
        </button>
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors shadow-2xs"
        >
          {lang === "ar" ? "English" : "العربية"}
        </button>
      </div>

      {/* Ambient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-500/10 dark:bg-violet-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[350px] w-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-3xl"
      />

      <div className="relative w-full max-w-md my-8">
        {/* Brand */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            EduSaaS
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {t("registerFree")}
          </p>
        </div>

        <Card className="border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">
              {t("createYourSchool")}
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              {t("signupSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* School Info */}
              <div className="space-y-1.5">
                <Label htmlFor="school-name" className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                  {t("schoolNameEn")}
                </Label>
                <Input
                  id="school-name"
                  placeholder="Al-Rasheed High School"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 focus-visible:ring-indigo-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="school-name-ar" className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                  {t("schoolNameLocal")}
                </Label>
                <Input
                  id="school-name-ar"
                  placeholder="ثانوية الرشيد"
                  value={schoolNameAr}
                  onChange={(e) => setSchoolNameAr(e.target.value)}
                  className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 focus-visible:ring-indigo-500 text-sm"
                />
              </div>

              <div className="my-2 border-t border-gray-200 dark:border-white/10" />

              {/* Admin Info */}
              <div className="space-y-1.5">
                <Label htmlFor="display-name" className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                  {t("fullName")} *
                </Label>
                <Input
                  id="display-name"
                  placeholder="Ahmed Al-Karimi"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 focus-visible:ring-indigo-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-email" className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                  {t("emailLabel")} *
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="admin@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 focus-visible:ring-indigo-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-password" className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                  {t("passwordLabel")}
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder={t("passwordMinChars")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                  className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 focus-visible:ring-indigo-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                  {t("confirmPassword")}
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  dir="ltr"
                  className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 focus-visible:ring-indigo-500 text-sm"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-rose-50 text-rose-700 border border-rose-200 px-3 py-2 text-xs sm:text-sm dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/30 transition-all text-xs sm:text-sm font-semibold py-2.5 rounded-xl"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("creatingSchool")}
                  </span>
                ) : (
                  t("createSchoolAccount")
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {t("alreadyRegistered")}{" "}
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                {t("signIn")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
