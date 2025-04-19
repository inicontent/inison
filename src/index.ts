type Primitive = string | number | boolean | null | undefined;
export type Data = Primitive | Data[] | { [k: string]: Data };

/* ─────────── delimiter table (charCode → bool) ─────────── */

const DELIMS = new Uint8Array(128); // 1 = delimiter
for (const code of [44, 58, 123, 125, 91, 93, 10]) // , : { } [ ] \n
	DELIMS[code] = 1;
const isDelim = (code: number) => code < 128 && DELIMS[code] === 1;

/* ─────────── escape / unescape helpers ─────────── */

const RE_NEEDS_ESCAPE = /[,:{}\[\]\n]/; // quick test
const RE_ESCAPE = /[,:{}\[\]\n]/g; // during stringify
const RE_UNESCAPE = /\\(n|[,:{}\[\]])/g; // during parse

const needsEscape = (s: string) => RE_NEEDS_ESCAPE.test(s);

const escapeStr = (s: string) =>
	s.replace(RE_ESCAPE, (ch) => (ch === "\n" ? "\\n" : `\\${ch}`));

const unescapeStr = (s: string) =>
	s.replace(RE_UNESCAPE, (_, ch) => (ch === "n" ? "\n" : ch));

/* ─────────── hybrid builders for arrays / objects ─────────── */

const THRESHOLD = 32; // switch point

function buildArray(arr: readonly Data[]): string {
	if (arr.length < THRESHOLD) {
		let out = "[";
		for (let i = 0; i < arr.length; ++i) {
			if (i) out += ",";
			out += stringify(arr[i]);
		}
		return `${out}]`;
	}
	const parts = new Array<string>(arr.length);
	for (let i = 0; i < arr.length; ++i) parts[i] = stringify(arr[i]);
	return `[${parts.join(",")}]`;
}

function buildObject(obj: { [k: string]: Data }): string {
	const keys = Object.keys(obj);
	if (keys.length < THRESHOLD) {
		let out = "{";
		for (let i = 0; i < keys.length; ++i) {
			const k = keys[i]!;
			if (i) out += ",";
			out += `${k}:${stringify((obj as any)[k])}`;
		}
		return `${out}}`;
	}
	const parts = new Array<string>(keys.length);
	for (let i = 0; i < keys.length; ++i) {
		const k = keys[i]!;
		parts[i] = `${k}:${stringify((obj as any)[k])}`;
	}
	return `{${parts.join(",")}}`;
}

/* ─────────── stringify ─────────── */

export function stringify(data: Data): string {
	if (data == null) return String(data); // null | undefined
	if (Array.isArray(data)) return buildArray(data);
	if (typeof data === "object") return buildObject(data as any);

	const s = String(data);
	return needsEscape(s) ? escapeStr(s) : s;
}

/* ─────────── unstringify / streaming parser ─────────── */

let src = ""; // shared input
let pos = 0; // cursor

export function unstringify<T = any>(input: string): T | null | undefined {
	if (input === "null") return null;
	if (input === "undefined") return undefined;
	src = input;
	pos = 0;
	return parse() as T;
}

function parse(): Data {
	const ch = src[pos];

	if (ch === "[") return parseArray();
	if (ch === "{") return parseObject();

	// primitive
	const start = pos;
	const n = src.length;

	while (pos < n) {
		const code = src.charCodeAt(pos);
		if (isDelim(code)) break;
		if (code === 92 /* \ */ && pos + 1 < n) {
			pos += 2;
			continue;
		}
		++pos;
	}

	const raw = src.slice(start, pos);

	if (raw.includes("\\")) return unescapeStr(raw);
	if (raw === "true") return true;
	if (raw === "false") return false;
	if (raw === "null") return null;
	if (raw === "undefined") return undefined;

	const num = Number(raw);
	return Number.isFinite(num) && String(num) === raw ? num : raw;
}

function parseArray(): Data[] {
	++pos; // skip '['
	const out: Data[] = [];
	while (src[pos] !== "]") {
		out.push(parse());
		if (src[pos] === ",") ++pos; // skip ','
	}
	++pos; // skip ']'
	return out;
}

function parseObject(): { [k: string]: Data } {
	++pos; // skip '{'
	const out: { [k: string]: Data } = {};
	while (src[pos] !== "}") {
		const key = parse() as string;
		++pos; // skip ':'
		out[key] = parse();
		if (src[pos] === ",") ++pos; // skip ','
	}
	++pos; // skip '}'
	return out;
}

/* ─────────── façade ─────────── */

export default class Inison {
	static stringify = stringify;
	static unstringify = unstringify;
}
