import test from "node:test";
import assert from "node:assert/strict";
import { generateJoinCode, joinCodesMatch } from "../src/utils/joinCode.js";

test("join codes look random and compare case-insensitively", () => {
  const a = generateJoinCode();
  const b = generateJoinCode();
  assert.match(a, /^[0-9A-F]{10}$/);
  assert.notEqual(a, b);
  assert.equal(joinCodesMatch(a, a.toLowerCase()), true);
  assert.equal(joinCodesMatch(a, ` ${a} `), true);
});

test("join code rejects wrong, missing and non-string input", () => {
  const a = generateJoinCode();
  assert.equal(joinCodesMatch(a, "WRONG"), false);
  assert.equal(joinCodesMatch(a, undefined), false);
  assert.equal(joinCodesMatch(undefined, a), false);
  assert.equal(joinCodesMatch(a, { $ne: 1 }), false);
  assert.equal(joinCodesMatch("", ""), false);
});
