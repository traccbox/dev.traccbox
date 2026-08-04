/** Shared mock organisation data used by the performance, travel and call modules. */

export interface MockEmployee {
  id: string;
  name: string;
  photo: string;
  department: string;
  branch: string;
  team: string;
  territory: string;
  device: string;
}

export const DEPARTMENTS = ["Sales", "Field Ops", "Distribution", "Support"];
export const BRANCHES = ["Lagos HQ", "Ikeja Branch", "Abuja Branch", "Port Harcourt"];
export const TEAMS = ["Alpha Team", "Bravo Team", "Delta Team", "Growth Squad"];
export const TERRITORIES = ["Lagos Island", "Lagos Mainland", "FCT Central", "Rivers South"];

const NAMES = [
  "Chidi Okonkwo",
  "Amaka Eze",
  "Tunde Bakare",
  "Fatima Yusuf",
  "Emeka Nwosu",
  "Blessing Adeyemi",
  "Samuel Ojo",
  "Grace Umeh",
  "Ibrahim Danladi",
  "Ngozi Obi",
  "Peter Adeleke",
  "Halima Bello",
];

export const EMPLOYEES: MockEmployee[] = NAMES.map((name, i) => ({
  id: `emp-${i + 1}`,
  name,
  photo: `https://i.pravatar.cc/100?img=${i + 5}`,
  department: DEPARTMENTS[i % DEPARTMENTS.length],
  branch: BRANCHES[i % BRANCHES.length],
  team: TEAMS[i % TEAMS.length],
  territory: TERRITORIES[i % TERRITORIES.length],
  device: i % 3 === 0 ? "Android 13" : i % 3 === 1 ? "iOS 17" : "Android 12",
}));

/** Deterministic pseudo-random helper so mock data is stable between renders. */
export function rand(seed: number, min: number, max: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  const f = x - Math.floor(x);
  return Math.round(min + f * (max - min));
}

export const delay = <T,>(data: T, ms = 450): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));
