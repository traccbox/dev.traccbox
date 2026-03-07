import React from "react";
import { getStaffAnalytics } from "@/api/dashboard-overview/overview";
import { useAuth } from "@/components/auth/AuthProvider";
import CardDashboard from "@/components/ui/CardDashboard";
import CardReps, { CardRepsType } from "@/components/ui/CardReps";
import Spinner from "@/components/ui/Spinner";
import { useQuery } from "@tanstack/react-query";
import {
  CircleArrowRight,
  DollarSign,
  MapPin,
  Medal,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import LocationTracking, { MapCard } from "./features/gps/LocationTracking";
import { useLocationTrackingContext } from "@/contexts/LocationTrackingContext";
import { useStaffData } from "@/api/settingsApi/hooks/useStaffData";

// import {MapContainer} from "leaflet"

export default function Home() {
  const { user } = useAuth();
  const companyId = user?.id || null;

  const { data: analytics, isLoading: isFetchingAnalytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => getStaffAnalytics(user?.id),
  });

  console.log(analytics, "analytics");

  const { staffLocations } = useLocationTrackingContext();

  const { data: staffData } = useStaffData(companyId || "");
  console.log("All company staff", staffData);

  console.log("Staff==", staffLocations);
  const ob = staffLocations || {};
  const id = Object.keys(ob)[0];

  //staff info mapping
  const staffInfo = React.useMemo(() => {
    const info: Record<
      string,
      { name: string; role?: string; jobTitle?: string; department?: string }
    > = {};
    if (staffData) {
      console.log("Staff Data: ==", staffData);
      const staffArray = Array.isArray(staffData) ? staffData : [];
      staffArray.forEach(
        (staff: {
          id: string;
          full_name: string;
          role?: string;
          job_title?: string;
          department?: string;
        }) => {
          if (staff.id && staff.full_name) {
            info[staff.id] = {
              name: staff.full_name,
              role: staff.role || undefined,
              jobTitle: staff.job_title || undefined,
              department: staff.department || undefined,
            };
          }
        },
      );
    }
    return info;
  }, [staffData]);

  const {
    total_active_staffs = 0,
    total_daily_checkins = 0,
    task_stats: { weekly_task_set = 0, weekly_task_completed = 0 } = {},
    top_5_staffs = [],
  } = analytics ?? {};

  return isFetchingAnalytics ? (
    <div className="w-full bg-slate-200 h-screen flex justify-center items-center">
      <Spinner />
    </div>
  ) : (
    <>
      <section className="w-full   gap-5 grid md:grid-cols-4 grid-2 ">
        <CardDashboard
          title={"Total Active Reps"}
          numValue={total_active_staffs}
          percent={12}
          icon={<UserRound />}
          index={1}
        />
        <CardDashboard
          title={"Daily Check-ins"}
          numValue={total_daily_checkins}
          percent={8}
          icon={<MapPin />}
          index={2}
        />
        <CardDashboard
          title={"Weekly Sales Summary"}
          numValue={weekly_task_completed}
          percent={15}
          icon={<DollarSign />}
          index={1}
        />
        <CardDashboard
          title={"Weekly Task Set"}
          numValue={weekly_task_set}
          percent={3}
          icon={<Medal />}
          index={2}
        />
      </section>

      <section className="w-full h-auto grid grid-cols-1  md:grid-cols-[65%_35%] gap-5 md:pr-5 items-center mt-7  ">
        {/* Map Container */}
        <div className="w-full h-full py-5 px-4 bg-white rounded-2xl">
          <div className="w-full flex justify-between items-center">
            <h3 className="text-xl md:text-3xl flex justify-start items-center gap-2">
              <MapPin /> Check-in Heat Map
            </h3>
            <Link
              to="/dashboard/location-tracking"
              className="text-[#005BBF] flex justify-center items-center gap-1 hover:underline underline-offset-2 transition-all duration-500 text-sm font-medium"
            >
              View All
              <CircleArrowRight size={14} />
            </Link>
          </div>

          <div className="">
            <MapCard
              showAll={true}
              staffInfo={staffInfo}
              staffLocations={staffLocations}
              selectedStaffId={null}
              title={false}
            />
          </div>
        </div>

        {/* List of Reps Container  */}
        <div className="w-full h-full flex flex-col items-start justify-start py-5 px-4 bg-white rounded-2xl">
          <div className="w-full flex mb-3 justify-between items-center">
            <h3 className="text-xl">Top 5 Reps</h3>
            <Link
              to=""
              className="text-[#005BBF] flex justify-center items-center gap-1 hover:underline underline-offset-2 transition-all duration-500 text-sm font-medium"
            >
              View All
              <CircleArrowRight size={14} />
            </Link>
          </div>

          {top_5_staffs.map(
            ({
              full_name,
              rating,
              staff_id,
              completion_percentage,
            }: CardRepsType) => (
              <CardReps
                key={staff_id}
                full_name={full_name}
                staff_id={staff_id}
                completion_percentage={Math.round(completion_percentage)}
                rating={rating}
              />
            ),
          )}
        </div>
      </section>
    </>
  );
}
