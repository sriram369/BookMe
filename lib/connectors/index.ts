import { createGoogleSheetsConnector } from "./google-sheets";
import type { ConnectorBackend } from "./types";

export function listConnectorBackends(): ConnectorBackend[] {
  return [createGoogleSheetsConnector()];
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
  ReservationConnector,
  ReservationCreateInput,
} from "./types";
