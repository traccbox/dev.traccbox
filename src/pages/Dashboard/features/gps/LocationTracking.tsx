import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocationTrackingContext } from "@/contexts/LocationTrackingContext";
import { useStaffData } from "@/api/settingsApi/hooks/useStaffData";
import LocationMap from "@/components/maps/LocationMap";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, Users, Wifi, WifiOff, RefreshCw } from "lucide-react";

const LocationTracking: React.FC = () => {
  const { user } = useAuth();
  const companyId = user?.id || null;
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(true);

  const {
    staffLocations,
    isConnected,
    error,
    requestAllStaff,
    requestSingleStaff,
  } = useLocationTrackingContext();

  // Request all staff locations when component mounts
  useEffect(() => {
    if (isConnected) {
      console.log("🔌 WebSocket Connected - Requesting all staff locations");
      requestAllStaff();
    }
  }, [isConnected, requestAllStaff]);

  // Log location updates
  useEffect(() => {
    if (Object.keys(staffLocations).length > 0) {
      console.log("📍 Staff Locations Updated:", {
        total: Object.keys(staffLocations).length,
        locations: staffLocations,
      });
    }
  }, [staffLocations]);

  const { data: staffData, isLoading: staffLoading } = useStaffData(
    companyId || "",
  );
  console.log("=====", staffData);

  // Log staff data when it loads
  useEffect(() => {
    if (staffData) {
      console.log("📋 Staff Data Loaded:", staffData);
      if (staffData) {
        console.log(
          "👥 Total Staff Count:",
          Array.isArray(staffData) ? staffData.length : 0,
        );
      }
    }
  }, [staffData]);

  // Create staff info mapping (name, role, etc.)
  const staffInfo = useMemo(() => {
    interface StaffMember {
      id: string;
      full_name: string;
      role?: string;
      job_title?: string;
      department?: string;
    }

    const info: Record<
      string,
      { name: string; role?: string; jobTitle?: string; department?: string }
    > = {};
    if (staffData) {
      const staffArray = Array.isArray(staffData) ? staffData : [];
      staffArray.forEach((staff: StaffMember) => {
        if (staff.id && staff.full_name) {
          info[staff.id] = {
            name: staff.full_name,
            role: staff.role || undefined,
            jobTitle: staff.job_title || undefined,
            department: staff.department || undefined,
          };
        }
      });
      console.log("🗺️ Staff Info Mapping Created:", info);
    }
    return info;
  }, [staffData]);

  // Get list of staff with locations for dropdown
  const staffWithLocations = useMemo(() => {
    const staffList = Object.keys(staffLocations).map((staffId) => {
      const info = staffInfo[staffId];
      return {
        id: staffId,
        name: info?.name || staffId,
        role: info?.role,
        jobTitle: info?.jobTitle,
        department: info?.department,
        displayName: info
          ? `${info.name}${info.role ? ` - ${info.role}` : ""}${
              info.jobTitle ? ` (${info.jobTitle})` : ""
            }`
          : staffId,
      };
    });
    console.log("📍 Staff with Locations:", staffList);
    return staffList;
  }, [staffLocations, staffInfo]);

  // Handle staff selection
  const handleStaffSelect = (staffId: string) => {
    const selectedStaff = staffInfo[staffId];
    console.log("👤 Staff Selected:", {
      staffId,
      name: selectedStaff?.name || staffId,
      role: selectedStaff?.role,
      action: "get_one",
    });
    setSelectedStaffId(staffId);
    setShowAll(false);
    if (staffId) {
      console.log("📤 Sending WebSocket request for single staff:", {
        action: "get_one",
        staff_id: staffId,
      });
      requestSingleStaff(staffId);
    }
  };

  // Handle show all toggle
  const handleShowAll = (checked: boolean) => {
    console.log("🔄 Show All Toggle:", checked);
    setShowAll(checked);
    if (checked) {
      setSelectedStaffId(null);
      console.log("📤 Sending WebSocket request for all staff:", {
        action: "get_all",
      });
      requestAllStaff();
    }
  };

  // Get visible locations count
  const visibleLocationsCount = showAll
    ? Object.keys(staffLocations).length
    : selectedStaffId && staffLocations[selectedStaffId]
      ? 1
      : 0;

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert>
          <AlertDescription>
            Company ID not found. Please ensure you are logged in.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Location Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your staff locations in real-time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className="flex items-center gap-2"
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Disconnected
              </>
            )}
          </Badge>
          {!isConnected && (
            <Button
              onClick={requestAllStaff}
              size="sm"
              variant="outline"
              disabled
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnecting...
            </Button>
          )}
        </div>
      </div>

      {/* Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Controls</CardTitle>
          <CardDescription>
            Select a staff member or view all locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 w-full md:w-auto">
              <Label htmlFor="staff-select" className="mb-2 block">
                Select Staff Member
              </Label>
              <Select
                value={selectedStaffId || ""}
                onValueChange={handleStaffSelect}
                disabled={showAll || staffLoading}
              >
                <SelectTrigger
                  id="staff-select"
                  className="w-full md:w-[300px]"
                >
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffWithLocations.length > 0 ? (
                    staffWithLocations.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.displayName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-staff" disabled>
                      No staff with locations available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-all"
                checked={showAll}
                onCheckedChange={handleShowAll}
              />
              <Label htmlFor="show-all" className="cursor-pointer">
                Show All Staff
              </Label>
            </div>

            <Button
              onClick={() => {
                console.log(
                  "🔄 Manual Refresh All - Requesting all staff locations",
                );
                requestAllStaff();
              }}
              variant="outline"
              size="sm"
              disabled={!isConnected}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(staffLocations).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Visible Locations
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visibleLocationsCount}</div>
            <p className="text-xs text-muted-foreground">Displayed on map</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection</CardTitle>
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isConnected ? "Active" : "Inactive"}
            </div>
            <p className="text-xs text-muted-foreground">Tracking status</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Map Card */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Location Map</CardTitle>
          <CardDescription>
            {showAll
              ? "Showing all staff locations"
              : selectedStaffId
              ? `Showing location for ${
                  staffInfo[selectedStaffId]?.name || selectedStaffId
                }`
              : "Select a staff member or enable 'Show All' to view locations"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(staffLocations).length === 0 &&
          !showAll &&
          !selectedStaffId ? (
            <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/50">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No locations to display. Select a staff member or enable "Show
                  All".
                </p>
              </div>
            </div>
          ) : (
            <LocationMap
              staffLocations={staffLocations}
              selectedStaffId={selectedStaffId}
              showAll={showAll}
              height="600px"
              staffNames={Object.fromEntries(
                Object.entries(staffInfo).map(([id, info]) => [id, info.name])
              )}
              staffInfo={staffInfo}
            />
          )}
        </CardContent>
      </Card> */}
      <MapCard
        showAll={showAll}
        staffInfo={staffInfo}
        staffLocations={staffLocations}
        selectedStaffId={selectedStaffId}
        title={true}
      />

      {/* Loading State */}
      {staffLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Loading staff data...
          </span>
        </div>
      )}
    </div>
  );
};

export const MapCard = ({
  showAll = true,
  selectedStaffId = null,
  staffInfo,
  staffLocations,
  title = false,
}) => {
  console.log(staffInfo, "staff op", );
  console.log(staffLocations, "staff lo", );

  return (
    <Card>
      <CardHeader>
        {title && (
          <>
            <CardTitle>Location Map</CardTitle>
            <CardDescription>
              {showAll
                ? "Showing all staff locations"
                : selectedStaffId
                  ? `Showing location for ${
                      staffInfo[selectedStaffId]?.name || selectedStaffId
                    }`
                  : "Select a staff member or enable 'Show All' to view locations"}
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent>
        {Object.keys(staffLocations).length === 0 &&
        !showAll &&
        !selectedStaffId ? (
          <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/50">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No locations to display. Select a staff member or enable "Show
                All".
              </p>
            </div>
          </div>
        ) : (
          <LocationMap
            staffLocations={staffLocations}
            selectedStaffId={selectedStaffId}
            showAll={showAll}
            height="600px"
            staffNames={Object.fromEntries(
              Object.entries(staffInfo).map(([id, info]) => [id, (info as any)?.name]),
            )}
            staffInfo={staffInfo}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default LocationTracking;
