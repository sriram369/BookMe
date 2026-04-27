import { ArrowRight, CheckCircle2 } from "lucide-react";
import { DotLoader } from "./dot-loader";
import { productMessages, reservationSummary } from "@/lib/demo-data";

export function ProductConsole() {
  return (
    <div className="liquid-glass transition-pop rounded-[2rem] p-3 text-white shadow-soft">
      <div className="overflow-hidden rounded-[1.55rem] border border-white/10 bg-black/20">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              Live front desk
            </p>
            <p className="text-sm font-medium text-white">Sriram Hotel lobby</p>
          </div>
          <div className="liquid-glass flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-white">
            <span className="h-2 w-2 rounded-full bg-white" />
            Online
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_230px]">
          <div className="space-y-4 p-4 sm:p-5">
            {productMessages.map((message) => (
              <div
                key={message.text}
                className={
                  message.role === "guest"
                    ? "ml-auto max-w-[82%] rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-zinc-950"
                    : message.role === "system"
                      ? "liquid-glass flex max-w-max items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-white/80"
                      : "max-w-[82%] rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm leading-6 text-white shadow-card"
                }
              >
                {message.role === "system" ? (
                  <>
                    <DotLoader />
                    {message.text}
                  </>
                ) : (
                  message.text
                )}
              </div>
            ))}

            <div className="liquid-glass rounded-2xl p-4 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/[0.45]">
                    Check-in card
                  </p>
                  <h3 className="mt-1 text-lg font-medium text-white">Room 214 ready</h3>
                </div>
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-white/50">Guest</dt>
                  <dd className="font-medium text-white">James Lee</dd>
                </div>
                <div>
                  <dt className="text-white/50">Status</dt>
                  <dd className="font-medium text-white">Checked In</dd>
                </div>
                <div>
                  <dt className="text-white/50">Stay</dt>
                  <dd className="font-medium text-white">Apr 27 - Apr 30</dd>
                </div>
                <div>
                  <dt className="text-white/50">Key</dt>
                  <dd className="font-medium text-white">Ready at desk</dd>
                </div>
              </dl>
            </div>
          </div>

          <aside className="border-t border-white/10 bg-white/[0.03] p-4 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/[0.45]">
              Current booking
            </p>
            <div className="mt-4 space-y-3">
              {Object.entries(reservationSummary).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/[0.45]">{key}</p>
                  <p className="mt-1 text-sm font-medium text-white">{value}</p>
                </div>
              ))}
            </div>
            <button className="liquid-glass mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-white transition hover:scale-[1.02]">
              Open admin view
              <ArrowRight className="h-4 w-4" />
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
