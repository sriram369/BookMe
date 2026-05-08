#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const baseUrl = process.env.BOOKME_BASE_URL ?? "http://localhost:3000";
const hotelSlug = process.env.BOOKME_HOTEL_SLUG ?? "sriram-hotel";

const today = new Date();
const iso = (date) => date.toISOString().slice(0, 10);
const plusDays = (days) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return iso(date);
};

const replacements = {
  "{{YESTERDAY}}": plusDays(-1),
  "{{TODAY}}": plusDays(0),
  "{{TODAY_PLUS_1}}": plusDays(1),
  "{{TODAY_PLUS_7}}": plusDays(7),
  "{{TODAY_PLUS_9}}": plusDays(9),
  "{{TODAY_PLUS_10}}": plusDays(10),
  "{{TODAY_PLUS_12}}": plusDays(12),
};

function fillTemplate(value) {
  return Object.entries(replacements).reduce(
    (text, [token, replacement]) => text.replaceAll(token, replacement),
    value,
  );
}

function containsAll(actual, expected) {
  return expected.every((tool) => actual.includes(tool));
}

function responseIncludesAll(message, expected) {
  const lower = message.toLowerCase();
  return expected.every((phrase) => lower.includes(String(phrase).toLowerCase()));
}

async function callAgent(messages) {
  const response = await fetch(`${baseUrl}/api/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, hotelSlug }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message ?? `HTTP ${response.status}`);
  }
  return data;
}

async function resetSeedData() {
  try {
    const response = await fetch(`${baseUrl}/api/connectors/seed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true }),
    });

    const data = await response.json().catch(() => undefined);
    if (response.ok) {
      console.log(`Seed reset: ${data?.message ?? "demo data reset"}\n`);
      return;
    }

    console.log("Seed reset skipped: Google Sheets connector is not configured.\n");
  } catch {
    console.log("Seed reset skipped: seed endpoint was not available.\n");
  }
}

async function runCase(testCase) {
  const messages = [];
  let latest;

  for (const content of testCase.messages.map(fillTemplate)) {
    messages.push({ role: "user", content });
    latest = await callAgent(messages);
    messages.push({ role: "assistant", content: latest.message });
  }

  const toolCalls = latest?.toolCalls ?? [];
  const message = latest?.message ?? "";
  const passedToolCheck = containsAll(toolCalls, testCase.expectedToolCalls);
  const passedResponseCheck = responseIncludesAll(message, testCase.expectedResponseIncludes ?? []);

  return {
    id: testCase.id,
    category: testCase.category,
    passed: passedToolCheck && passedResponseCheck,
    passedToolCheck,
    passedResponseCheck,
    expectedToolCalls: testCase.expectedToolCalls,
    expectedResponseIncludes: testCase.expectedResponseIncludes ?? [],
    actualToolCalls: toolCalls,
    message,
    cardTitle: latest?.card?.title,
    cardStatus: latest?.card?.status,
  };
}

const raw = await readFile(new URL("./test_cases.json", import.meta.url), "utf8");
const testCases = JSON.parse(raw);

console.log(`Running BookMe eval against ${baseUrl}`);
console.log("The runner attempts to reset Google Sheets demo data when that connector is configured.\n");

await resetSeedData();

const results = [];
for (const testCase of testCases) {
  try {
    const result = await runCase(testCase);
    results.push(result);
    console.log(`${result.passed ? "PASS" : "CHECK"} ${result.id}`);
    console.log(`  expected tools: ${result.expectedToolCalls.join(", ") || "(none)"}`);
    console.log(`  actual tools:   ${result.actualToolCalls.join(", ") || "(none)"}`);
    if (result.expectedResponseIncludes.length > 0) {
      console.log(`  expected text:  ${result.expectedResponseIncludes.join(", ")}`);
    }
    console.log(`  response:       ${result.message}`);
    if (result.cardTitle) {
      console.log(`  card:           ${result.cardTitle} / ${result.cardStatus}`);
    }
  } catch (error) {
    results.push({
      id: testCase.id,
      category: testCase.category,
      passed: false,
      passedToolCheck: false,
      passedResponseCheck: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`FAIL ${testCase.id}`);
    console.log(`  error: ${error instanceof Error ? error.message : String(error)}`);
  }
  console.log("");
}

const passed = results.filter((result) => result.passed).length;
console.log(`Eval check: ${passed}/${results.length} cases passed.`);

if (passed < results.length) {
  process.exitCode = 1;
}
