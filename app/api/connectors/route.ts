import { NextResponse } from "next/server";
import { getConnectorBackend, listConnectorBackends } from "@/lib/connectors";

export async function GET() {
  const connectors = await Promise.all(listConnectorBackends().map((connector) => connector.health()));

  return NextResponse.json({ connectors });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { connectorId?: string; initialize?: boolean };
  const connectorId = body.connectorId ?? "google-sheets";
  const connector = getConnectorBackend(connectorId);

  if (!connector) {
    return NextResponse.json({ error: "connector not found" }, { status: 404 });
  }

  if (!body.initialize) {
    return NextResponse.json({ connector: await connector.health() });
  }

  if (!connector.initialize) {
    return NextResponse.json({ error: "connector does not support initialization" }, { status: 400 });
  }

  return NextResponse.json({ connector: await connector.initialize() });
}
