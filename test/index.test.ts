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

r.add("PUT", "/long/long1/users/*", "/long/long1/users/*");
r.add("PUT", "/long/long1/users/asdada", "/long/long1/users/asdada");
r.add("PUT", "/long/long1/users/asdada/asdada", "/long/long1/users/asdada/asdada");
r.add("PUT", "/long/long1/users/param/:name", "/long/long1/users/param/:name");

r.add("IPC", "0.0.0.0:3431", "0.0.0.0:3431", { useOriginalPath: true });
r.add("IPC", "/tmp/gaman.sock", "/tmp/gaman.sock", { useOriginalPath: true });

describe("Michi", () => {
  it("root", () => {
    expect(r.find("GET", "/")).toEqual({
      data: "/",
      params: {},
    });
  });

  it("static path", () => {
    expect(r.find("POST", "/qwer")).toEqual({
      data: "/qwer",
      params: {},
    });
  });

  it("long static path", () => {
    expect(r.find("POST", "/qwer/5555")).toEqual({
      data: "/qwer/5555",
      params: {},
    });
  });

  it("with parameter integer", () => {
    expect(r.find("POST", "/update/123")).toEqual({
      data: "/update/:id",
      params: {
        id: 123,
      },
    });
  });

  it("with parameter empty value (optional)", () => {
    expect(r.find("POST", "/create")).toEqual({
      data: "/create/:id?",
      params: {},
    });
  });

  it("with optional boolean parameter", () => {
    expect(r.find("POST", "/create/true")).toEqual({
      data: "/create/:id?",
      params: {
        id: true,
      },
    });
  });

  it("global wildcard", () => {
    // Menangkap rute apa saja di method PUT
    expect(r.find("PUT", "/random-path")).toEqual({
      data: "/*",
      params: {
        "*": "random-path",
      },
    });
  });

  it("scoped wildcard", () => {
    // Menangkap rute di bawah /users/
    expect(r.find("PUT", "/users/testing/123")).toEqual({
      data: "/users/*",
      params: {
        "*": "testing/123",
      },
    });
  });

  it("static priority over wildcard", () => {
    expect(r.find("PUT", "/users/asdada")).toEqual({
      data: "/users/asdada",
      params: {},
    });
  });

  it("deep static priority", () => {
    expect(r.find("PUT", "/users/asdada/asdada")).toEqual({
      data: "/users/asdada/asdada",
      params: {},
    });
  });

  it("wildcard with empty trailing", () => {
    expect(r.find("PUT", "/users")).toEqual({
      data: "/users/*",
      params: {
        "*": "",
      },
    });
  });
  
  
  
  
  it("[Long Wildcard] scoped wildcard", () => {
    // Menangkap rute di bawah /users/
    expect(r.find("PUT", "/long/long1/users/testing/123")).toEqual({
      data: "/long/long1/users/*",
      params: {
        "*": "testing/123",
      },
    });
  });

  it("[Long Wildcard] static priority over wildcard", () => {
    expect(r.find("PUT", "/long/long1/users/asdada")).toEqual({
      data: "/long/long1/users/asdada",
      params: {},
    });
  });

  it("[Long Wildcard] deep static priority", () => {
    expect(r.find("PUT", "/long/long1/users/asdada/asdada")).toEqual({
      data: "/long/long1/users/asdada/asdada",
      params: {},
    });
  });

  it("[Long Wildcard] wildcard with empty trailing", () => {
    expect(r.find("PUT", "/long/long1/users")).toEqual({
      data: "/long/long1/users/*",
      params: {
        "*": "",
      },
    });
  });

  it("parameter priority under shared parent", () => {
    expect(r.find("PUT", "/users/param/angga")).toEqual({
      data: "/users/param/:name",
      params: {
        name: "angga",
      },
    });
  });

  it("ipc tcp", () => {
    expect(r.find("IPC", "0.0.0.0:3431")).toEqual({
      data: "0.0.0.0:3431",
      params: {},
    });
  });

  it("ipc router", () => {
    expect(r.find("IPC", "/tmp/gaman.sock")).toEqual({
      data: "/tmp/gaman.sock",
      params: {},
    });
  });
});
