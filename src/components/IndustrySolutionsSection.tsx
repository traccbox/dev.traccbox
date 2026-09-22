import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Check,
  ClipboardList,
  Clock,
  LogIn,
  MapPinned,
  Medal,
  Route,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Store,
  Timer,
  Trophy,
  Truck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import constructionImage from "@/assets/industry-construction.jpg";
import logisticsImage from "@/assets/industry-logistics.jpg";
import fintechImage from "@/assets/industry-fintech.jpg";

type IndustryKey = "construction" | "logistics" | "field-sales";

type Industry = {
  key: IndustryKey;
  shortLabel: string;
  title: string;
  eyebrow: string;
  description: string;
  value: string;
  image: string;
  imageAlt: string;
  Icon: typeof Building2;
  features: Array<{ title: string; description: string; Icon: typeof Building2 }>;
};

const industries: Industry[] = [
  {
    key: "construction",
    shortLabel: "Construction & Security",
    title: "Keep every site, shift and worker accountable",
    eyebrow: "Construction & Security",
    description:
      "A workforce management solution for site-based workers, security personnel and temporary staff across multiple locations.",
    value: "Site attendance, workforce verification, working-hour tracking, compliance and daily payment records.",
    image: constructionImage,
    imageAlt: "Security guard verifying worker check-in with a phone at a construction site entrance",
    Icon: Building2,
    features: [
      {
        title: "Digital Clock-In & Clock-Out",
        description: "Record staff arrival and departure times directly from approved work locations.",
        Icon: LogIn,
      },
      {
        title: "Geofencing & Site Validation",
        description: "Employees can only clock in and out within designated sites, facilities or security locations.",
        Icon: MapPinned,
      },
      {
        title: "Automated Staff ID & Unique QR Code",
        description: "Digital staff IDs with unique QR codes for quick identification and attendance verification.",
        Icon: BadgeCheck,
      },
      {
        title: "Late & Absence Monitoring",
        description: "Automatically identify late arrivals, missed shifts and absent staff.",
        Icon: ShieldAlert,
      },
      {
        title: "On-the-Day Staff Registration",
        description: "Register new or temporary workers on-site and instantly generate their profile and QR code.",
        Icon: UserPlus,
      },
      {
        title: "End-of-Day Payslip / Earnings Summary",
        description: "Daily earnings summary based on approved attendance, working hours and payment rules.",
        Icon: Wallet,
      },
      {
        title: "Working Hours Calculation",
        description: "Automatically calculate the total number of hours each worker spends on-site.",
        Icon: Timer,
      },
      {
        title: "Attendance & Payroll Data",
        description: "Structured attendance records that support payroll calculations, deductions and reporting.",
        Icon: ClipboardList,
      },
    ],
  },
  {
    key: "logistics",
    shortLabel: "Logistics & Delivery",
    title: "Move teams and deliveries with total visibility",
    eyebrow: "Logistics, Distribution, Delivery & Supply Chain",
    description:
      "An operational tracking solution for drivers, riders and field personnel that improves delivery efficiency and task execution.",
    value: "Route efficiency, task execution, driver/rider accountability, route compliance and performance improvement.",
    image: logisticsImage,
    imageAlt: "Logistics coordinator tracking delivery routes on a tablet at a distribution warehouse",
    Icon: Truck,
    features: [
      {
        title: "Digital Clock-In & Clock-Out",
        description: "Track when drivers, riders and operational staff begin and end their shifts.",
        Icon: LogIn,
      },
      {
        title: "Route Optimization",
        description: "Recommend efficient routes to reduce travel time and optimize daily operations.",
        Icon: Route,
      },
      {
        title: "Task Assignment & Completion Tracking",
        description: "Assign deliveries, pickups or tasks and monitor completion status in real time.",
        Icon: ClipboardList,
      },
      {
        title: "KPI & Task Performance Tracking",
        description: "Measure completed tasks, delivery volumes, completion rates and other operational KPIs.",
        Icon: BarChart3,
      },
      {
        title: "Route Violation Monitoring",
        description: "Identify deviations from assigned or approved routes and improve route compliance.",
        Icon: ShieldAlert,
      },
      {
        title: "Performance-Based Gamification",
        description: "Leaderboards, badges and performance rankings to motivate drivers and riders.",
        Icon: Trophy,
      },
      {
        title: "Operational Performance Insights",
        description: "Visibility into individual and team performance for better decision-making.",
        Icon: BarChart3,
      },
    ],
  },
  {
    key: "field-sales",
    shortLabel: "Fintech, FMCG & Telecoms",
    title: "Turn field activity into market growth",
    eyebrow: "Fintech, FMCG & Telecommunications",
    description:
      "A field workforce and market execution solution for sales representatives, agents, promoters and field teams across territories.",
    value: "Field workforce management, territory coverage, market execution, lead/customer acquisition and KPI tracking.",
    image: fintechImage,
    imageAlt: "Field sales representatives and telecom agents working with retailers in a busy market",
    Icon: Store,
    features: [
      {
        title: "Automated Staff ID & Unique QR Code",
        description: "Employee or agent profiles with unique QR codes for identification and workforce management.",
        Icon: BadgeCheck,
      },
      {
        title: "Market & Regional Geofencing",
        description: "Digital boundaries around markets, territories, regions or assigned operating locations.",
        Icon: MapPinned,
      },
      {
        title: "Staff Assignment by Market or Region",
        description: "Assign sales reps, agents or field workers to specific markets, territories or regions.",
        Icon: Users,
      },
      {
        title: "Lead & Customer Generation",
        description: "Capture and manage leads, prospects or customers generated by field teams.",
        Icon: UserPlus,
      },
      {
        title: "Gamification & Leaderboards",
        description: "Motivate field teams through badges, rankings and performance-based recognition.",
        Icon: Medal,
      },
      {
        title: "KPI & Performance Tracking",
        description: "Track sales, customer acquisition, lead generation, market visits and task completion.",
        Icon: BarChart3,
      },
      {
        title: "Market Execution Visibility",
        description: "Manager visibility into field activities and performance across markets, regions and teams.",
        Icon: Smartphone,
      },
    ],
  },
];

const IndustrySolutionsSection = () => {
  const [activeKey, setActiveKey] = useState<IndustryKey>("construction");
  const activeIndustry =
    industries.find((industry) => industry.key === activeKey) ?? industries[0];

  return (
    <section id="industries" className="scroll-mt-16 overflow-hidden bg-background py-20 md:scroll-mt-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-traccbox-500">
            Built for work in the real world
          </p>
          <h2 className="text-3xl font-bold leading-tight text-foreground md:text-5xl">
            One platform. Solutions shaped for your industry.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            TraccBox connects workforce tracking, operational visibility and performance
            management to the way your teams actually work.
          </p>
        </div>

        <div className="mb-7 grid gap-3 md:grid-cols-3" role="tablist" aria-label="Industry solutions">
          {industries.map((industry) => {
            const isActive = industry.key === activeKey;
            return (
              <Button
                key={industry.key}
                type="button"
                variant="outline"
                role="tab"
                aria-selected={isActive}
                aria-controls={`industry-panel-${industry.key}`}
                onClick={() => setActiveKey(industry.key)}
                className={`h-auto min-h-16 justify-start gap-3 whitespace-normal rounded-lg px-4 py-3 text-left transition-all md:justify-center ${
                  isActive
                    ? "border-traccbox-500 bg-traccbox-500 text-primary-foreground shadow-lg hover:bg-traccbox-600 hover:text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-traccbox-300 hover:bg-accent"
                }`}
              >
                <industry.Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="font-semibold">{industry.shortLabel}</span>
              </Button>
            );
          })}
        </div>

        <div
          id={`industry-panel-${activeIndustry.key}`}
          role="tabpanel"
          className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        >
          <div className="relative min-h-[310px] overflow-hidden md:min-h-[420px]">
            {industries.map((industry) => (
              <img
                key={industry.key}
                src={industry.image}
                alt={industry.imageAlt}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                  industry.key === activeKey ? "opacity-100" : "opacity-0"
                }`}
                loading="lazy"
                width={1536}
                height={896}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-traccbox-900 via-traccbox-900/25 to-transparent" />
            <img
              src="/assets/logo.png"
              alt="TraccBox"
              className="absolute left-5 top-5 h-auto w-32 rounded-md bg-background/90 p-2 shadow-lg backdrop-blur-sm md:left-8 md:top-8 md:w-40"
              loading="lazy"
              width={256}
              height={75}
            />
            <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground md:p-9">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold text-traccbox-700 shadow-sm backdrop-blur-sm">
                <activeIndustry.Icon className="h-4 w-4" aria-hidden="true" />
                {activeIndustry.eyebrow}
              </div>
              <p className="max-w-2xl text-lg font-semibold leading-snug md:text-2xl">
                {activeIndustry.value}
              </p>
            </div>
          </div>

          <div className="grid gap-10 p-5 md:p-9 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <h3 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
                {activeIndustry.title}
              </h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {activeIndustry.description}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button className="w-full gap-2 bg-traccbox-500 px-6 text-primary-foreground hover:bg-traccbox-600">
                    Start free trial <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Button asChild variant="outline" className="w-full border-traccbox-200 text-traccbox-700 sm:w-auto">
                  <a href="#contact">Talk to our team</a>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {activeIndustry.features.map((feature) => (
                <div key={feature.title} className="flex gap-3 rounded-lg bg-muted/70 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-traccbox-50 text-traccbox-600">
                    <feature.Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-start gap-2">
                      <h4 className="font-semibold text-foreground">{feature.title}</h4>
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-traccbox-500" aria-hidden="true" />
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm font-semibold text-traccbox-700">
          Every activity visible. Every result measurable.
        </p>
      </div>
    </section>
  );
};

export default IndustrySolutionsSection;
