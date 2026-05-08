# BookMe Final Presentation Speaker Notes

Target length: 2-3 minutes.

## Slide 1: BookMe turns a hotel website into an AI front desk.

Hi everyone, my project is BookMe. It is an AI front desk for independent hotels.

The workflow is intentionally narrow: guests can book a room, check in, or check out from one web link.

The key point is that BookMe is not a general chatbot. It is connected to reservation tools, so it can verify bookings, room availability, prices, and status instead of making those up.

## Slide 2: Small hotels still run guest requests through manual lookup.

The user is an independent hotel owner or front-desk team.

The problem is that many smaller hotels still handle routine guest requests manually. A guest calls, sends a message, or waits at the desk. Staff then search a spreadsheet, PMS, or register and update the status by hand.

For this assignment, I kept the scope narrow. BookMe focuses only on booking, check-in, and checkout because those are repetitive, high-volume workflows where tool-grounded GenAI can help.

## Slide 3: Natural language on top. Deterministic hotel tools underneath.

BookMe is built as a Next.js web app. The guest message goes to an API route, and the LLM decides whether to ask a follow-up question or call a tool.

The important design choice is that the AI cannot invent operational data. Room prices, booking IDs, availability, guest status, check-in, and checkout all come from tools.

So the AI handles the messy language, but the reservation layer handles the business action.

## Slide 4: BookMe wins on routine workflows and stops at human-risk boundaries.

For evaluation, I compared BookMe against the baseline of a manual spreadsheet or front-desk workflow.

I tested realistic examples: valid check-in, checkout, availability, bad booking ID, and a past-date booking request.

BookMe worked best when the data existed and the workflow was routine. It either completed the task through tools or safely stopped. For risky cases like refunds, disputes, payments, cancellations, or ID review, the correct behavior is human handoff.

## Slide 5: A working hosted app, not a notebook.

The final artifact is a hosted Next.js app.

There is a public landing page, a guest-facing hotel site for Sriram Hotel Chennai, an AI front-desk chat, and a hotel owner dashboard.

The GitHub repository includes the code, prompts, tool-backed API routes, setup instructions, and evaluation notes. The main takeaway is that BookMe shows GenAI being useful inside one specific business workflow, grounded in tools rather than just free-form text.
