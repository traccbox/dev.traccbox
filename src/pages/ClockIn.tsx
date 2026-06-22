import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { Clock, LogIn, LogOut, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQRClockIn } from "@/api/settingsApi/hooks/useQRCode";
import { getAttendanceStatus, checkOut } from "@/api/attendance";
import { getCurrentUser, getAccessToken, isTokenValid } from "@/utils/authUtils";
import type { AttendanceStatus } from "@/api/types";

const ClockIn: React.FC = () => {
  const { staffId, companyId } = useParams<{
    staffId: string;
    companyId: string;
  }>();

  const [searchParams] = useSearchParams();
  const managerId = searchParams.get("manager_id");
  const location = useLocation();
  const navigate = useNavigate();
  
  const { toast } = useToast();
  const { user: contextUser, token } = useAuth();
  const { mutate: performQRClockIn, isPending: isClockingIn } = useQRClockIn();

  const [attendanceStatus, setAttendanceStatus] =
    useState<AttendanceStatus | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  
  // Use getCurrentUser to get user from token, localStorage, or context
  // This ensures it works even in new tabs
  const [user, setUser] = useState<any>(contextUser);

  // Accept QR ids with prefixes like `company-`, `staff-`, `manager-`
  const normalizeId = (id?: string | null) => {
    if (!id) return id;
    return id.replace(/^(company-|staff-|manager-)/, "");
  };

  useEffect(() => {
    setIsVerifying(true);
    
    // Get token - from context or directly
    const currentToken = token || getAccessToken();
    
    if (!currentToken) {
      // Not authenticated - redirect to login with return URL
      setAuthError("You need to be logged in to clock in staff members");
      const returnUrl = `${location.pathname}${location.search}`;
      try {
        localStorage.setItem("return_url", returnUrl);
      } catch (error) {
        console.error("Could not save return URL", error);
      }
      navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Check if token is still valid
    if (!isTokenValid(currentToken)) {
      setAuthError("Your session has expired. Please login again.");
      const returnUrl = `${location.pathname}${location.search}`;
      try {
        localStorage.setItem("return_url", returnUrl);
      } catch (error) {
        console.error("Could not save return URL", error);
      }
      navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Get current user from token or context or localStorage
    const currentUser = contextUser || getCurrentUser();
    
    if (!currentUser) {
      setAuthError("Unable to load user information");
      setIsVerifying(false);
      return;
    }

    setUser(currentUser);

    // Verify user's ID matches the company_id in the URL (allow prefixed ids)
    const normalizedUserId = normalizeId(currentUser.id);
    const normalizedCompanyId = normalizeId(companyId);

    // Debug log for mismatches
    console.log("ClockIn validation:", {
      currentUserId: currentUser.id,
      companyId,
      normalizedUserId,
      normalizedCompanyId,
      managerId,
    });

    const companyMatches =
      normalizedUserId === normalizedCompanyId ||
      (companyId && companyId.includes(normalizedUserId));

    if (!companyMatches) {
      setAuthError(
        `Permission denied. Your company ID (${normalizedUserId?.slice(0, 8)}...) doesn't match the QR code company ID (${normalizedCompanyId?.slice(0, 8)}...). Only admins/managers from the correct company can clock in staff.`
      );
      setIsVerifying(false);
      return;
    }

    // If managerId is provided (manager clocking in), verify it matches the logged-in user (normalize too)
    if (managerId) {
      const normalizedManagerId = normalizeId(managerId);
      const managerMatches =
        normalizedUserId === normalizedManagerId ||
        (managerId && managerId.includes(normalizedUserId));

      if (!managerMatches) {
        setAuthError(
          `Your user ID (${normalizedUserId?.slice(0, 8)}...) doesn't match the manager ID in the QR code (${normalizedManagerId?.slice(0, 8)}...). You cannot clock in this staff member.`
        );
        setIsVerifying(false);
        return;
      }
    }

    // All validations passed
    setIsVerifying(false);
  }, [token, contextUser, companyId, managerId, navigate, location]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!staffId || !companyId || authError || isVerifying) return;
      setAttendanceLoading(true);
      try {
        const status = await getAttendanceStatus(staffId);
        setAttendanceStatus(status);
      } catch (error) {
        console.error("Error fetching attendance status:", error);
        toast({
          title: "Error",
          description:
            (error as any)?.response?.data?.message ||
            "Unable to load attendance status.",
        });
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchStatus();
  }, [staffId, companyId, authError, isVerifying, toast]);

  const handleCheckIn = async () => {
    if (!companyId || !staffId) {
      toast({
        title: "Error",
        description: "Missing required parameters: company ID and staff ID",
      });
      return;
    }

    const clockInManagerId = managerId || undefined;

    setLoading(true);

    try {
      // Call the QR clock-in endpoint
      performQRClockIn(
        {
          company_id: companyId,
          staff_id: staffId,
          manager_id: clockInManagerId,
        },
        {
          onSuccess: (data) => {
            setAttendanceStatus((prev) => ({
              staff_id: staffId,
              company_id: companyId,
              is_checked_in: true,
              last_check_in: data.check_in_time || new Date().toISOString(),
              check_in_time:
                data.check_in_time || new Date().toLocaleTimeString(),
              last_check_out: data.check_out_time ?? prev?.last_check_out,
            }));

            toast({
              title: "Success",
              description: "Staff member has been successfully clocked in",
            });

            setTimeout(() => {
              navigate("/dashboard");
            }, 2000);
          },
          onError: (error: any) => {
            toast({
              title: "Error",
              description:
                error?.response?.data?.message ||
                "Failed to clock in staff member",
            });
          },
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!companyId || !staffId) {
      toast({
        title: "Error",
        description: "Missing required parameters: company ID and staff ID",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await checkOut({
        company_id: companyId,
        staff_id: staffId,
      });

      setAttendanceStatus((prev) => ({
        ...prev,
        is_checked_in: false,
        last_check_out: response.check_out_time || new Date().toISOString(),
      }));

      toast({
        title: "Success",
        description:
          response.message || "You have successfully clocked out",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to clock out",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
              Authentication Required
            </h1>
            <p className="text-center text-red-600 mb-6">{authError}</p>
            <p className="text-center text-gray-600 text-sm">
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (attendanceLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading attendance status...</p>
          </div>
        </div>
      </div>
    );
  }

  const isCheckedIn = attendanceStatus?.is_checked_in ?? false;
  const isCheckedOut = attendanceStatus?.status === "CHECKED_OUT";
  const lastCheckIn = attendanceStatus?.last_check_in;
  const lastCheckOut = attendanceStatus?.last_check_out;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex justify-center mb-4">
            <Clock className="w-16 h-16 text-purple-700" />
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Attendance Tracking
          </h1>
          <p className="text-center text-gray-500 mb-6">
            Staff ID: {staffId?.slice(0, 8)}... | Company: {companyId?.slice(0, 8)}...
          </p>

          {/* Status Display */}
          <div
            className={`rounded-lg p-4 text-center mb-6 ${
              isCheckedOut
                ? "bg-blue-50 border-2 border-blue-200"
                : isCheckedIn
                ? "bg-green-50 border-2 border-green-200"
                : "bg-orange-50 border-2 border-orange-200"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                isCheckedOut
                  ? "text-blue-700"
                  : isCheckedIn
                  ? "text-green-700"
                  : "text-orange-700"
              }`}
            >
              {isCheckedOut
                ? "✔️ Ended work for today"
                : isCheckedIn
                ? "✓ Checked In"
                : "Not Checked In"}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {attendanceLoading
                ? "Loading attendance status..."
                : isCheckedOut
                ? attendanceStatus?.last_check_out
                  ? `Checked out: ${new Date(
                      attendanceStatus.last_check_out
                    ).toLocaleTimeString()}`
                  : "Work ended for today"
                : isCheckedIn && attendanceStatus?.check_in_time
                ? `Clocked in: ${attendanceStatus.check_in_time}`
                : "Ready to start work"}
            </p>
          </div>

          {/* Time Information */}
          {(lastCheckIn || lastCheckOut) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
              {lastCheckIn && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Last Check-in:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(lastCheckIn).toLocaleString()}
                  </span>
                </div>
              )}
              {lastCheckOut && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Check-out:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(lastCheckOut).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={isCheckedOut ? undefined : isCheckedIn ? handleCheckOut : handleCheckIn}
            disabled={isCheckedOut || loading || isClockingIn}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${
              isCheckedOut
                ? "bg-gray-400 cursor-not-allowed"
                : isCheckedIn
                ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                : "bg-green-600 hover:bg-green-700 disabled:bg-green-400"
            } ${loading || isClockingIn ? "cursor-not-allowed opacity-75" : ""}`}
          >
            {isCheckedOut ? (
              <span>Completed</span>
            ) : loading || isClockingIn ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>
                  {isCheckedIn ? "Clocking Out..." : "Clocking In..."}
                </span>
              </>
            ) : (
              <>
                {isCheckedIn ? (
                  <>
                    <LogOut className="w-5 h-5" />
                    <span>Clock Out</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Clock In</span>
                  </>
                )}
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 text-center">
              ✓ Authenticated: {user?.email} | Company ID: {user?.id?.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-600">
          <p>Current Time: {new Date().toLocaleTimeString()}</p>
          <p className="mt-2 text-xs">
            This is a secure attendance tracking system
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClockIn;
