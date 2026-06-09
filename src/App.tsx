import { useState, useEffect, type FormEvent } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Delete } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const SESSION_UNLOCK_KEY = "moneytrack-pin-unlocked";
const APP_PIN = (import.meta.env.VITE_APP_PIN || "").trim();

const App = () => {
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (!APP_PIN) return true;
    return sessionStorage.getItem(SESSION_UNLOCK_KEY) === "true";
  });

  // Load and apply theme configurations on startup
  useEffect(() => {
    const savedTheme = localStorage.getItem("moneytrack-theme-color") || "teal";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const savedDark = localStorage.getItem("moneytrack-dark-mode");
    if (savedDark === "true") {
      document.documentElement.classList.add("dark");
    } else if (savedDark === "false") {
      document.documentElement.classList.remove("dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      // Default to system preference
      document.documentElement.classList.add("dark");
      localStorage.setItem("moneytrack-dark-mode", "true");
    }
  }, []);

  const handleUnlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (enteredPin.trim() === APP_PIN) {
      sessionStorage.setItem(SESSION_UNLOCK_KEY, "true");
      setIsUnlocked(true);
      setPinError("");
      return;
    }

    setPinError("Incorrect PIN. Access denied.");
  };

  const handleKeypadPress = (digit: string) => {
    if (enteredPin.length < 5) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      if (pinError) setPinError("");

      if (nextPin === APP_PIN) {
        sessionStorage.setItem(SESSION_UNLOCK_KEY, "true");
        setIsUnlocked(true);
        setPinError("");
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    if (pinError) setPinError("");
  };

  const handleClear = () => {
    setEnteredPin("");
    if (pinError) setPinError("");
  };

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_UNLOCK_KEY);
    setEnteredPin("");
    setPinError("");
    setIsUnlocked(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {!isUnlocked ? (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-sm">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary/10 to-primary/5 flex items-center justify-center text-primary border border-primary/20 shadow-sm relative overflow-hidden">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5.5 h-5.5"
                    >
                      <path
                        d="M 6,18 V 9 L 12,15 L 18,9 V 18"
                        className="stroke-primary"
                        strokeWidth="2.2"
                      />
                      <path
                        d="M 4.5,6 H 19.5 M 12,6 V 18"
                        className="stroke-amber-500 dark:stroke-amber-400 drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)]"
                        strokeWidth="2.2"
                      />
                    </svg>
                  </div>
                  <h1 className="text-base font-extrabold tracking-tight">
                    <span className="text-foreground">Money</span>
                    <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Track</span>
                  </h1>
                </div>
                <CardTitle className="text-center">Enter your PIN</CardTitle>
                <p className="text-sm text-muted-foreground text-center">Use your 5-digit PIN to unlock the app</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUnlock} className="space-y-4">
                  <div className="flex justify-center">
                    <InputOTP
                      autoFocus
                      maxLength={5}
                      value={enteredPin}
                      onChange={(value) => {
                        setEnteredPin(value.replace(/\D/g, "").slice(0, 5));
                        if (pinError) setPinError("");
                      }}
                      inputMode="numeric"
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot index={0} mask className="h-11 w-11 rounded-md border" />
                        <InputOTPSlot index={1} mask className="h-11 w-11 rounded-md border" />
                        <InputOTPSlot index={2} mask className="h-11 w-11 rounded-md border" />
                        <InputOTPSlot index={3} mask className="h-11 w-11 rounded-md border" />
                        <InputOTPSlot index={4} mask className="h-11 w-11 rounded-md border" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {pinError && <p className="text-sm text-destructive text-center">{pinError}</p>}
                  
                  {/* Visual Numeric Keypad */}
                  <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto pt-4 border-t border-border/50 mt-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <Button
                        key={digit}
                        type="button"
                        variant="secondary"
                        onClick={() => handleKeypadPress(digit)}
                        className="w-14 h-14 rounded-full text-lg font-bold shadow-sm flex items-center justify-center hover:bg-secondary/80 active:scale-95 transition-all p-0"
                      >
                        {digit}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleClear}
                      className="w-14 h-14 rounded-full text-[10px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-all p-0"
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleKeypadPress('0')}
                      className="w-14 h-14 rounded-full text-lg font-bold shadow-sm flex items-center justify-center hover:bg-secondary/80 active:scale-95 transition-all p-0"
                    >
                      0
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleBackspace}
                      className="w-14 h-14 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all p-0"
                      aria-label="Backspace"
                    >
                      <Delete className="w-5 h-5" />
                    </Button>
                  </div>

                  <Button type="submit" className="w-full" disabled={enteredPin.length < 5}>Unlock</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="relative min-h-screen">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index onLock={APP_PIN ? handleLock : undefined} />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
