"use client";

import { useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";

type ReservationRow = {
  bookingId: string;
  guestName: string;
  contact: string;
  room: string;
  dates: string;
  status: string;
  total: string;
  paymentStatus: string;
  paymentMode: string;
};

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Checked In"
      ? "bg-emerald-300/15 text-emerald-100"
      : status === "Confirmed"
        ? "bg-white/10 text-white"
        : "bg-sky-300/15 text-sky-100";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}

export function AdminReservationsPanel({
  hotelSlug,
  reservations,
}: {
  hotelSlug: string;
  reservations: ReservationRow[];
}) {
  const [rows, setRows] = useState(reservations);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((reservation) => {
      const matchesStatus = statusFilter === "All" || reservation.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          reservation.bookingId,
          reservation.guestName,
          reservation.contact,
          reservation.room,
          reservation.dates,
          reservation.status,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [query, rows, statusFilter]);

  function updateReservation(bookingId: string, action: "checkin" | "checkout") {
    setMessage("");
    setPendingBookingId(bookingId);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/hotels/${hotelSlug}/reservations/${bookingId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = (await response.json()) as {
          error?: string;
          message?: string;
          reservation?: { status?: string };
        };

        if (!response.ok) {
          setMessage(data.error ?? "Could not update reservation.");
          return;
        }

        setRows((current) =>
          current.map((reservation) =>
            reservation.bookingId === bookingId && data.reservation?.status
              ? { ...reservation, status: data.reservation.status }
              : reservation,
          ),
        );
        setMessage(data.message ?? "Reservation updated.");
      } catch {
        setMessage("Could not reach the reservation status API.");
      } finally {
        setPendingBookingId(null);
      }
    });
  }

  return (
    <section id="reservations" className="liquid-glass overflow-hidden rounded-[1.5rem]">
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-sm font-medium text-white">Reservations</h2>
            <p className="text-xs text-white/[0.5]">Search, filter, and manually override guest state</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 text-sm text-white">
            <Search className="h-4 w-4 text-white/[0.45]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search booking, guest, contact"
              className="w-56 bg-transparent outline-none placeholder:text-white/[0.38]"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="min-h-10 rounded-full border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none"
          >
            {["All", "Confirmed", "Checked In", "Checked Out"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {message ? (
        <div className="border-b border-white/10 px-5 py-3 text-sm text-white/[0.72]">{message}</div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-white/[0.42]">
            <tr>
              <th className="px-5 py-3 font-medium">Booking</th>
              <th className="px-5 py-3 font-medium">Guest</th>
              <th className="px-5 py-3 font-medium">Room</th>
              <th className="px-5 py-3 font-medium">Dates</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Override</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredRows.map((reservation) => (
              <tr key={reservation.bookingId}>
                <td className="px-5 py-4 font-medium text-white">{reservation.bookingId}</td>
                <td className="px-5 py-4">
                  <p className="font-medium text-white">{reservation.guestName}</p>
                  <p className="text-xs text-white/[0.45]">{reservation.contact}</p>
                </td>
                <td className="px-5 py-4 text-white/[0.64]">{reservation.room}</td>
                <td className="px-5 py-4 text-white/[0.64]">{reservation.dates}</td>
                <td className="px-5 py-4">
                  <StatusPill status={reservation.status} />
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-white">{reservation.paymentStatus}</p>
                  <p className="text-xs text-white/[0.45]">{reservation.paymentMode}</p>
                </td>
                <td className="px-5 py-4 text-white">{reservation.total}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isPending || reservation.status !== "Confirmed"}
                      onClick={() => updateReservation(reservation.bookingId, "checkin")}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 transition disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {pendingBookingId === reservation.bookingId ? "Updating" : "Check in"}
                    </button>
                    <button
                      type="button"
                      disabled={isPending || reservation.status !== "Checked In"}
                      onClick={() => updateReservation(reservation.bookingId, "checkout")}
                      className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Check out
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

