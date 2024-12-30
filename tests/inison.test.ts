import { strict as assert } from "node:assert";
import { test } from "node:test";

import Inison, { stringify, unstringify } from "../src/index.js";

await test("stringify", async (t) => {
	await t.test(
		"should correctly stringify a simple object with imported ES6 function",
		() => {
			const obj = { name: "John", age: 30, active: true };
			const result = stringify(obj);
			assert.strictEqual(result, "{name:John,age:30,active:true}");
		},
	);

	await t.test("should correctly stringify a simple object", () => {
		const obj = { name: "John", age: 30, active: true };
		const result = Inison.stringify(obj);
		assert.strictEqual(result, "{name:John,age:30,active:true}");
	});

	await t.test("should correctly stringify an array", () => {
		const arr = [1, "hello", true, null];
		const result = Inison.stringify(arr);
		assert.strictEqual(result, "[1,hello,true,null]");
	});

	await t.test("should handle nested objects", () => {
		const obj = { user: { name: "Alice", details: { age: 25 } } };
		const result = Inison.stringify(obj);
		assert.strictEqual(result, "{user:{name:Alice,details:{age:25}}}");
	});

	await t.test("should handle nested arrays", () => {
		const arr = [
			[1, 2],
			["a", "b"],
			[true, false],
		];
		const result = Inison.stringify(arr);
		assert.strictEqual(result, "[[1,2],[a,b],[true,false]]");
	});

	await t.test("should escape special characters", () => {
		const obj = { text: "hello, world!" };
		const result = Inison.stringify(obj);
		assert.strictEqual(result, "{text:hello\\, world!}");
	});

	await t.test("should return 'null' for null input", () => {
		const result = Inison.stringify(null);
		assert.strictEqual(result, "null");
	});

	await t.test("should return 'undefined' for undefined input", () => {
		const result = Inison.stringify(undefined);
		assert.strictEqual(result, "undefined");
	});
});

await test("unstringify", async (t) => {
	await t.test(
		"should correctly parse a simple object string with imported ES6 function",
		() => {
			const str = "{name:John,age:30,active:true}";
			const result = unstringify(str);
			assert.deepStrictEqual(result, { name: "John", age: 30, active: true });
		},
	);

	await t.test("should correctly parse a simple object string", () => {
		const str = "{name:John,age:30,active:true}";
		const result = Inison.unstringify(str);
		assert.deepStrictEqual(result, { name: "John", age: 30, active: true });
	});

	await t.test("should correctly parse an array string", () => {
		const str = "[1,hello,true,null]";
		const result = Inison.unstringify(str);
		assert.deepStrictEqual(result, [1, "hello", true, null]);
	});

	await t.test("should handle nested objects", () => {
		const str = "{user:{name:Alice,details:{age:25}}}";
		const result = Inison.unstringify(str);
		assert.deepStrictEqual(result, {
			user: { name: "Alice", details: { age: 25 } },
		});
	});

	await t.test("should handle nested arrays", () => {
		const str = "[[1,2],[a,b],[true,false]]";
		const result = Inison.unstringify(str);
		assert.deepStrictEqual(result, [
			[1, 2],
			["a", "b"],
			[true, false],
		]);
	});

	await t.test("should unescape special characters", () => {
		const str = "{text:hello\\, world!}";
		const result = Inison.unstringify(str);
		assert.deepStrictEqual(result, { text: "hello, world!" });
	});

	await t.test("should return null for 'null' string", () => {
		const result = Inison.unstringify("null");
		assert.strictEqual(result, null);
	});

	await t.test("should return undefined for 'undefined' string", () => {
		const result = Inison.unstringify("undefined");
		assert.strictEqual(result, undefined);
	});

	await t.test("should handle malformed input", () => {
		const str = "{name:John,age:30";
		const result = Inison.unstringify(str);
		assert.deepStrictEqual(result, { name: "John", age: 30 });
	});
});
