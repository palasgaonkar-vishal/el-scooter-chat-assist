
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface OTPVerificationProps {
  mobileNumber: string;
  onBack: () => void;
  customerName?: string;
}

const OTPVerification = ({ mobileNumber, onBack, customerName }: OTPVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const { verifyOTP, sendOTP } = useAuth();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setIsLoading(true);
    const { error } = await verifyOTP(mobileNumber, otp, customerName);
    
    if (error) {
      setOtp("");
    }
    setIsLoading(false);
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    const { error } = await sendOTP(mobileNumber);
    
    if (!error) {
      setCountdown(300);
      setCanResend(false);
      setOtp("");
    }
    setIsLoading(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-1 h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl font-bold">Verify OTP</CardTitle>
        </div>
        <CardDescription>
          Enter the 6-digit code sent to {mobileNumber}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleVerifyOTP}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <div className="flex justify-center">
              <InputOTP
                value={otp}
                onChange={setOtp}
                maxLength={6}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <div className="text-center space-y-2">
            {!canResend ? (
              <p className="text-sm text-muted-foreground">
                Resend OTP in {formatTime(countdown)}
              </p>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Resend OTP
              </Button>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={otp.length !== 6 || isLoading}
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
};

export default OTPVerification;
