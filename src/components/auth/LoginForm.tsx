import React, { useState, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Clock } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";
import { AxiosError } from "axios";

// ======================= SCHEMAS =======================

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

const staffLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;
type StaffLoginFormValues = z.infer<typeof staffLoginSchema>;

type UserType = "admin" | "staff";

// ======================= USER SELECTOR =======================

const UserTypeSelector = ({
  userType,
  setUserType,
}: {
  userType: UserType;
  setUserType: React.Dispatch<React.SetStateAction<UserType>>;
}) => {
  return (
    <div className="mb-6 flex justify-end">
      <div className="relative">
        <select
          value={userType}
          onChange={(e) => setUserType(e.target.value as UserType)}
          className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8"
        >
          <option value="admin">👤 Admin Login</option>
          <option value="staff">👥 Staff Login</option>
        </select>
      </div>
    </div>
  );
};

// ======================= ADMIN FORM =======================

type AdminFormProps = {
  adminForm: UseFormReturn<AdminLoginFormValues>;
  onSubmit: (values: AdminLoginFormValues) => void;
  loading: boolean;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  error: unknown;
};

const AdminForm = ({
  adminForm,
  onSubmit,
  loading,
  showPassword,
  setShowPassword,
  error,
}: AdminFormProps) => {
  return (
    <Form {...adminForm}>
      <form onSubmit={adminForm.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={adminForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="admin@company.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={adminForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>

              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    {...field}
                    className="pr-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="text-red-500 text-sm text-center">
            {typeof error === "string" ? error : JSON.stringify(error)}
          </div>
        )}

        <div className="flex justify-between items-center">
          <FormField
            control={adminForm.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>

                <FormLabel className="font-normal">Remember me</FormLabel>
              </FormItem>
            )}
          />

          <Link to="/forgot-password" className="text-sm text-traccbox-500">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full bg-traccbox-500 hover:bg-traccbox-600 text-white text-base font-medium py-2.5"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In as Admin"}
        </Button>
      </form>
    </Form>
  );
};

// ======================= STAFF FORM =======================

type StaffFormProps = {
  staffForm: UseFormReturn<StaffLoginFormValues>;
  onSubmit: (values: StaffLoginFormValues) => void;
  loading: boolean;
  error: unknown;
};

const StaffForm = ({ staffForm, onSubmit, loading, error }: StaffFormProps) => {
  return (
    <Form {...staffForm}>
      <form onSubmit={staffForm.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={staffForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Staff Email</FormLabel>

              <FormControl>
                <Input placeholder="staff@company.com" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="text-red-500 text-sm text-center">
            {String(error)}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-traccbox-500 hover:bg-traccbox-600 text-white text-base font-medium py-2.5"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In as Staff"}
        </Button>
      </form>
    </Form>
  );
};

// ======================= MAIN =======================

const LoginForm = () => {
  const [userType, setUserType] = useState<UserType>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  let returnUrl = searchParams.get("returnUrl") || "/dashboard";

  if (!searchParams.get("returnUrl")) {
    const storedReturnUrl = localStorage.getItem("return_url");
    if (storedReturnUrl) {
      returnUrl = storedReturnUrl;
    }
  }

  const { login, staffLogin, error } = useAuth();

  useEffect(() => {
    const reason = searchParams.get("reason");
    const isExpiredQuery = reason === "expired" || searchParams.get("expired") === "true";
    const isExpiredState = (location.state as { sessionExpired?: boolean })?.sessionExpired;
    const isExpiredSessionStorage = sessionStorage.getItem("session_expired") === "true";

    if (isExpiredQuery || isExpiredState || isExpiredSessionStorage) {
      const msg = "Your session has expired. Please log in again to continue.";
      setSessionExpiredMessage(msg);
      toast.error(msg, { id: "session-expired-toast" });
      sessionStorage.removeItem("session_expired");
    }
  }, [location.search, location.state]);

  const adminForm = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const staffForm = useForm<StaffLoginFormValues>({
    resolver: zodResolver(staffLoginSchema),
    defaultValues: {
      email: "",
    },
  });

  const onAdminSubmit = async (values: AdminLoginFormValues) => {
    setLoading(true);

    const success = await login(values.email, values.password);

    if (success) {
      try {
        localStorage.removeItem("return_url");
        sessionStorage.removeItem("session_expired");
      } catch (error) {
        console.error("Could not remove return_url", error);
      }
      navigate(returnUrl, { replace: true });
    }

    setLoading(false);
  };

  const onStaffSubmit = async (values: StaffLoginFormValues) => {
    try {
      setLoading(true);

      const res = await staffLogin(values.email);

      if (res?.success) {
        toast.success("Please verify email");

        navigate(`/staff-verify?email=${values.email}&id=${res.id}`);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {sessionExpiredMessage && (
        <Alert className="mb-6 border-amber-300 bg-amber-50 text-amber-900 flex items-start space-x-3 p-4 rounded-xl shadow-sm">
          <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <AlertTitle className="font-semibold text-amber-950 text-sm">Session Expired</AlertTitle>
            <AlertDescription className="text-amber-800 text-sm mt-0.5">
              {sessionExpiredMessage}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <UserTypeSelector userType={userType} setUserType={setUserType} />

      {userType === "admin" ? (
        <AdminForm
          adminForm={adminForm}
          onSubmit={onAdminSubmit}
          loading={loading}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          error={error}
        />
      ) : (
        <StaffForm
          staffForm={staffForm}
          onSubmit={onStaffSubmit}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
};

export default LoginForm;
