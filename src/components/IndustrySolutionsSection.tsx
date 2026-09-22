import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  MapPinned,
  Route,
  ShieldCheck,
  Smartphone,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import industryImage from "@/assets/traccbox-industry-solutions.jpg";

type IndustryKey = "construction" | "logistics" | "field-sales";

type Industry = {
  key: IndustryKey;
  shortLabel: string;
  title: string;
  eyebrow: string;
  description: string;
  value: string;
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
      "Manage site-based teams, security personnel and temporary workers across multiple locations from one trusted view.",
    value: "Verified attendance, accurate work hours and payroll-ready records.",
    Icon: Building2,
    features: [
      {
        title: "Geofenced attendance",
        description: "Allow clock-in and clock-out only at approved sites.",
        Icon: MapPinned,
      },
      {
        title: "Digital staff ID",
        description: "Generate unique QR codes for fast on-site verification.",
        Icon: BadgeCheck,
      },
      {
        title: "Hours & earnings",
        description: "Calculate working hours and daily earnings summaries.",
        Icon: ShieldCheck,
      },
      {
        title: "Rapid registration",
        description: "Register temporary workers on the day they arrive.",
        Icon: Users,
      },
    ],
  },
  {
    key: "logistics",
    shortLabel: "Logistics & Delivery",
    title: "Move teams and deliveries with total visibility",
    eyebrow: "Logistics, Distribution & Supply Chain",
    description:
      "Coordinate drivers, riders and field personnel while improving route efficiency, task execution and daily accountability.",
    value: "Faster routes, stronger compliance and measurable delivery performance.",
    Icon: Truck,
    features: [
      {
        title: "Route optimization",
        description: "Plan efficient journeys that reduce travel time.",
        Icon: Route,
      },
      {
        title: "Live task tracking",
        description: "Assign deliveries and monitor completion in real time.",
        Icon: Smartphone,
      },
      {
        title: "Route compliance",
        description: "Identify deviations from approved routes quickly.",
        Icon: MapPinned,
      },
      {
        title: "Performance insights",
        description: "Compare task volume, completion rates and team KPIs.",
        Icon: BadgeCheck,
      },
    ],
  },
  {
    key: "field-sales",
    shortLabel: "Fintech, FMCG & Telecoms",
    title: "Turn field activity into market growth",
    eyebrow: "Fintech, FMCG & Telecommunications",
    description:
      "Give sales representatives, agents and promoters the structure to cover territories, capture opportunities and deliver results.",
    value: "Better territory coverage, customer acquisition and KPI performance.",
    Icon: Store,
    features: [
      {
        title: "Territory geofencing",
        description: "Create boundaries around markets, regions and territories.",
        Icon: MapPinned,
      },
      {
        title: "Market assignments",
        description: "Place every rep in the right market or operating region.",
        Icon: Users,
      },
      {
        title: "Lead generation",
        description: "Capture prospects and customers from field activity.",
        Icon: Smartphone,
      },
      {
        title: "KPIs & leaderboards",
        description: "Motivate teams with visible goals, badges and rankings.",
        Icon: BadgeCheck,
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
            <img
              src={industryImage}
              alt="Construction, logistics and field sales teams using TraccBox in their daily work"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              width={1536}
              height={896}
            />
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