import { describe, expect, it } from "bun:test";
import { Michi } from "../src/index";

const r = new Michi();
r.add("GET", "/", "/");

r.add("POST", "/qwer", "/qwer");
r.add("POST", "/qwer/5555", "/qwer/5555");

r.add("POST", "/update/:id", "/update/:id");
r.add("POST", "/create/:id?", "/create/:id?");

r.add("PUT", "/*", "/*");
r.add("PUT", "/users/*", "/users/*");
r.add("PUT", "/users/asdada", "/users/asdada");
r.add("PUT", "/users/asdada/asdada", "/users/asdada/asdada");
r.add("PUT", "/users/param/:name", "/users/param/:name");

describe("Michi", () => {
  it("root", () => {
    expect(r.find("GET", "/")).toEqual({
      handle: "/",
      params: {},
    });
  });

  it("static path", () => {
    expect(r.find("POST", "/qwer")).toEqual({
      handle: "/qwer",
      params: {},
    });
  });

  it("long static path", () => {
    expect(r.find("POST", "/qwer/5555")).toEqual({
      handle: "/qwer/5555",
      params: {},
    });
  });

  it("with parameter integer", () => {
    expect(r.find("POST", "/update/123")).toEqual({
      handle: "/update/:id",
      params: {
        id: 123,
      },
    });
  });

  it("with parameter empty value (optional)", () => {
    expect(r.find("POST", "/create")).toEqual({
      handle: "/create/:id?",
      params: {},
    });
  });

  it("with optional boolean parameter", () => {
    expect(r.find("POST", "/create/true")).toEqual({
      handle: "/create/:id?",
      params: {
        id: true,
      },
    });
  });

  it("global wildcard", () => {
    // Menangkap rute apa saja di method PUT
    expect(r.find("PUT", "/random-path")).toEqual({
      handle: "/*",
      params: {
        "*": "random-path",
      },
    });
  });

  it("scoped wildcard", () => {
    // Menangkap rute di bawah /users/
    expect(r.find("PUT", "/users/testing/123")).toEqual({
      handle: "/users/*",
      params: {
        "*": "testing/123",
      },
    });
  });

  it("static priority over wildcard", () => {
    expect(r.find("PUT", "/users/asdada")).toEqual({
      handle: "/users/asdada",
      params: {},
    });
  });

  it("deep static priority", () => {
    expect(r.find("PUT", "/users/asdada/asdada")).toEqual({
      handle: "/users/asdada/asdada",
      params: {},
    });
  });

  it("wildcard with empty trailing", () => {
    expect(r.find("PUT", "/users/")).toEqual({
      handle: "/users/*",
      params: {
        "*": "",
      },
    });
  });

  it("parameter priority under shared parent", () => {
    expect(r.find("PUT", "/users/param/angga")).toEqual({
      handle: "/users/param/:name",
      params: {
        name: "angga",
      },
    });
  });
});
