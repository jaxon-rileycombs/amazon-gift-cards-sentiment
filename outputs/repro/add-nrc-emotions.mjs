import { readFileSync, writeFileSync } from "node:fs";

const [inputPath, lexiconPath, outputPath] = process.argv.slice(2);
if (!inputPath || !lexiconPath || !outputPath)
  throw new Error(
    "Usage: node add-nrc-emotions.mjs INPUT_JSON NRC_LEXICON OUTPUT_JSON",
  );
const report = JSON.parse(readFileSync(inputPath, "utf8"));
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
for (const line of readFileSync(lexiconPath, "utf8").split(/\r?\n/)) {
  const [word, emotion, value] = line.split("\t");
  if (!emotions.includes(emotion) || value !== "1") continue;
  if (!lexicon.has(word)) lexicon.set(word, new Set());
  lexicon.get(word).add(emotion);
}
function score(review) {
  const scores = Object.fromEntries(emotions.map((emotion) => [emotion, 0]));
  const tokens =
    `${review.title || ""} ${review.text || ""}`
      .toLowerCase()
      .match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
  for (const token of tokens)
    for (const emotion of lexicon.get(token) ?? []) scores[emotion] += 1;
  const top = Math.max(...Object.values(scores));
  return {
    nrcScores: scores,
    nrcEmotion:
      top === 0 ? "none" : emotions.find((emotion) => scores[emotion] === top),
  };
}
report.results = report.results.map((review) => ({
  ...review,
  ...score(review),
}));
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
