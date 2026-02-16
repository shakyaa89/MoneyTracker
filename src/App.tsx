import { useState, type FormEvent } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Wallet } from "lucide-react";
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
                <div className="flex items-center justify-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  <span className="text-base font-semibold">MoneyTrack</span>
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
