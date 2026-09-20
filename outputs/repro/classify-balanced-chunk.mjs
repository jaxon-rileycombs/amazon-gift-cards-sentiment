import { existsSync, readFileSync, writeFileSync } from "node:fs";
const start = Number(process.argv[2]),
  end = Number(process.argv[3]);
if (
  !Number.isInteger(start) ||
  !Number.isInteger(end) ||
  start < 0 ||
  end > 150 ||
  start >= end
)
  throw Error("Usage: node classify-balanced-chunk.mjs START END");
const sample = JSON.parse(
  readFileSync("outputs/gift-cards-balanced-150-sample.json", "utf8"),
);
const progressPath = "outputs/gift-cards-balanced-150-progress.json";
const progress = existsSync(progressPath)
  ? JSON.parse(readFileSync(progressPath, "utf8"))
  : {};
const emotions = [
  "anger",
  "anticipation",
  "disgust",
  "fear",
  "joy",
  "sadness",
  "surprise",
  "trust",
];
const lexicon = new Map();
for (const line of readFileSync(
  "work/NRC-emotion-lexicon-v0.92.txt",
  "utf8",
).split(/\r?\n/)) {
  const [w, e, v] = line.split("\t");
  if (emotions.includes(e) && v === "1") {
    if (!lexicon.has(w)) lexicon.set(w, new Set());
    lexicon.get(w).add(e);
  }
}
function scoreNrc(r) {
  const scores = Object.fromEntries(emotions.map((e) => [e, 0]));
  const tokens =
    `${r.title || ""} ${r.text || ""}`
      .toLowerCase()
      .match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
  for (const t of tokens) for (const e of lexicon.get(t) ?? []) scores[e]++;
  const max = Math.max(...Object.values(scores));
  return {
    scores,
    emotion: max === 0 ? "none" : emotions.find((e) => scores[e] === max),
    matchedWords: tokens.filter((t) => lexicon.has(t)).length,
  };
}
function prompt(r) {
  return `You classify Amazon Gift Cards reviews. Use only the review title and text. Never use, request, infer from, or mention a star rating or any external information.\n\nReturn two labels:\n- sentiment: POSITIVE for an overall favorable experience or recommendation; NEUTRAL for mixed, ambivalent, merely factual, or no-clear-valence content; NEGATIVE for an unfavorable experience, complaint, warning, failure, or negative recommendation.\n- primaryEmotion: exactly one lowercase value from anger, anticipation, disgust, fear, joy, sadness, surprise, trust. Choose the emotion most central to the reviewer’s expressed experience.\n\nRules: The body outweighs the title if they conflict. For mixed feedback, use the final overall judgment. Clearly approving terse reviews are POSITIVE; clear complaints, failures, or angry terse reviews are NEGATIVE. Use NEUTRAL when the content does not support a clear favorable or unfavorable judgment.\n\nReturn valid JSON only: {\"sentiment\":\"POSITIVE\",\"primaryEmotion\":\"joy\"}\n\nReview title: ${r.title || ""}\nReview text: ${r.text || ""}`;
}
async function one(i) {
  const r = sample.results[i];
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) throw Error("Set LLM_API_KEY before scoring");
  const res = await fetch("http://dobolyi.com:9001/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "cyankiwi/Qwen3.6-35B-A3B-AWQ-4bit",
      temperature: 0,
      messages: [{ role: "user", content: prompt(r) }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw Error("HTTP " + res.status);
  const value = JSON.parse(
    (await res.json()).choices?.[0]?.message?.content?.trim() ?? "",
  );
  if (
    !["POSITIVE", "NEUTRAL", "NEGATIVE"].includes(value.sentiment) ||
    !emotions.includes(value.primaryEmotion)
  )
    throw Error("Invalid model response");
  const nrc = scoreNrc(r);
  progress[i] = {
    prediction: value.sentiment,
    llmEmotion: value.primaryEmotion,
    nrcEmotion: nrc.emotion,
    nrcScores: nrc.scores,
    nrcMatchedWords: nrc.matchedWords,
    emotionAgreement: value.primaryEmotion === nrc.emotion,
  };
  console.log(i + 1);
}
await Promise.all(
  Array.from({ length: end - start }, (_, x) => one(start + x)),
);
writeFileSync(progressPath, JSON.stringify(progress, null, 2) + "\n");
