import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, Lock, Users, Database, Key } from "lucide-react";

export const SecurityReport = () => {
  const securityFixes = [
    {
      category: "Critical Fixes",
      icon: <Shield className="h-5 w-5" />,
      status: "completed",
      items: [
        "Replaced weak password reset token generation with cryptographically secure tokens",
        "Removed hardcoded JWT tokens and replaced with proper Supabase client calls",
        "Implemented secure role update function with privilege escalation protection",
        "Added admin audit logging for all role changes",
        "Prevented admins from removing their own admin privileges"
      ]
    },
    {
      category: "Input Validation",
      icon: <CheckCircle className="h-5 w-5" />,
      status: "completed",
      items: [
        "Added Zod schema validation for all forms",
        "Implemented email format validation",
        "Added password strength requirements (8+ chars, uppercase, lowercase, number, special char)",
        "Added URL validation for website fields",
        "Added numeric validation for amounts"
      ]
    },
    {
      category: "Database Security",
      icon: <Database className="h-5 w-5" />,
      status: "completed",
      items: [
        "Fixed RLS policies for password reset requests",
        "Created audit log table with proper RLS",
        "Implemented secure role update function",
        "Added proper access controls for edge functions"
      ]
    },
    {
      category: "Authentication",
      icon: <Key className="h-5 w-5" />,
      status: "completed",
      items: [
        "Configured authentication settings for development",
        "Enabled auto-confirm email for faster testing",
        "Disabled anonymous users for security",
        "Maintained proper signup/signin flow"
      ]
    }
  ];

  const remainingWarnings = [
    {
      level: "warning",
      title: "Auth OTP Long Expiry",
      description: "OTP expiry exceeds recommended threshold - configure in Supabase dashboard",
      link: "https://supabase.com/docs/guides/platform/going-into-prod#security"
    },
    {
      level: "warning", 
      title: "Leaked Password Protection Disabled",
      description: "Leaked password protection is currently disabled - enable in auth settings",
      link: "https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection"
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-green-600" />
        <h2 className="text-2xl font-bold">Security Assessment Report</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {securityFixes.map((fix, index) => (
          <Card key={index} className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                {fix.icon}
                <CardTitle className="text-lg">{fix.category}</CardTitle>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  ✓ Fixed
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {fix.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-lg">Remaining Warnings (Non-Critical)</CardTitle>
          </div>
          <CardDescription>
            These warnings require manual configuration in the Supabase dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {remainingWarnings.map((warning, idx) => (
              <div key={idx} className="p-4 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-semibold">{warning.title}</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">{warning.description}</p>
                <a 
                  href={warning.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Documentation →
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>• Regularly review admin audit logs for suspicious activity</li>
            <li>• Consider implementing 2FA for admin accounts in production</li>
            <li>• Set up monitoring alerts for role changes and privileged actions</li>
            <li>• Regularly update dependencies and review security policies</li>
            <li>• Consider rate limiting on authentication endpoints for production</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};