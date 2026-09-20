import { createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';

const source = '/private/tmp/gift-cards-first-batch.jsonl.gz';
const classes = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];
const buckets = Object.fromEntries(classes.map((label) => [label, []]));
const seen = Object.fromEntries(classes.map((label) => [label, 0]));
let seed = 20260920;
const random = () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const labelFor = (rating) => rating >= 4 ? 'POSITIVE' : rating === 3 ? 'NEUTRAL' : 'NEGATIVE';
const lineReader = createInterface({ input: createReadStream(source).pipe(createGunzip()) });
for await (const line of lineReader) {
  if (!line.trim()) continue;
  const review = JSON.parse(line); const label = labelFor(review.rating); seen[label] += 1;
  const bucket = buckets[label];
  if (bucket.length < 50) bucket.push(review);
  else { const replacement = Math.floor(random() * seen[label]); if (replacement < 50) bucket[replacement] = review; }
}
if (classes.some((label) => buckets[label].length !== 50)) throw new Error('Not enough reviews in one class');
const results = classes.flatMap((label) => buckets[label].map((review, index) => ({ index: `${label[0]}${String(index + 1).padStart(2, '0')}`, title: review.title, text: review.text, rating: review.rating, ratingLabel: label, verifiedPurchase: review.verified_purchase, helpfulVote: review.helpful_vote, asin: review.asin })));
mkdirSync('outputs', { recursive: true });
writeFileSync('outputs/gift-cards-balanced-150-sample.json', JSON.stringify({ source: 'Amazon Reviews 2023 / Gift Cards', seed: 20260920, sampling: 'Independent seeded reservoir samples from the full gzipped file: 50 POSITIVE (4–5★), 50 NEUTRAL (3★), 50 NEGATIVE (1–2★).', total: results.length, sourceClassCounts: seen, results }, null, 2)+'\n');
console.log(JSON.stringify({ seed: 20260920, selected: Object.fromEntries(classes.map((label) => [label, buckets[label].length])), sourceClassCounts: seen }));
