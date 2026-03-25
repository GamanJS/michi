import { expect, test } from "bun:test";
import { Michi } from "../src/index";

test("prefix collision between /ping and /protected", () => {
  const router = new Michi<string>();
  router.add("GET", "/ping", "ping_handler");
  router.add("GET", "/protected", "protected_handler");

  expect(router.find("GET", "/ping")?.data).toBe("ping_handler");
  expect(router.find("GET", "/protected")?.data).toBe("protected_handler");
});

test("prefix collision with same first char segments", () => {
  const router = new Michi<string>();
  router.add("GET", "/abc", "abc");
  router.add("GET", "/abd", "abd");

  expect(router.find("GET", "/abc")?.data).toBe("abc");
  expect(router.find("GET", "/abd")?.data).toBe("abd");
});
