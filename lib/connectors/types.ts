import type { Reservation, Room } from "@/lib/hotel/types";

export type ConnectorHealthStatus = "ok" | "not_configured" | "error";

export type ConnectorHealth = {
  id: string;
  name: string;
  status: ConnectorHealthStatus;
  message: string;
  checkedAt: string;
  capabilities?: {
    reservationsRead: boolean;
    reservationsWrite: boolean;
    inventoryRead: boolean;
    inventoryWrite: boolean;
    initialize: boolean;
  };
  details?: Record<string, unknown>;
};

export type ConnectorInitResult = ConnectorHealth & {
  createdSheets?: string[];
  existingSheets?: string[];
};

export type ReservationCreateInput = Omit<Reservation, "bookingId" | "createdAt"> & {
  bookingId?: string;
  createdAt?: string;
  idempotencyKey?: string;
};

export type ReservationConnector = {
  listReservations(): Promise<Reservation[]>;
  createReservation(input: ReservationCreateInput): Promise<Reservation>;
  updateReservationStatus(
    bookingId: string,
    status: Reservation["status"],
    patch?: Partial<Reservation>,
  ): Promise<Reservation>;
};

export type InventoryConnector = {
  listRooms(): Promise<Room[]>;
  createRoom(input: Room): Promise<Room>;
  updateRoom(roomId: string, patch: Partial<Room>): Promise<Room>;
  upsertRoom(input: Room): Promise<Room>;
};

export type ConnectorSeedData = {
  rooms: Room[];
  reservations: Reservation[];
};

export type ConnectorSeedResetResult = {
  roomsReset: number;
  reservationsReset: number;
};

export type ConnectorBackend = {
  id: string;
  name: string;
  health(): Promise<ConnectorHealth>;
  initialize?(): Promise<ConnectorInitResult>;
  resetSeedData?(data: ConnectorSeedData): Promise<ConnectorSeedResetResult>;
  reservations?: ReservationConnector;
  inventory?: InventoryConnector;
};
