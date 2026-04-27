import { ArrowRight, CheckCircle2 } from "lucide-react";
import { DotLoader } from "./dot-loader";
import { productMessages, reservationSummary } from "@/lib/demo-data";

export function ProductConsole() {
  return (
    <div className="transition-pop rounded-[2rem] border border-white/80 bg-white/78 p-3 shadow-soft backdrop-blur-xl">
      <div className="overflow-hidden rounded-[1.55rem] border border-ink/8 bg-parchment">
        <div className="flex items-center justify-between border-b border-ink/8 bg-white/70 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass">
              Live front desk
            </p>
            <p className="text-sm font-semibold text-ink">Sriram Hotel lobby</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-moss/10 px-3 py-1 text-xs font-medium text-moss">
            <span className="h-2 w-2 rounded-full bg-moss" />
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
                    ? "ml-auto max-w-[82%] rounded-2xl bg-ink px-4 py-3 text-sm leading-6 text-white"
                    : message.role === "system"
                      ? "flex max-w-max items-center gap-2 rounded-full border border-brass/25 bg-brass/10 px-3 py-2 text-xs font-medium text-brass"
                      : "max-w-[82%] rounded-2xl border border-ink/8 bg-white px-4 py-3 text-sm leading-6 text-ink shadow-card"
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

            <div className="rounded-2xl border border-moss/15 bg-white p-4 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage">
                    Check-in card
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-ink">Room 214 ready</h3>
                </div>
                <CheckCircle2 className="h-6 w-6 text-moss" />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-sage">Guest</dt>
                  <dd className="font-semibold text-ink">James Lee</dd>
                </div>
                <div>
                  <dt className="text-sage">Status</dt>
                  <dd className="font-semibold text-moss">Checked In</dd>
                </div>
                <div>
                  <dt className="text-sage">Stay</dt>
                  <dd className="font-semibold text-ink">Apr 27 - Apr 30</dd>
                </div>
                <div>
                  <dt className="text-sage">Key</dt>
                  <dd className="font-semibold text-ink">Ready at desk</dd>
                </div>
              </dl>
            </div>
          </div>

          <aside className="border-t border-ink/8 bg-white/58 p-4 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage">
              Current booking
            </p>
            <div className="mt-4 space-y-3">
              {Object.entries(reservationSummary).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-ink/8 bg-parchment px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-sage">{key}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-3 py-3 text-sm font-semibold text-white transition hover:bg-moss">
              Open admin view
              <ArrowRight className="h-4 w-4" />
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
