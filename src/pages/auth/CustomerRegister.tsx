
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import OTPVerification from "@/components/auth/OTPVerification";

const CustomerRegister = () => {
  const [formData, setFormData] = useState({
    phoneNumber: "",
    name: "",
  });
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
    
    if (!validatePhoneNumber(formData.phoneNumber) || !formData.name.trim()) {
      return;
    }

    const formattedPhone = formatPhoneNumber(formData.phoneNumber);
    setIsLoading(true);
    
    const { error } = await sendOTP(formattedPhone);
    
    if (!error) {
      setShowOTP(true);
    }
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleBack = () => {
    setShowOTP(false);
  };

  if (showOTP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <OTPVerification
          mobileNumber={formatPhoneNumber(formData.phoneNumber)}
          onBack={handleBack}
          customerName={formData.name}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join Ather Support to get personalized assistance
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Mobile Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
              {formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber) && (
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
              disabled={!validatePhoneNumber(formData.phoneNumber) || !formData.name.trim() || isLoading}
            >
              {isLoading ? "Sending OTP..." : "Create Account"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CustomerRegister;
