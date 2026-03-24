import type { Origem } from "@/types/crm";

export const ORIGENS: Origem[] = [
  "WEBSITE",
  "REFERRAL",
  "SOCIAL_MEDIA",
  "EMAIL",
  "PHONE",
  "EVENT",
  "OTHER",
];

export const ORIGEM_LABELS: Record<Origem, string> = {
  WEBSITE: "Website",
  REFERRAL: "Indicação",
  SOCIAL_MEDIA: "Redes Sociais",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  EVENT: "Evento",
  OTHER: "Outro",
};
