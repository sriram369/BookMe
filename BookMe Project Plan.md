# BookMe Project Plan

## 1. Project Title

**BookMe — A Conversational Front-Desk Agent for Hotel Guests**

## 2. Target User, Workflow, and Business Value

**Target user:** A hotel guest at a mid-size independent hotel with roughly 50 to 200 rooms who needs to book a room, check in on arrival, or check out at departure without waiting for front-desk staff.

**Recurring task being improved:** BookMe improves the full front-desk interaction. A guest can book a room by providing dates and preferences, check in by verifying an existing reservation through phone number or email, or check out at the end of a stay. Today, these workflows usually require a staff member, a phone call, or a rigid multi-page booking form.

**Workflow start and end:**

- **Begins:** The guest opens the hotel's web app and types a natural-language message, such as: "Hi, I have a booking under +1-617-555-0192, and I want to check in."
- **Ends:** BookMe creates and confirms a new booking, marks the guest as checked in, or marks the guest as checked out, then displays a structured summary card to the guest.

**Business value:** Independent hotels lose booking inquiries to abandoned phone calls, busy lines, after-hours requests, and long hold times. Check-in lines during peak hours also frustrate guests and require extra staffing. A 24/7 self-service front-desk agent that handles booking, check-in, and check-out in under two minutes can reduce labor cost, prevent missed bookings, and improve guest experience.

## 3. Problem Statement and GenAI Fit

**Task the system performs:** Given a guest's natural-language input, BookMe identifies whether the guest wants to book a room, check in, or check out. It then calls the appropriate tools against a live Google Sheets reservation database and completes the transaction. The result is confirmed back to the guest in clear language.

**Why language models are useful:** Guests do not naturally speak in structured form fields. They say things like, "I'd like a room for me and my wife next Friday for two nights, something quiet," or "I think I have a reservation, my number is 617-555-0192." The model must extract intent, identify missing details, ask follow-up questions, resolve ambiguity, and call the correct tool sequence.

**Why a simpler non-GenAI tool is not enough:** A traditional booking form can handle only new reservations through a rigid step-by-step flow. It cannot naturally handle multi-turn clarification, partial booking lookups, or a unified booking/check-in/check-out workflow. A rule-based chatbot would struggle with partially matching bookings, ambiguous dates, and explaining unavailable room types while suggesting reasonable alternatives.

## 4. Planned System Design and Baseline

### Architecture

```text
Guest browser
  |
  | Natural-language message
  v
Next.js frontend
  - Hotel-branded chat UI
  - Tailwind CSS
  - Guest-facing summary cards
  |
  v
Next.js API route: /api/agent
  - OpenAI GPT-4o-mini with tool use
  - System prompt with hotel rules and safety boundaries
  - Low temperature for accuracy
  - Structured booking/check-in/check-out outputs
  |
  | Tools
  |-- lookup_guest(identifier)
  |-- check_availability(checkin, checkout, room_type)
  |-- create_booking(guest_name, phone, email, room_id, checkin, checkout)
  |-- checkin_guest(booking_id)
  |-- checkout_guest(booking_id)
  |
  v
Google Sheets
  - Reservations sheet
  - Inventory sheet
  |
  v
Guest receives a structured confirmation card
```

### Tools

**lookup_guest(identifier: string)**  
Searches the reservation sheet for a matching phone number, email address, or booking ID. Returns a booking record or a not-found result.

**check_availability(checkin: string, checkout: string, room_type: string)**  
Reads the inventory and reservation sheets, then returns available rooms and pricing for the requested stay.

**create_booking(guest_name, phone, email, room_id, checkin, checkout)**  
Creates a new booking in the reservations sheet after re-checking availability at write time. Returns a generated confirmation number.

**checkin_guest(booking_id: string)**  
Updates the reservation status to `Checked In`, records a timestamp, and returns the room number and welcome message.

**checkout_guest(booking_id: string)**  
Updates the reservation status to `Checked Out`, records a timestamp, and returns the stay summary, including nights stayed and total charge.

### Data Model

**Reservations sheet:**

- `booking_id`
- `guest_name`
- `phone`
- `email`
- `room_id`
- `checkin`
- `checkout`
- `status`
- `created_at`
- `checked_in_at`
- `checked_out_at`

**Inventory sheet:**

- `room_id`
- `room_type`
- `price_per_night`
- `floor`
- `view`
- `max_guests`
- `is_active`

### Course Concepts Integrated

**Tool Use / Function Calling:** BookMe exposes five callable tools to the model. The model chooses which tool to call and in what order. For example, a check-in request should call `lookup_guest` first, then call `checkin_guest` only after a reservation is found. A booking request should call `check_availability` before `create_booking`. The Google Sheets backend acts as the live source of truth, so the model should never invent availability, prices, room numbers, or booking IDs.

**Evaluation Design:** A 20-case test set will live in `eval/test_cases.json`. It will cover standard bookings, check-in flows, check-out flows, edge cases, and adversarial inputs. Each case will define the input message, expected tool behavior, and expected outcome. The evaluation will measure task completion, data accuracy, refusal correctness, response naturalness, latency, and approximate cost.

### Baseline

The baseline is a prompt-only assistant with no tools. It receives the same 20 test messages but cannot access live reservations, availability, or write operations. This should make the comparison honest: the prompt-only version may sound helpful, but it cannot complete real transactions. BookMe should outperform the baseline on task completion and data accuracy because it is grounded in tool calls and live data.

## 5. App Description

The guest opens a Next.js web app styled as a hotel front-desk kiosk. The page shows the hotel name, a short welcome message, and a chat input. The guest types naturally.

When a booking is confirmed, BookMe displays a structured card with the room type, floor, dates, nightly price, total price, and booking ID.

When check-in succeeds, BookMe displays the room number and a "Your key is ready" style welcome message.

When check-out succeeds, BookMe displays nights stayed, total charge, and checkout status.

An `/admin` route will show live reservation and inventory data for the demo. It will be protected by a static password stored in an environment variable.

## 6. Evaluation Plan

### Success Criteria

BookMe should correctly complete the intended transaction in at least 80% of valid test cases and correctly refuse or ask for clarification in at least 90% of invalid or out-of-scope cases.

| Metric | Target | Measurement |
|---|---:|---|
| Task completion rate for valid cases | >= 80% | Compare final tool outcome against expected outcome |
| Data accuracy for dates, price, and room ID | >= 95% | Exact match on structured output fields |
| Refusal correctness for invalid inputs | >= 90% | Check for refusal or clarification signal |
| Response naturalness | >= 3.5 / 5 average | Model-as-judge plus manual spot checks |
| First response latency | <= 5 seconds | Timed in eval runner |
| Cost per session | <= $0.01 | Estimated from token usage |

### Test Set

The evaluation set will include 20 scripted cases:

- 6 new booking cases across different room types, date ranges, and guest profiles
- 4 check-in cases using phone and email lookup
- 3 check-out cases for valid checked-in guests
- 4 edge cases, including unavailable rooms, invalid date ranges, guest not found, and dates in the past
- 3 adversarial cases, including prompt injection, requests to skip confirmation, and requests for a free room

### Baseline Comparison

The same 20 cases will run through the no-tools baseline. Results will be compared side by side for task completion rate, data accuracy, and response naturalness.

Expected outcome: BookMe should reach at least 80% task completion, while the baseline should be near 0% for real transaction completion because it has no tools.

## 7. Example Inputs and Expected Behavior

1. **Booking:**  
   "Hi, I'd like to book a king room for 2 nights starting April 25th. My name is Priya Sharma, email priya@example.com."  
   Expected behavior: BookMe checks availability, presents a summary, asks for confirmation, creates the booking after explicit confirmation, and returns a booking ID.

2. **Check-in:**  
   "I'm checking in. My phone number is 617-555-0192."  
   Expected behavior: BookMe looks up the reservation, verifies it is eligible for check-in, marks the guest as checked in, and returns the room number.

3. **Check-out:**  
   "I want to check out, booking ID HDA-0047."  
   Expected behavior: BookMe checks out the guest and returns a stay summary with nights stayed and total charge.

4. **Ambiguous dates:**  
   "Do you have anything available this weekend? Just need something basic."  
   Expected behavior: BookMe asks for date clarification before checking availability.

5. **Out of scope:**  
   "I want to cancel my booking."  
   Expected behavior: BookMe refuses to handle cancellations directly and redirects the guest to front-desk staff.

## 8. Anticipated Failure Cases

**Relative date parsing error:** Phrases like "next Friday" can be resolved incorrectly if the server does not provide the current date. Mitigation: inject the current ISO date into the system prompt on every request.

**Double booking:** Two sessions could check availability at the same time and try to book the same room. Mitigation: `create_booking` must re-check availability immediately before writing the booking.

**Partial guest identifier:** A guest may provide only part of a phone number or an incomplete email. Mitigation: BookMe should ask for the full phone number, email address, or booking ID instead of guessing.

**Hallucinated booking details:** The model may try to state a booking ID, room number, or price without a tool result. Mitigation: the system prompt and response code should require tool-grounded values for those fields.

## 9. Risks and Governance

BookMe should not be trusted for payment processing, cancellations, refunds, group bookings, corporate rates, complaints, or accessibility accommodation requests that require human judgment.

Controls:

- `create_booking` requires explicit user confirmation before writing a reservation.
- Out-of-scope requests redirect to human staff.
- Guest data used in the demo is synthetic.
- API keys and Google credentials live in `.env.local` and are never committed.
- The admin panel is protected by an environment-variable password.
- The model is instructed never to invent room availability, room numbers, prices, or booking IDs.

## 10. Week 6 Check-In Target

By the Week 6 check-in, BookMe should have:

- A Next.js app running locally
- A polished hotel front-desk chat UI
- Tool-backed booking and check-in happy paths
- Basic check-out support
- Google Sheets-backed reservations and inventory
- Basic refusal rules
- An `/admin` panel showing live sheet data
- A 20-case eval file
- An automated eval runner producing `eval/results.json`
- A prompt-only baseline for side-by-side comparison

Items that can wait until after the Week 6 check-in:

- Model-as-judge naturalness scoring
- Full adversarial eval coverage
- Vercel deployment
- Public demo URL
- Final README with reproducibility instructions

## 11. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend and backend | Next.js 14 App Router | Single repo with API routes for AI and Sheets |
| Styling | Tailwind CSS | Fast, clean UI implementation |
| AI | OpenAI GPT-4o-mini with tool use | Good cost and quality for structured tool calling |
| Database | Google Sheets via `googleapis` | Easy to inspect and demo live |
| Deployment | Vercel | Simple GitHub-based deployment |

## 12. MVP Build Order

To reduce risk, BookMe should be built in this order:

1. Create the Next.js app shell and hotel chat UI.
2. Implement local mock tools using seeded JSON data.
3. Complete booking, check-in, and check-out flows with mock data.
4. Add summary cards for each successful transaction.
5. Swap mock storage for Google Sheets.
6. Add the `/admin` panel.
7. Add the eval runner and baseline comparison.
8. Deploy to Vercel after the local demo is stable.

