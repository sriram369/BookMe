"use client";

import { FormEvent, useMemo, useState } from "react";
import { Send, Star } from "lucide-react";
import { DotLoader } from "./dot-loader";
import type { SummaryCard } from "@/lib/hotel/types";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  card?: SummaryCard;
};

type AgentResponse = {
  message: string;
  card?: SummaryCard;
  model?: string;
  toolCalls?: string[];
};

const examples = [
  "I'm checking in. My phone number is 617-555-0192.",
  "I want to check out, booking ID BKM-1029.",
  "Do you have a king room from 2026-05-01 to 2026-05-03?",
];

function SummaryCardView({ card }: { card: SummaryCard }) {
  return (
    <div className="liquid-glass transition-pop mt-3 rounded-2xl p-4 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/[0.45]">
            {card.kind}
          </p>
          <h3 className="mt-1 text-2xl font-medium text-white">{card.title}</h3>
        </div>
        <span className="liquid-glass rounded-full px-3 py-1 text-xs font-medium text-white">
          {card.status}
        </span>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {card.fields.map((field) => (
          <div key={`${field.label}-${field.value}`} className="rounded-xl bg-white/[0.06] px-3 py-2">
            <dt className="text-white/50">{field.label}</dt>
            <dd className="font-medium text-white">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

type FrontDeskChatProps = {
  hotelSlug?: string;
  hotelName?: string;
};

export function FrontDeskChat({ hotelSlug, hotelName = "Sriram Hotel" }: FrontDeskChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Welcome to ${hotelName}. I can help you book a room, check in, or check out.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiMessages = useMemo(
    () => messages.map(({ role, content }) => ({ role, content })),
    [messages],
  );

  async function sendMessage(messageText: string) {
    const content = messageText.trim();
    if (!content || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...apiMessages, { role: "user", content }],
          hotelSlug,
        }),
      });

      const data = (await response.json()) as AgentResponse;
      if (!response.ok) {
        throw new Error(data.message || "The front desk could not respond.");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.message,
          card: data.card,
        },
      ]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Something went wrong.";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "The front desk could not complete that request. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <section id="front-desk" className="liquid-glass rounded-[2rem] p-3 shadow-soft">
      <div className="overflow-hidden rounded-[1.55rem] border border-white/10 bg-black/20">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/[0.45]">
              AI front desk
            </p>
            <p className="text-sm font-medium text-white">Ask naturally</p>
          </div>
          <div className="liquid-glass flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white">
            <Star className="h-3.5 w-3.5 fill-white" />
            Demo
          </div>
        </div>

        <div className="max-h-[640px] space-y-4 overflow-y-auto p-4 sm:p-5">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`}>
              <div
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[84%] rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-zinc-950"
                    : "max-w-[84%] rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm leading-6 text-white shadow-card"
                }
              >
                {message.content}
              </div>
              {message.card ? <SummaryCardView card={message.card} /> : null}
            </div>
          ))}

          {isLoading ? (
            <div className="liquid-glass flex max-w-max items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-white/80">
              <DotLoader />
              Working with hotel tools
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-200">{error}</p> : null}
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => void sendMessage(example)}
                className="liquid-glass rounded-full px-3 py-2 text-left text-xs text-white/[0.72] transition hover:scale-[1.02] hover:text-white"
              >
                {example}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="liquid-glass flex items-center gap-3 rounded-2xl p-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder='Try: "I want to check in with my phone number"'
              className="min-h-11 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/[0.45]"
            />
            <button
              type="submit"
              disabled={isLoading || input.trim().length === 0}
              className="liquid-glass grid h-11 w-11 place-items-center rounded-xl text-white transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
