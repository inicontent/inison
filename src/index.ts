type valueT = string | number | boolean | null | undefined;
type objT = Record<string, valueT>;
type arrT = valueT[];

const specialCharsArr = [",", ":", "[", "]", "{", "}"];
const specialChars = new Set(specialCharsArr);
let index: number;
let s: string;

function stringify(obj: valueT | objT | arrT): string {
	if (obj === undefined || obj === null) return String(obj);

	if (Array.isArray(obj)) return `[${obj.map(stringify).join(",")}]`;

	if (typeof obj === "object" && obj !== null) {
		const objKeys = Object.keys(obj);
		const result: string[] = [];

		for (const key of objKeys) result.push(`${key}:${stringify(obj[key])}`);

		return `{${result.join(",")}}`;
	}
	const stringifiedObj = String(obj);
	return specialCharsArr.some((char) => stringifiedObj.indexOf(char))
		? escapeSpecialChars(stringifiedObj)
		: stringifiedObj;
}

function unstringify(input: string) {
	if (input === "null") return null;
	if (input === "undefined") return undefined;

	index = 0;
	s = input;

	return parseValue();
}

function parseArray() {
	const array: arrT = [];
	const len = s.length;

	index++; // skip '['
	while (index < len && s[index] !== "]") {
		array.push(parseValue() as valueT);
		if (s[index] === ",") index++; // skip ','
	}
	index++; // skip ']'
	return array;
}

function parseObject() {
	const obj: objT = {};
	const len = s.length;

	index++; // skip '{'
	while (index < len && s[index] !== "}") {
		const [key, value] = parseKeyValue();
		obj[key] = value;

		if (s[index] === ",") index++; // skip ','
	}
	index++; // skip '}'
	return obj;
}

function parseKeyValue(): [string, valueT] {
	const key = parseValue() as string;

	if (s[index] !== ":") throw new Error('Expected ":" after key');

	index++; // skip ':'
	const value = parseValue() as valueT;

	return [key, value];
}

function parseValue(): valueT | objT | arrT {
	const len = s.length;
	const start = index;

	if (s[index] === "[" || s[index] === "{")
		return s[index] === "[" ? parseArray() : parseObject();

	while (index < len && !specialChars.has(s[index]))
		index += s[index] === "\\" && specialChars.has(s[index + 1]) ? 2 : 1; // Skip both '\\' and ','

	const parsedValue = s.slice(start, index);

	if (parsedValue === "") return null;
	if (parsedValue.indexOf("\\") !== -1)
		return unescapeSpecialChars(parsedValue);
	if (parsedValue === "false") return false;
	if (parsedValue === "null") return null;
	if (parsedValue === "undefined") return undefined;
	if (parsedValue === "true") return true;

	const numParsedValue = Number(parsedValue);

	// Check if the parsed value is a number and convert it
	if (
		Number.isInteger(numParsedValue) &&
		parsedValue !== null &&
		parsedValue.at(0) !== "0"
	)
		return numParsedValue;

	return parsedValue;
}

function unescapeSpecialChars(value: string): string {
	let unescapedValue = "";
	const len = value.length;

	for (let i = 0; i < len; i++) {
		if (value[i] === "\\" && i + 1 < len) {
			const nextChar = value[i + 1];
			if (specialChars.has(nextChar)) {
				unescapedValue += nextChar;
				i++;
				continue;
			}
		}
		unescapedValue += value[i];
	}

	return unescapedValue;
}

function escapeSpecialChars(value: string): string {
	let escapedValue = "";
	const len = value.length;

	for (let i = 0; i < len; i++) {
		const char = value[i];
		if (specialChars.has(char)) escapedValue += "\\";
		escapedValue += char;
	}

	return escapedValue;
}

export default class Inison {
	static stringify = stringify;
	static unstringify = unstringify;
}
