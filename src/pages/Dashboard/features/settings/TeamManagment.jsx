import React from "react";
import {
  Search,
  Plus,
  Trash2,
  Clock,
  QrCode,
  FileText,
  Shield,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../../components/auth/AuthProvider";
import { useStaffData } from "../../../../api/settingsApi/hooks/useStaffData";
import { deleteStaff } from "../../../../api/auth";
import { useToast } from "../../../../components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { QRCodeModal } from "./components/QRCodeModal";
import { IDCardModal } from "./components/IDCardModal";
import { useStaffQRCode } from "../../../../api/settingsApi/hooks/useQRCode";
import EditPermissionsDrawer from "../../../../components/permissions/EditPermissionsDrawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";

// Helper function to generate initials from full name
const getInitials = (fullName) => {
  if (!fullName) return "";
  const names = fullName.split(" ");
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return fullName[0].toUpperCase();
};

// Helper function to handle attendance data
const getAttendanceStatus = (attendanceRecords) => {
  if (!attendanceRecords || attendanceRecords.length === 0) return null;

  const todayRecord = attendanceRecords.find(
    (record) =>
      record.attendance_date === new Date().toISOString().split("T")[0],
  );

  if (!todayRecord) return null;

  return {
    isCheckedIn: !!todayRecord.check_in_time,
    isCheckedOut: !!todayRecord.check_out_time,
    checkInTime: todayRecord.check_in_time
      ? new Date(todayRecord.check_in_time)
      : null,
    checkOutTime: todayRecord.check_out_time
      ? new Date(todayRecord.check_out_time)
      : null,
  };
};

// Helper function to format time
const formatTime = (date) => {
  if (!date) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const TeamManagement = () => {
  const { user, staff } = useAuth();
  const companyId = staff?.company_id ?? user?.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedMember, setSelectedMember] = React.useState(null);
  const [showQRModal, setShowQRModal] = React.useState(false);
  const [showIDCardModal, setShowIDCardModal] = React.useState(false);
  const [memberQRCodeData, setMemberQRCodeData] = React.useState(null);
  const [permissionsMember, setPermissionsMember] = React.useState(null);
  const [memberToDelete, setMemberToDelete] = React.useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = React.useState("");
  const [deletingMemberId, setDeletingMemberId] = React.useState(null);

  // Get QR code data for the selected member
  const { data: qrCodeData } = useStaffQRCode(
    companyId,
    selectedMember?.id,
    "json",
    undefined,
  );

  React.useEffect(() => {
    if (qrCodeData) {
      setMemberQRCodeData(qrCodeData);
    }
  }, [qrCodeData]);

  const handleOpenQRModal = (member) => {
    setSelectedMember(member);
    setShowQRModal(true);
  };

  const handleOpenIDCardModal = (member) => {
    setSelectedMember(member);
    setShowIDCardModal(true);
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setSelectedMember(null);
    setMemberQRCodeData(null);
  };

  const handleCloseIDCardModal = () => {
    setShowIDCardModal(false);
    setSelectedMember(null);
  };

  const handleDeleteMember = async () => {
    const member = memberToDelete;
    if (!member) return;

    if (!companyId) {
      toast({
        title: "Could not delete staff",
        description: "Your company account could not be identified.",
        variant: "destructive",
      });
      return;
    }

    setDeletingMemberId(member.id);
    try {
      const response = await deleteStaff({
        company_id: companyId,
        staff_id: member.id,
        permissions: member.permissions || {},
      });
      if (Array.isArray(response.remaining_staffs)) {
        queryClient.setQueryData(["staff", companyId], (previousMembers) =>
          response.remaining_staffs
            .filter((remainingMember) => remainingMember.id !== member.id)
            .map((remainingMember) => {
              const existingMember = Array.isArray(previousMembers)
                ? previousMembers.find(
                    (previousMember) =>
                      previousMember.id === remainingMember.id,
                  )
                : undefined;
              return { ...existingMember, ...remainingMember };
            }),
        );
      } else {
        await queryClient.invalidateQueries({ queryKey: ["staff", companyId] });
      }
      if (permissionsMember?.id === member.id) {
        setPermissionsMember(null);
      }
      setMemberToDelete(null);
      setDeleteSuccessMessage(
        response.message ||
          `${member.full_name || "The staff member"} was removed from your team.`,
      );
    } catch (deleteError) {
      toast({
        title: "Could not delete staff",
        description:
          deleteError?.response?.data?.detail ||
          deleteError?.message ||
          "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingMemberId(null);
    }
  };
  const {
    data: teamMembers = [],
    isLoading,
    isError,
    error,
  } = useStaffData(companyId);

  // Filter team members based on search query
  const filteredTeamMembers = React.useMemo(() => {
    if (!searchQuery.trim()) return teamMembers;

    const searchTerms = searchQuery.toLowerCase().trim().split(" ");
    return teamMembers.filter((member) => {
      const searchableFields = [
        member.full_name?.toLowerCase(),
        member.email?.toLowerCase(),
        member.department?.toLowerCase(),
        member.role?.toLowerCase(),
        member.job_title?.toLowerCase(),
      ].filter(Boolean);

      return searchTerms.every((term) =>
        searchableFields.some((field) => field.includes(term)),
      );
    });
  }, [teamMembers, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500">
        <p>
          Error loading team members: {error?.message || "Something went wrong"}
        </p>
      </div>
    );
  }
  // Don't delete this static data, it might be useful for testing or fallback
  const StaticteamMembers = [
    {
      id: 1,
      name: "Victor Moses",
      email: "victormoses2b@gmail.com",
      role: "Admin",
      department: "Management",
      isActive: true,
      has2FA: true,
      lastLogin: "2 hours ago",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 2,
      name: "Vicky Jen",
      email: "victormoses2b@gmail.com",
      role: "Manager",
      department: "Sales",
      isActive: true,
      has2FA: true,
      lastLogin: "1 day ago",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 3,
      name: "Victor Moses",
      email: "victormoses2b@gmail.com",
      role: "Sales",
      department: "Sales",
      isActive: true,
      has2FA: true,
      lastLogin: "2 hours ago",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 4,
      name: "Victor Moses",
      email: "victormoses2b@gmail.com",
      role: "View only",
      department: "Support",
      isActive: true,
      has2FA: true,
      lastLogin: "2 hours ago",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 5,
      name: "Victor Moses",
      email: "victormoses2b@gmail.com",
      role: "Admin",
      department: "Management",
      isActive: true,
      has2FA: true,
      lastLogin: "2 hours ago",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 6,
      name: "Vicky Jen",
      email: "victormoses2b@gmail.com",
      role: "Manager",
      department: "Sales",
      isActive: true,
      has2FA: true,
      lastLogin: "1 day ago",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 7,
      name: "Victor Moses",
      email: "victormoses2b@gmail.com",
      role: "Sales",
      department: "Sales",
      isActive: true,
      has2FA: true,
      lastLogin: "2 hours ago",
      avatar:
        "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 8,
      name: "Victor Moses",
      email: "victormoses2b@gmail.com",
      role: "View only",
      department: "Support",
      isActive: true,
      has2FA: true,
      lastLogin: "2 hours ago",
      avatar:
        "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
    },
  ];

  // Calculate stats from real data
  const stats = {
    totalMembers: teamMembers.length,
    activeMembers: teamMembers.filter((member) => member.is_active).length,
    inactiveMembers: teamMembers.filter((member) => !member.is_active).length,
    verifiedMembers: teamMembers.filter((member) => member.accept_invitation)
      .length,
  };

  return (
    <div className="min-h-screen bg-gray-200 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Hello <span className="text-purple-600">Admin</span>!
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and view all your team members here.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, role, or department"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full sm:w-64"
                />
              </div>
              <button
                className=" hover:bg-purple-700 bg-black text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                onClick={() => navigate("/dashboard/settings/roles")}
              >
                <Plus className="w-4 h-4" />
                Add Staff
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {stats.totalMembers}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.totalMembers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.activeMembers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.inactiveMembers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.verifiedMembers}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="w-full">
          {filteredTeamMembers.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
              <Search className="w-12 h-12 mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No team members found</p>
              <p className="text-sm">
                {searchQuery
                  ? "Try adjusting your search terms or filters"
                  : "Start by adding team members to your organization"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
              {filteredTeamMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow relative"
                >
                  {/* Card Header */}
                  <div className="flex justify-center items-start mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center">
                      {member.profile_pic ? (
                        <img
                          src={member.profile_pic}
                          alt={member.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-purple-600">
                          {getInitials(member.full_name)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMemberToDelete(member)}
                      disabled={deletingMemberId !== null}
                      aria-label={`Delete ${member.full_name || "staff member"}`}
                      title="Delete staff"
                      className="text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors absolute top-4 right-4"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Member Info */}
                  <div className="mb-4 flex items-center flex-col">
                    <h3 className="font-semibold text-gray-900 text-base mb-1">
                      {member.full_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{member.email}</p>
                    <div className="flex items-center gap-2 mb-2 bg-black text-white py-1 rounded-full w-full justify-center ">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
                        {member.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{member.department}</p>
                    {member.job_title && (
                      <p className="text-xs text-gray-500 mt-1">
                        {member.job_title}
                      </p>
                    )}
                  </div>

                  {/* Status Indicators */}
                  <div className="flex items-center justify-between mb-3 border-b pb-2 border-gray-200">
                    <div className="flex items-center justify-between w-full gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 ${
                            member.is_active ? "bg-green-500" : "bg-gray-400"
                          } rounded-full`}
                        ></div>
                        <span
                          className={`text-xs ${
                            member.is_active
                              ? "text-green-600"
                              : "text-gray-600"
                          } font-medium`}
                        >
                          {member.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 ${
                            member.accept_invitation
                              ? "bg-purple-500"
                              : "bg-gray-400"
                          } rounded-full`}
                        ></div>
                        <span
                          className={`text-xs ${
                            member.accept_invitation
                              ? "text-purple-600"
                              : "text-gray-600"
                          } font-medium`}
                        >
                          {member.accept_invitation ? "Verified" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Status */}
                  {member.role.toLowerCase() === "sales_rep" ||
                    (member.role.toLowerCase() === "sales rep" && (
                      <div className="border-t border-gray-200 pt-3 mt-2">
                        <div className="flex flex-col items-center gap-2">
                          <h4 className="font-medium text-sm text-gray-700">
                            Today's Attendance 
                          </h4>
                          {(() => {
                            const attendance = getAttendanceStatus(
                              member.attendance_records,
                            );
                            if (!attendance) {
                              return (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 w-full text-center">
                                  <span className="text-sm text-yellow-700 font-medium">
                                    No attendance record for today
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <>
                                <div className="flex items-center gap-2 w-full justify-center">
                                  <div
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium w-full text-center ${
                                      attendance.isCheckedIn
                                        ? attendance.checkOutTime
                                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                                          : "bg-green-100 text-green-800 border border-green-200"
                                        : "bg-red-50 text-red-800 border border-red-200"
                                    }`}
                                  >
                                    {attendance.isCheckedIn
                                      ? attendance.checkOutTime
                                        ? "Shift Completed"
                                        : "Currently Working"
                                      : "Not Checked In"}
                                  </div>
                                </div>
                                {attendance.checkInTime && (
                                  <div className="bg-gray-50 rounded-lg p-2 w-full">
                                    <div className="flex flex-col items-center gap-1 text-sm">
                                      <div className="flex items-center gap-2 text-green-700">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="font-medium">
                                          Check-in:{" "}
                                          {formatTime(attendance.checkInTime)}
                                        </span>
                                      </div>
                                      {attendance.checkOutTime && (
                                        <div className="flex items-center gap-2 text-blue-700">
                                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                          <span className="font-medium">
                                            Check-out:{" "}
                                            {formatTime(
                                              attendance.checkOutTime,
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ))}

                  {/* QR Code & ID Card Buttons */}
                  <div className="border-t border-gray-200 pt-3 mt-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenQRModal(member)}
                        className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm border border-purple-200"
                      >
                        <QrCode className="w-4 h-4" />
                        QR Code
                      </button>
                      <button
                        onClick={() => handleOpenIDCardModal(member)}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm border border-blue-200"
                      >
                        <FileText className="w-4 h-4" />
                        ID Card
                      </button>
                    </div>
                    <button
                      onClick={() => setPermissionsMember(member)}
                      className="mt-2 w-full bg-gray-900 hover:bg-black text-white font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <Shield className="w-4 h-4" />
                      Manage Permissions
                    </button>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>
                      Joined: {new Date(member.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedMember && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={handleCloseQRModal}
          staff={selectedMember}
          company_id={companyId}
        />
      )}

      {/* ID Card Modal */}
      {selectedMember && (
        <IDCardModal
          isOpen={showIDCardModal}
          onClose={handleCloseIDCardModal}
          staff={selectedMember}
          company_id={companyId}
          companyName={user?.company_name}
          companyLogoUrl={user?.image_url || user?.profile_pic}
          qrCodeData={memberQRCodeData}
        />
      )}

      {/* Manage Permissions Drawer */}
      <EditPermissionsDrawer
        open={!!permissionsMember}
        onClose={() => setPermissionsMember(null)}
        companyId={companyId}
        staff={permissionsMember}
      />

      <AlertDialog
        open={!!memberToDelete}
        onOpenChange={(open) => {
          if (!open && deletingMemberId === null) {
            setMemberToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete staff member?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToDelete
                ? `This will permanently remove ${memberToDelete.full_name || "this staff member"} from your team.`
                : "This will permanently remove this staff member from your team."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingMemberId !== null}>
              Cancel
            </AlertDialogCancel>
            <button
              type="button"
              onClick={handleDeleteMember}
              disabled={deletingMemberId !== null}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {deletingMemberId !== null && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {deletingMemberId !== null ? "Deleting..." : "Delete staff"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteSuccessMessage}
        onOpenChange={(open) => {
          if (!open) setDeleteSuccessMessage("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center">
              Staff deleted successfully
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {deleteSuccessMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setDeleteSuccessMessage("")}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamManagement;
