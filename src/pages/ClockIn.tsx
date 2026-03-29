import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Clock, LogIn, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { AttendanceStatus } from "@/api/types";

// Mock data for demo
const mockAttendanceStatus: AttendanceStatus = {
  staff_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  company_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  is_checked_in: false,
  last_check_in: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  last_check_out: new Date(Date.now() - 83400000).toISOString(), // Yesterday
  check_in_time: undefined,
};

const ClockIn: React.FC = () => {
  const { staffId, companyId } = useParams<{
    staffId: string;
    companyId: string;
  }>();

  const { toast } = useToast();
  const [attendanceStatus, setAttendanceStatus] =
    useState<AttendanceStatus>(mockAttendanceStatus);
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    setLoading(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setAttendanceStatus((prev) => ({
        ...prev,
        is_checked_in: true,
        last_check_in: new Date().toISOString(),
        check_in_time: new Date().toLocaleTimeString(),
      }));

      toast({
        title: "Success",
        description: "You have successfully clocked in",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setAttendanceStatus((prev) => ({
        ...prev,
        is_checked_in: false,
        last_check_out: new Date().toISOString(),
      }));

      toast({
        title: "Success",
        description: "You have successfully clocked out",
      });
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = attendanceStatus.is_checked_in ?? false;
  const lastCheckIn = attendanceStatus.last_check_in;
  const lastCheckOut = attendanceStatus.last_check_out;

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
            Staff ID: {staffId?.slice(0, 8)}... | Demo Mode
          </p>

          {/* Status Display */}
          <div
            className={`rounded-lg p-4 text-center mb-6 ${
              isCheckedIn
                ? "bg-green-50 border-2 border-green-200"
                : "bg-orange-50 border-2 border-orange-200"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                isCheckedIn ? "text-green-700" : "text-orange-700"
              }`}
            >
              {isCheckedIn ? "✓ Checked In" : "Not Checked In"}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {isCheckedIn && attendanceStatus.check_in_time
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
            onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${
              isCheckedIn
                ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                : "bg-green-600 hover:bg-green-700 disabled:bg-green-400"
            } ${loading ? "cursor-not-allowed opacity-75" : ""}`}
          >
            {loading ? (
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

          {/* Demo Notice */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 text-center">
              🔷 Using Mock Data for Demo - API Integration Coming Soon
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
