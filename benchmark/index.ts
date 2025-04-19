import { performance } from "node:perf_hooks";
import Inison from "../src";

/* ------------------------------------------------------------------
   1.  Prepare test corpus
       – 100 000 moderately nested objects (≈ 150 B → 2 KB each)
       – Change ITER or shape as you like.
   ------------------------------------------------------------------ */
const ITER = 100_000;
const DATA: Record<string, any>[] = [];
for (let i = 0; i < ITER; i++) {
	DATA.push({
		id: i,
		name: `User_${i}`,
		age: 18 + (i % 60),
		email: `user_${i}@example.com`,
		active: (i & 1) === 0,
		tags: ["alpha", "beta", ["nested", { flag: true }]],
		bio: `${"Lorem ipsum ".repeat(3)}\nLine break`,
	});
}

/* ------------------------------------------------------------------
   2.  Micro‑benchmark helper
   ------------------------------------------------------------------ */
function bench<T>(label: string, fn: (v: T) => unknown, dataset: T[]): string {
	// warm‑up
	for (const v of dataset) fn(v);

	const t0 = performance.now();
	for (const v of dataset) fn(v);
	const t1 = performance.now();

	const ms = t1 - t0;
	const ops = (dataset.length / (ms / 1000)).toFixed(0);
	return `${label.padEnd(15)} : ${ops} ops/sec  (${ms.toFixed(1)} ms)`;
}

/* ------------------------------------------------------------------
   3.  Run benchmarks
   ------------------------------------------------------------------ */
console.log(`\nBenchmarking on ${ITER.toLocaleString()} objects …`);

const encoded: string[] = new Array(ITER);

console.log(bench("Inison.stringify", (o) => Inison.stringify(o), DATA));

for (let i = 0; i < ITER; i++) encoded[i] = Inison.stringify(DATA[i]);

console.log(
	bench("Inison.unstringify", (s) => Inison.unstringify(s as string), encoded),
);

// ⸺ Optional JSON baseline ──────────────────────────────────────────
console.log(bench("JSON.stringify", (o) => JSON.stringify(o), DATA));

for (let i = 0; i < ITER; i++) encoded[i] = JSON.stringify(DATA[i]);

console.log(bench("JSON.parse     ", (s) => JSON.parse(s as string), encoded));
