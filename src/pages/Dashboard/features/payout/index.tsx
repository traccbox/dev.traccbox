import React from "react";
import { useLocation } from "react-router-dom";
import PayoutDashboard, { PayoutTab } from "./PayoutDashboard";

const PayoutFeature: React.FC = () => {
  const location = useLocation();

  let tab: PayoutTab = "board";
  if (location.pathname.includes("/payslip")) tab = "payslip";
  else if (location.pathname.endsWith("/sites")) tab = "sites";
  else if (location.pathname.endsWith("/workers")) tab = "workers";
  else if (location.pathname.endsWith("/attendance")) tab = "attendance";
  else if (location.pathname.endsWith("/clock-in-portal") || location.pathname.endsWith("/clockin")) tab = "clockin";

  return <PayoutDashboard initialTab={tab} />;
};

export default PayoutFeature;
