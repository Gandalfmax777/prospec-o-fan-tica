import type { Origem, Prioridade, Status, TipoContato } from "@/types/crm";

const createReverseMap = <T extends string>(
  map: Record<T, string>
): Record<string, T> => {
  return Object.fromEntries(
    Object.entries(map).map(([key, value]) => [value, key])
  ) as Record<string, T>;
};

export const tipoContatoToApiMap: Record<TipoContato, string> = {
  Ligação: "Ligacao",
  WhatsApp: "WhatsApp",
  Email: "Email",
  Reunião: "Reuniao",
  Visita: "Visita",
  Outro: "Outro",
};

export const origemToApiMap: Record<Origem, string> = {
  Instagram: "Instagram",
  Indicação: "Indicacao",
  Anúncio: "Anuncio",
  Evento: "Evento",
  WhatsApp: "WhatsApp",
  Orgânico: "Organico",
  LinkedIn: "LinkedIn",
  Site: "Site",
  Outro: "Outro",
};

export const statusToApiMap: Record<Status, string> = {
  Atrasado: "Atrasado",
  "Falar Hoje": "FalarHoje",
  "Em Dia": "EmDia",
  Convertido: "Convertido",
};

export const prioridadeToApiMap: Record<Prioridade, string> = {
  Urgente: "Urgente",
  Alerta: "Alerta",
  Atenção: "Atencao",
  Normal: "Normal",
};

export const tipoContatoFromApiMap = createReverseMap(tipoContatoToApiMap);
export const origemFromApiMap = createReverseMap(origemToApiMap);
export const statusFromApiMap = createReverseMap(statusToApiMap);
export const prioridadeFromApiMap = createReverseMap(prioridadeToApiMap);

const mapToApi = (
  value: string | null | undefined,
  map: Record<string, string>
): string | null | undefined => {
  if (value == null) return value;
  return map[value] ?? value;
};

const mapFromApi = <T extends string>(
  value: string | null | undefined,
  map: Record<string, T>
): T | null | undefined => {
  if (value == null) return value as null | undefined;
  return map[value] ?? (value as T);
};

export const toApiTipoContato = (value?: string | null) =>
  mapToApi(value, tipoContatoToApiMap);
export const fromApiTipoContato = (value?: string | null) =>
  mapFromApi(value, tipoContatoFromApiMap);

export const toApiOrigem = (value?: string | null) =>
  mapToApi(value, origemToApiMap);
export const fromApiOrigem = (value?: string | null) =>
  mapFromApi(value, origemFromApiMap);

export const toApiStatus = (value?: string | null) =>
  mapToApi(value, statusToApiMap);
export const fromApiStatus = (value?: string | null) =>
  mapFromApi(value, statusFromApiMap);

export const toApiPrioridade = (value?: string | null) =>
  mapToApi(value, prioridadeToApiMap);
export const fromApiPrioridade = (value?: string | null) =>
  mapFromApi(value, prioridadeFromApiMap);
