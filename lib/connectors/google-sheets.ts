import type { sheets_v4 } from "googleapis";
import type {
  PaymentMode,
  PaymentProvider,
  PaymentStatus,
  Reservation,
  ReservationStatus,
  Room,
  RoomType,
} from "@/lib/hotel/types";
import type {
  ConnectorBackend,
  ConnectorHealth,
  ConnectorInitResult,
  ConnectorSeedData,
  ReservationCreateInput,
} from "./types";

const connectorId = "google-sheets";
const connectorName = "Google Sheets";

export const expectedBookMeSheetNames = ["Reservations", "Inventory", "ID Log", "Audit Log"] as const;

const reservationCoreHeaders = [
  "booking_id",
  "guest_name",
  "phone",
  "email",
  "room_id",
  "checkin",
  "checkout",
  "status",
  "created_at",
  "checked_in_at",
  "checked_out_at",
] as const;

const reservationPaymentHeaders = [
  "payment_status",
  "payment_mode",
  "payment_provider",
  "payment_reference",
  "pay_at_property",
] as const;

const reservationHeaders = [...reservationCoreHeaders, ...reservationPaymentHeaders] as const;

const inventoryHeaders = [
  "room_id",
  "room_type",
  "label",
  "price_per_night",
  "floor",
  "view",
  "max_guests",
  "is_active",
] as const;

type GoogleSheetsConfig = {
  serviceAccountEmail: string;
  privateKey: string;
  spreadsheetId: string;
};

type GoogleSheetsClient = {
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
};

const now = () => new Date().toISOString();

const health = (
  status: ConnectorHealth["status"],
  message: string,
  details?: Record<string, unknown>,
): ConnectorHealth => ({
  id: connectorId,
  name: connectorName,
  status,
  message,
  checkedAt: now(),
  capabilities: {
    reservationsRead: status === "ok",
    reservationsWrite: status === "ok",
    inventoryRead: status === "ok",
    inventoryWrite: status === "ok",
    initialize: status === "ok",
  },
  details,
});

export function getGoogleSheetsConfig(env: NodeJS.ProcessEnv = process.env): GoogleSheetsConfig | undefined {
  const serviceAccountEmail = env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = env.GOOGLE_SHEETS_PRIVATE_KEY?.trim().replace(/\\n/g, "\n");
  const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();

  if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
    return undefined;
  }

  return { serviceAccountEmail, privateKey, spreadsheetId };
}

function notConfiguredHealth(): ConnectorHealth {
  return health(
    "not_configured",
    "Google Sheets credentials are not configured. Set GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY, and GOOGLE_SHEETS_SPREADSHEET_ID.",
    {
      requiredEnv: ["GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SHEETS_PRIVATE_KEY", "GOOGLE_SHEETS_SPREADSHEET_ID"],
      expectedSheets: expectedBookMeSheetNames,
      expectedHeaders: {
        Reservations: reservationHeaders,
        Inventory: inventoryHeaders,
      },
    },
  );
}

async function createClient(): Promise<GoogleSheetsClient | ConnectorHealth> {
  const config = getGoogleSheetsConfig();
  if (!config) return notConfiguredHealth();

  try {
    const { google } = await import("googleapis");
    const auth = new google.auth.JWT({
      email: config.serviceAccountEmail,
      key: config.privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return {
      sheets: google.sheets({ version: "v4", auth }),
      spreadsheetId: config.spreadsheetId,
    };
  } catch (error) {
    return health("error", "Google Sheets client could not be initialized.", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function getSheetTitles(client: GoogleSheetsClient) {
  const response = await client.sheets.spreadsheets.get({
    spreadsheetId: client.spreadsheetId,
    fields: "properties.title,sheets.properties.title",
  });

  return {
    spreadsheetTitle: response.data.properties?.title,
    sheetTitles:
      response.data.sheets
        ?.map((sheet) => sheet.properties?.title)
        .filter((title): title is string => Boolean(title)) ?? [],
  };
}

async function getHeaderRow(client: GoogleSheetsClient, range: string) {
  const response = await client.sheets.spreadsheets.values.get({
    spreadsheetId: client.spreadsheetId,
    range,
  });

  return ((response.data.values?.[0] ?? []) as string[]).map((value) => value.trim());
}

function missingHeaders(actual: string[], expected: readonly string[]) {
  return expected.filter((header) => !actual.includes(header));
}

const parsePayAtProperty = (value: string | undefined) => {
  if (!value) return true;
  return !["false", "no", "0"].includes(value.toLowerCase());
};

async function ensureHeaders(client: GoogleSheetsClient) {
  const params: sheets_v4.Params$Resource$Spreadsheets$Values$Batchupdate = {
    spreadsheetId: client.spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        { range: "Reservations!A1:P1", values: [Array.from(reservationHeaders)] },
        { range: "Inventory!A1:H1", values: [Array.from(inventoryHeaders)] },
      ],
    },
  };

  await client.sheets.spreadsheets.values.batchUpdate(params);
}

function rowToReservation(row: string[]): Reservation | undefined {
  const bookingId = row[0]?.trim();
  if (!bookingId) return undefined;

  return {
    bookingId,
    guestName: row[1] ?? "",
    phone: row[2] ?? "",
    email: row[3] ?? "",
    roomId: row[4] ?? "",
    checkin: row[5] ?? "",
    checkout: row[6] ?? "",
    status: ((row[7] as ReservationStatus | undefined) ?? "Confirmed"),
    createdAt: row[8] ?? new Date().toISOString(),
    checkedInAt: row[9] || undefined,
    checkedOutAt: row[10] || undefined,
    paymentStatus: ((row[11] as PaymentStatus | undefined) ?? "pending"),
    paymentMode: ((row[12] as PaymentMode | undefined) ?? "pay_at_property"),
    paymentProvider: ((row[13] as PaymentProvider | undefined) ?? "manual"),
    paymentReference: row[14] || undefined,
    payAtProperty: parsePayAtProperty(row[15]),
  };
}

function reservationToRow(reservation: Reservation) {
  return [
    reservation.bookingId,
    reservation.guestName,
    reservation.phone,
    reservation.email,
    reservation.roomId,
    reservation.checkin,
    reservation.checkout,
    reservation.status,
    reservation.createdAt,
    reservation.checkedInAt ?? "",
    reservation.checkedOutAt ?? "",
    reservation.paymentStatus ?? "pending",
    reservation.paymentMode ?? "pay_at_property",
    reservation.paymentProvider ?? "manual",
    reservation.paymentReference ?? "",
    String(reservation.payAtProperty ?? true),
  ];
}

function rowToRoom(row: string[]): Room | undefined {
  const roomId = row[0]?.trim();
  if (!roomId) return undefined;

  return {
    roomId,
    roomType: ((row[1] as RoomType | undefined) ?? "queen"),
    label: row[2] ?? roomId,
    pricePerNight: Number(row[3] ?? 0),
    floor: Number(row[4] ?? 0),
    view: row[5] ?? "",
    maxGuests: Number(row[6] ?? 2),
    isActive: String(row[7] ?? "true").toLowerCase() !== "false",
  };
}

function roomToRow(room: Room) {
  return [
    room.roomId,
    room.roomType,
    room.label,
    String(room.pricePerNight),
    String(room.floor),
    room.view,
    String(room.maxGuests),
    String(room.isActive),
  ];
}

async function listReservationRows(client: GoogleSheetsClient) {
  const response = await client.sheets.spreadsheets.values.get({
    spreadsheetId: client.spreadsheetId,
    range: "Reservations!A2:P",
  });

  return (response.data.values ?? []) as string[][];
}

async function listInventoryRows(client: GoogleSheetsClient) {
  const response = await client.sheets.spreadsheets.values.get({
    spreadsheetId: client.spreadsheetId,
    range: "Inventory!A2:H",
  });

  return (response.data.values ?? []) as string[][];
}

async function replaceSeedRows(client: GoogleSheetsClient, data: ConnectorSeedData) {
  await ensureHeaders(client);
  await client.sheets.spreadsheets.values.batchClear({
    spreadsheetId: client.spreadsheetId,
    requestBody: {
      ranges: ["Reservations!A2:P", "Inventory!A2:H"],
    },
  });

  const updateData: sheets_v4.Schema$ValueRange[] = [];
  if (data.reservations.length) {
    updateData.push({
      range: `Reservations!A2:P${data.reservations.length + 1}`,
      values: data.reservations.map(reservationToRow),
    });
  }

  if (data.rooms.length) {
    updateData.push({
      range: `Inventory!A2:H${data.rooms.length + 1}`,
      values: data.rooms.map(roomToRow),
    });
  }

  if (updateData.length) {
    await client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: client.spreadsheetId,
      requestBody: {
        valueInputOption: "RAW",
        data: updateData,
      },
    });
  }
}

async function nextBookingId(client: GoogleSheetsClient) {
  const reservations = (await listReservationRows(client))
    .map(rowToReservation)
    .filter((reservation): reservation is Reservation => Boolean(reservation));
  const highest = reservations.reduce((max, reservation) => {
    const number = Number(reservation.bookingId.match(/\d+$/)?.[0] ?? 0);
    return Math.max(max, number);
  }, 1047);

  return `BKM-${highest + 1}`;
}

export function createGoogleSheetsConnector(): ConnectorBackend {
  return {
    id: connectorId,
    name: connectorName,
    async health() {
      const client = await createClient();
      if ("status" in client) return client;

      try {
        const { spreadsheetTitle, sheetTitles } = await getSheetTitles(client);
        const missingSheets = expectedBookMeSheetNames.filter((sheetName) => !sheetTitles.includes(sheetName));
        const reservationHeaderRow = sheetTitles.includes("Reservations")
          ? await getHeaderRow(client, "Reservations!A1:P1")
          : [];
        const inventoryHeaderRow = sheetTitles.includes("Inventory")
          ? await getHeaderRow(client, "Inventory!A1:H1")
          : [];
        const missingReservationHeaders = missingHeaders(reservationHeaderRow, reservationCoreHeaders);
        const missingReservationPaymentHeaders = missingHeaders(reservationHeaderRow, reservationPaymentHeaders);
        const missingInventoryHeaders = missingHeaders(inventoryHeaderRow, inventoryHeaders);
        const hasMissingHeaders = missingReservationHeaders.length > 0 || missingInventoryHeaders.length > 0;

        return health(
          missingSheets.length || hasMissingHeaders ? "error" : "ok",
          missingSheets.length
            ? "Google Sheets is reachable, but some expected BookMe tabs are missing."
            : hasMissingHeaders
              ? "Google Sheets is reachable, but BookMe headers need initialization."
              : "Google Sheets is reachable and expected BookMe tabs/headers are present.",
          {
            spreadsheetTitle,
            expectedSheets: expectedBookMeSheetNames,
            missingSheets,
            missingHeaders: {
              Reservations: missingReservationHeaders,
              Inventory: missingInventoryHeaders,
            },
            optionalMissingHeaders: {
              Reservations: missingReservationPaymentHeaders,
            },
          },
        );
      } catch (error) {
        return health("error", "Google Sheets could not be reached with the configured credentials.", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    async initialize(): Promise<ConnectorInitResult> {
      const client = await createClient();
      if ("status" in client) return { ...client, createdSheets: [], existingSheets: [] };

      try {
        const { spreadsheetTitle, sheetTitles } = await getSheetTitles(client);
        const existingSheets = expectedBookMeSheetNames.filter((sheetName) => sheetTitles.includes(sheetName));
        const missingSheets = expectedBookMeSheetNames.filter((sheetName) => !sheetTitles.includes(sheetName));

        if (missingSheets.length) {
          await client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: client.spreadsheetId,
            requestBody: {
              requests: missingSheets.map((title) => ({
                addSheet: {
                  properties: { title },
                },
              })),
            },
          });
        }

        await ensureHeaders(client);

        return {
          ...health(
            "ok",
            missingSheets.length
              ? "Google Sheets connector initialized missing BookMe tabs."
              : "Google Sheets connector already had the expected BookMe tabs.",
            { spreadsheetTitle, expectedSheets: expectedBookMeSheetNames },
          ),
          createdSheets: missingSheets,
          existingSheets,
        };
      } catch (error) {
        return {
          ...health("error", "Google Sheets tabs could not be initialized.", {
            error: error instanceof Error ? error.message : String(error),
          }),
          createdSheets: [],
          existingSheets: [],
        };
      }
    },
    async resetSeedData(data) {
      const client = await createClient();
      if ("status" in client) {
        throw new Error(client.message);
      }

      await replaceSeedRows(client, data);
      return {
        roomsReset: data.rooms.length,
        reservationsReset: data.reservations.length,
      };
    },
    reservations: {
      async listReservations() {
        const client = await createClient();
        if ("status" in client) return [];

        const rows = await listReservationRows(client);
        return rows.map(rowToReservation).filter((reservation): reservation is Reservation => Boolean(reservation));
      },
      async createReservation(input: ReservationCreateInput) {
        const client = await createClient();
        if ("status" in client) {
          throw new Error(client.message);
        }

        const reservation: Reservation = {
          bookingId: input.bookingId ?? (await nextBookingId(client)),
          guestName: input.guestName,
          phone: input.phone,
          email: input.email,
          roomId: input.roomId,
          checkin: input.checkin,
          checkout: input.checkout,
          status: input.status,
          createdAt: input.createdAt ?? new Date().toISOString(),
          checkedInAt: input.checkedInAt,
          checkedOutAt: input.checkedOutAt,
          paymentStatus: input.paymentStatus ?? "pending",
          paymentMode: input.paymentMode ?? "pay_at_property",
          paymentProvider: input.paymentProvider ?? "manual",
          paymentReference: input.paymentReference,
          payAtProperty: input.payAtProperty ?? true,
        };

        await client.sheets.spreadsheets.values.append({
          spreadsheetId: client.spreadsheetId,
          range: "Reservations!A:P",
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          requestBody: { values: [reservationToRow(reservation)] },
        });

        return reservation;
      },
      async updateReservationStatus(bookingId, status, patch) {
        const client = await createClient();
        if ("status" in client) {
          throw new Error(client.message);
        }

        const rows = await listReservationRows(client);
        const rowIndex = rows.findIndex((row) => row[0]?.toLowerCase() === bookingId.toLowerCase());
        if (rowIndex < 0) {
          throw new Error("Reservation not found in Google Sheets.");
        }

        const reservation = rowToReservation(rows[rowIndex]);
        if (!reservation) {
          throw new Error("Reservation row is invalid.");
        }

        const updated = { ...reservation, ...patch, status };
        await client.sheets.spreadsheets.values.update({
          spreadsheetId: client.spreadsheetId,
          range: `Reservations!A${rowIndex + 2}:P${rowIndex + 2}`,
          valueInputOption: "RAW",
          requestBody: { values: [reservationToRow(updated)] },
        });

        return updated;
      },
      async updateReservationPayment(bookingId, patch) {
        const client = await createClient();
        if ("status" in client) {
          throw new Error(client.message);
        }

        const rows = await listReservationRows(client);
        const rowIndex = rows.findIndex((row) => row[0]?.toLowerCase() === bookingId.toLowerCase());
        if (rowIndex < 0) {
          throw new Error("Reservation not found in Google Sheets.");
        }

        const reservation = rowToReservation(rows[rowIndex]);
        if (!reservation) {
          throw new Error("Reservation row is invalid.");
        }

        const updated = { ...reservation, ...patch };
        await client.sheets.spreadsheets.values.update({
          spreadsheetId: client.spreadsheetId,
          range: `Reservations!A${rowIndex + 2}:P${rowIndex + 2}`,
          valueInputOption: "RAW",
          requestBody: { values: [reservationToRow(updated)] },
        });

        return updated;
      },
    },
    inventory: {
      async listRooms() {
        const client = await createClient();
        if ("status" in client) return [];

        const rows = await listInventoryRows(client);
        return rows.map(rowToRoom).filter((room): room is Room => Boolean(room));
      },
      async createRoom(input) {
        const client = await createClient();
        if ("status" in client) {
          throw new Error(client.message);
        }

        await client.sheets.spreadsheets.values.append({
          spreadsheetId: client.spreadsheetId,
          range: "Inventory!A:H",
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          requestBody: { values: [roomToRow(input)] },
        });

        return input;
      },
      async updateRoom(roomId, patch) {
        const client = await createClient();
        if ("status" in client) {
          throw new Error(client.message);
        }

        const rows = await listInventoryRows(client);
        const rowIndex = rows.findIndex((row) => row[0]?.toLowerCase() === roomId.toLowerCase());
        if (rowIndex < 0) {
          throw new Error("Room not found in Google Sheets.");
        }

        const room = rowToRoom(rows[rowIndex]);
        if (!room) {
          throw new Error("Room row is invalid.");
        }

        const updated = { ...room, ...patch };
        await client.sheets.spreadsheets.values.update({
          spreadsheetId: client.spreadsheetId,
          range: `Inventory!A${rowIndex + 2}:H${rowIndex + 2}`,
          valueInputOption: "RAW",
          requestBody: { values: [roomToRow(updated)] },
        });

        return updated;
      },
      async upsertRoom(input) {
        const client = await createClient();
        if ("status" in client) {
          throw new Error(client.message);
        }

        const rows = await listInventoryRows(client);
        const rowIndex = rows.findIndex((row) => row[0]?.toLowerCase() === input.roomId.toLowerCase());
        if (rowIndex < 0) {
          await client.sheets.spreadsheets.values.append({
            spreadsheetId: client.spreadsheetId,
            range: "Inventory!A:H",
            valueInputOption: "RAW",
            insertDataOption: "INSERT_ROWS",
            requestBody: { values: [roomToRow(input)] },
          });
          return input;
        }

        await client.sheets.spreadsheets.values.update({
          spreadsheetId: client.spreadsheetId,
          range: `Inventory!A${rowIndex + 2}:H${rowIndex + 2}`,
          valueInputOption: "RAW",
          requestBody: { values: [roomToRow(input)] },
        });

        return input;
      },
    },
  };
}
