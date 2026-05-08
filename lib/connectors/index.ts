import { createGoogleSheetsConnector } from "./google-sheets";
import { createSupabaseConnector } from "./supabase";
import type { ConnectorBackend } from "./types";

export function listConnectorBackends(): ConnectorBackend[] {
  return [createSupabaseConnector(), createGoogleSheetsConnector()];
}

export function getConnectorBackend(connectorId: string): ConnectorBackend | undefined {
  return listConnectorBackends().find((connector) => connector.id === connectorId);
}

export type {
  ConnectorBackend,
  ConnectorHealth,
  ConnectorHealthStatus,
  ConnectorInitResult,
  InventoryConnector,
  ReservationCreateInput,
  ReservationConnector,
} from "./types";
