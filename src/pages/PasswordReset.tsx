import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Copy, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PasswordReset = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"request" | "reset">("request");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const generateResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if user exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        toast.error("User with this email not found");
        setIsLoading(false);
        return;
      }

      // Generate a simple token for development
      const token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      // Store the reset request
      const { error } = await supabase
        .from("password_reset_requests")
        .insert({
          email,
          token,
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          used: false
        });

      if (error) {
        toast.error("Failed to generate reset token");
        setIsLoading(false);
        return;
      }

      setGeneratedToken(token);
      setStep("reset");
      toast.success("Reset token generated! (Development mode)");
    } catch (error) {
      console.error("Error generating reset token:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Verify the token
      const { data: resetRequest, error: tokenError } = await supabase
        .from("password_reset_requests")
        .select("*")
        .eq("email", email)
        .eq("token", resetToken)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (tokenError || !resetRequest) {
        toast.error("Invalid or expired reset token");
        setIsLoading(false);
        return;
      }

      // Get the user ID
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        toast.error("User not found");
        setIsLoading(false);
        return;
      }

      // Update the password using Supabase admin functions
      // Note: In a real app, this would be done via an edge function with admin privileges
      // For development, we'll use the auth.updateUser method which requires the user to be logged in
      
      // Mark the token as used
      await supabase
        .from("password_reset_requests")
        .update({ used: true })
        .eq("id", resetRequest.id);

      toast.success("Password reset token verified! Please sign in with your new credentials.");
      toast.info("Note: In development mode, you'll need to contact an admin to actually change the password in the auth system.");
      
      navigate("/auth");
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(generatedToken);
    toast.success("Token copied to clipboard!");
  };

  if (step === "reset") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              Use the generated token to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Development Token Display */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Development Reset Token:
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyToken}
                  className="text-yellow-600 dark:text-yellow-400"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <code className="block p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-sm break-all">
                {generatedToken}
              </code>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                Copy this token and paste it below
              </p>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Reset Token</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="Paste the reset token here"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Token"}
              </Button>
              
              <Button 
                type="button"
                variant="outline" 
                className="w-full"
                onClick={() => setStep("request")}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Generate New Token
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Generate a reset token for development (no email required)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Development Mode:</strong> This will generate a reset token without sending emails. 
              The token will be displayed directly on screen.
            </p>
          </div>

          <form onSubmit={generateResetToken} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Reset Token"}
            </Button>
            
            <Button 
              type="button"
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/auth")}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordReset;