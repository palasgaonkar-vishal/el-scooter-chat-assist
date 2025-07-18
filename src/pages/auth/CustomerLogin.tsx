
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import OTPVerification from "@/components/auth/OTPVerification";

const CustomerLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { sendOTP, user } = useAuth();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91')) {
      return '+' + cleaned;
    } else if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    return '+' + cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    setIsLoading(true);
    
    const { error } = await sendOTP(formattedPhone);
    
    if (!error) {
      setShowOTP(true);
    }
    setIsLoading(false);
  };

  const handleBack = () => {
    setShowOTP(false);
    setPhoneNumber("");
    setCustomerName("");
  };

  if (showOTP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <OTPVerification
          mobileNumber={formatPhoneNumber(phoneNumber)}
          onBack={handleBack}
          customerName={customerName}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Enter your mobile number to sign in to your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              {phoneNumber && !validatePhoneNumber(phoneNumber) && (
                <p className="text-sm text-destructive">
                  Please enter a valid Indian mobile number
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={!validatePhoneNumber(phoneNumber) || isLoading}
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              New customer?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Create account
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CustomerLogin;
