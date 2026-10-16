// Los 28 clientes de la franja. Los archivos viven en public/home/logos y las medidas son las de la imagen a 34 px de alto.
// Miami Herald y Arianna Lupi no tienen logo aprobado: se muestran como texto, igual que en el HTML.
export type ClientItem = { name: string; file: string; w: number; h: number } | { text: string };

export const SEO_CLIENTS: ClientItem[] = [
  { name: "money.com", file: "money-com", w: 112, h: 34 },
  { text: "Miami Herald" },
  { name: "Holafly", file: "holafly", w: 120, h: 34 },
  { name: "Souma Hotel", file: "souma-hotel", w: 34, h: 34 },
  { name: "TheSmokyRolling", file: "thesmokyrolling", w: 183, h: 34 },
  { name: "DSLX", file: "dslx", w: 39, h: 34 },
  { name: "Vallas Venezuela", file: "vallas-venezuela", w: 94, h: 34 },
  { name: "TheSmokyBox", file: "thesmokybox", w: 65, h: 34 },
  { name: "Florida Health Care Academy", file: "florida-health-care-academy", w: 197, h: 34 },
  { name: "Delta Cloudz", file: "delta-cloudz", w: 196, h: 34 },
  { name: "Tursi Digital Nomads", file: "tursi-digital-nomads", w: 106, h: 34 },
  { name: "The Sosa Team", file: "the-sosa-team", w: 34, h: 34 },
  { name: "Florida Top Roofs", file: "florida-top-roofs", w: 35, h: 34 },
  { name: "Felipe Vergara", file: "felipe-vergara", w: 50, h: 34 },
  { name: "Storybook app", file: "storybook-app", w: 49, h: 34 },
];

export const DEV_CLIENTS: ClientItem[] = [
  { name: "Luxembourg Philharmonie", file: "luxembourg-philharmonie", w: 50, h: 34 },
  { text: "Arianna Lupi" },
  { name: "Apturio", file: "apturio", w: 30, h: 34 },
  { name: "Childrenchic", file: "childrenchic", w: 34, h: 34 },
  { name: "TuMundoSalud", file: "tumundosalud", w: 176, h: 34 },
  { name: "Crédito USS", file: "credito-uss", w: 153, h: 34 },
  { name: "Wiñaypaq", file: "winaypaq", w: 54, h: 34 },
  { name: "Dr. Manuel A. Vargas Hidalgo", file: "dr-manuel-a-vargas-hidalgo", w: 34, h: 34 },
  { name: "Puntada con Amor", file: "puntada-con-amor", w: 32, h: 34 },
  { name: "Aprendoclub", file: "aprendoclub", w: 177, h: 34 },
  { name: "Pro Torque Diesel", file: "pro-torque-diesel", w: 112, h: 34 },
  { name: "Cresory", file: "cresory", w: 41, h: 34 },
  { name: "Estylopia", file: "estylopia", w: 114, h: 34 },
];
