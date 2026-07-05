import { UserRound } from "lucide-react";
import React from "react";

type CardDashboardType = {
  title: string;
  numValue: number;
  percent: number;
  icon: React.ReactNode;
  index: number;
};

export default function CardDashboard({
  index,
  icon,
  percent,
  numValue,
  title,
}: CardDashboardType) {
  return (
    <div className="h-[150px] lg:h-[220px] rounded-2xl relative text-white overflow-hidden  flex flex-col items-start justify-start ">
      <div className="w-full h-full pt-5 px-5 pb-2  flex flex-col justify-start items-start absolute top-0 left-0 right-0 bottom-0 z-20 m-auto">
        <div>
          <p className="font-medium">{title}</p>
          <h1 className="text-3xl md:text-4xl">{numValue}</h1>
        </div>
        <p className="mt-auto relative z-99 font-medium">
          +{percent}% from last week
        </p>
      </div>

      {/* Icon top-right */}
      <div className="bg-white/95 z-10 w-[50px] text-[#0526FF] h-[50px] rounded-full absolute top-5 right-5 flex justify-center items-center ">
        {icon}
      </div>

      {/* Background */}
      <div
        style={{
          backgroundColor: index % 2 === 0 ? "#7001FF" : "#0526FF",
        }}
        className="bg-blue-400 w-full h-full absolute top-0 left-0 z-[5]"
      ></div>

      {/* chart image */}
      <img
        className="absolute w-full bottom-0 left-0 right-0 z-[7] "
        src={`assets/chart ${index}.svg`}
        alt="chart"
      />
    </div>
  );
}
