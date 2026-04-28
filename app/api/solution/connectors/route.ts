import { NextResponse } from "next/server";
import { listSolutionConnectors, updateSolutionConnectorStatus } from "@/lib/solution/store";
import type { ConnectorStatus } from "@/lib/solution/types";

const connectorStatuses: ConnectorStatus[] = ["connected", "needs_credentials", "planned", "manual_review"];

const isConnectorStatus = (status: unknown): status is ConnectorStatus =>
  connectorStatuses.includes(status as ConnectorStatus);

export async function GET() {
  return NextResponse.json({ connectors: listSolutionConnectors() });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { connectorId?: string; status?: ConnectorStatus; detail?: string };
  const connectorId = String(body.connectorId ?? "");
  const status = body.status;

  if (!connectorId || !isConnectorStatus(status)) {
    return NextResponse.json(
      { error: "connectorId and a valid status are required" },
      { status: 400 },
    );
  }

  const connector = updateSolutionConnectorStatus(connectorId, status, body.detail);
  if (!connector) {
    return NextResponse.json({ error: "connector not found" }, { status: 404 });
  }

  return NextResponse.json({ connector });
}
