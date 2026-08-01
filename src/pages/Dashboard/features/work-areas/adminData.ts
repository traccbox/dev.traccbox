// Administrative hierarchy: Country -> State -> LGA -> Ward -> Community
// Each node can carry a center + suggested zoom so the map can focus on it.

export interface AdminNode {
  name: string;
  center?: [number, number];
  zoom?: number;
  children?: AdminNode[];
}

export const ADMIN_TREE: AdminNode[] = [
  {
    name: "Nigeria",
    center: [9.082, 8.6753],
    zoom: 6,
    children: [
      {
        name: "Lagos",
        center: [6.5244, 3.3792],
        zoom: 10,
        children: [
          {
            name: "Ikeja",
            center: [6.6018, 3.3515],
            zoom: 13,
            children: [
              {
                name: "Ward A - Alausa",
                center: [6.6194, 3.3597],
                zoom: 15,
                children: [
                  { name: "Alausa Secretariat", center: [6.6206, 3.3583], zoom: 16 },
                  { name: "Oregun", center: [6.6087, 3.3644], zoom: 16 },
                ],
              },
              {
                name: "Ward B - Oshodi Road",
                center: [6.5836, 3.3436],
                zoom: 15,
                children: [
                  { name: "Onipanu", center: [6.5822, 3.3462], zoom: 16 },
                  { name: "Mafoluku", center: [6.5715, 3.3339], zoom: 16 },
                ],
              },
            ],
          },
          {
            name: "Eti-Osa",
            center: [6.4478, 3.5099],
            zoom: 12,
            children: [
              {
                name: "Ward 1 - Lekki",
                center: [6.4478, 3.4723],
                zoom: 14,
                children: [
                  { name: "Lekki Phase 1", center: [6.4432, 3.4699], zoom: 15 },
                  { name: "Ikate Elegushi", center: [6.4386, 3.4885], zoom: 15 },
                ],
              },
              {
                name: "Ward 2 - Victoria Island",
                center: [6.4281, 3.4219],
                zoom: 14,
                children: [
                  { name: "Oniru", center: [6.4304, 3.4499], zoom: 15 },
                  { name: "Ahmadu Bello Way", center: [6.4272, 3.4185], zoom: 16 },
                ],
              },
            ],
          },
          {
            name: "Apapa",
            center: [6.4489, 3.3593],
            zoom: 13,
            children: [
              {
                name: "Ward 3 - Apapa GRA",
                center: [6.4463, 3.3652],
                zoom: 15,
                children: [
                  { name: "Marine Beach", center: [6.4407, 3.3618], zoom: 16 },
                  { name: "Ijora", center: [6.4671, 3.3624], zoom: 16 },
                ],
              },
            ],
          },
          {
            name: "Surulere",
            center: [6.5009, 3.3549],
            zoom: 13,
            children: [
              {
                name: "Ward 4 - Aguda",
                center: [6.4936, 3.3401],
                zoom: 15,
                children: [
                  { name: "Aguda Market", center: [6.4941, 3.3388], zoom: 16 },
                  { name: "Ijeshatedo", center: [6.5039, 3.3327], zoom: 16 },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Federal Capital Territory",
        center: [9.0579, 7.4951],
        zoom: 10,
        children: [
          {
            name: "Abuja Municipal (AMAC)",
            center: [9.0579, 7.4951],
            zoom: 12,
            children: [
              {
                name: "Garki Ward",
                center: [9.0333, 7.4894],
                zoom: 14,
                children: [
                  { name: "Area 11", center: [9.0388, 7.4915], zoom: 16 },
                  { name: "Garki 2", center: [9.0292, 7.4881], zoom: 16 },
                ],
              },
              {
                name: "Wuse Ward",
                center: [9.0765, 7.4692],
                zoom: 14,
                children: [
                  { name: "Wuse 2", center: [9.0796, 7.4645], zoom: 16 },
                  { name: "Wuse Zone 5", center: [9.0668, 7.4732], zoom: 16 },
                ],
              },
            ],
          },
          {
            name: "Bwari",
            center: [9.2833, 7.3833],
            zoom: 12,
            children: [
              {
                name: "Kubwa Ward",
                center: [9.1533, 7.3306],
                zoom: 14,
                children: [{ name: "Phase 4 Kubwa", center: [9.1602, 7.3369], zoom: 16 }],
              },
            ],
          },
        ],
      },
      {
        name: "Rivers",
        center: [4.8156, 7.0498],
        zoom: 10,
        children: [
          {
            name: "Port Harcourt",
            center: [4.8156, 7.0498],
            zoom: 12,
            children: [
              {
                name: "Ward 5 - GRA",
                center: [4.8242, 7.0134],
                zoom: 14,
                children: [
                  { name: "Old GRA", center: [4.8156, 7.0093], zoom: 16 },
                  { name: "Rumuola", center: [4.8399, 7.0143], zoom: 16 },
                ],
              },
            ],
          },
          {
            name: "Obio-Akpor",
            center: [4.8583, 6.9986],
            zoom: 12,
            children: [
              {
                name: "Rumuokwuta Ward",
                center: [4.8397, 6.9884],
                zoom: 14,
                children: [{ name: "Rumuokwuta Market", center: [4.8402, 6.9879], zoom: 16 }],
              },
            ],
          },
        ],
      },
      {
        name: "Kano",
        center: [12.0022, 8.592],
        zoom: 10,
        children: [
          {
            name: "Kano Municipal",
            center: [11.9964, 8.5167],
            zoom: 12,
            children: [
              {
                name: "Sabon Gari Ward",
                center: [12.0058, 8.5266],
                zoom: 14,
                children: [{ name: "Sabon Gari Market", center: [12.0031, 8.5261], zoom: 16 }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Ghana",
    center: [7.9465, -1.0232],
    zoom: 7,
    children: [
      {
        name: "Greater Accra",
        center: [5.6037, -0.187],
        zoom: 11,
        children: [
          {
            name: "Accra Metropolitan",
            center: [5.5564, -0.1969],
            zoom: 13,
            children: [
              {
                name: "Osu Klottey",
                center: [5.5563, -0.1822],
                zoom: 15,
                children: [{ name: "Osu Oxford Street", center: [5.5578, -0.1809], zoom: 16 }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Kenya",
    center: [-0.0236, 37.9062],
    zoom: 6,
    children: [
      {
        name: "Nairobi",
        center: [-1.2921, 36.8219],
        zoom: 11,
        children: [
          {
            name: "Westlands",
            center: [-1.2657, 36.8035],
            zoom: 13,
            children: [
              {
                name: "Parklands Ward",
                center: [-1.2626, 36.8194],
                zoom: 15,
                children: [{ name: "Highridge", center: [-1.2632, 36.8168], zoom: 16 }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "South Africa",
    center: [-30.5595, 22.9375],
    zoom: 5,
    children: [
      {
        name: "Gauteng",
        center: [-26.2708, 28.1123],
        zoom: 9,
        children: [
          {
            name: "City of Johannesburg",
            center: [-26.2041, 28.0473],
            zoom: 11,
            children: [
              {
                name: "Ward 90 - Sandton",
                center: [-26.1076, 28.0567],
                zoom: 14,
                children: [{ name: "Sandton CBD", center: [-26.1075, 28.0567], zoom: 16 }],
              },
            ],
          },
        ],
      },
    ],
  },
];

export function findNode(list: AdminNode[] | undefined, name: string): AdminNode | undefined {
  return list?.find((n) => n.name === name);
}
