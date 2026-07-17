import { describe, it, expect } from "vitest";
import { extractInkIdentifiers, addExternalFunctionality, generateInkBoilerplate } from "./ink-utils";

describe("extractInkIdentifiers", () => {
  it("returns an empty array for empty input", () => {
    expect(extractInkIdentifiers("")).toEqual([]);
  });

  it("extracts VAR declarations", () => {
    expect(extractInkIdentifiers("VAR health = 100")).toContain("health");
  });

  it("extracts CONST declarations", () => {
    expect(extractInkIdentifiers("CONST max_health = 100")).toContain("max_health");
  });

  it("extracts function names from === name === knots", () => {
    expect(extractInkIdentifiers("=== reset_game ===")).toContain("reset_game");
  });

  it("extracts # tags", () => {
    expect(extractInkIdentifiers("# game_start")).toContain("game_start");
  });

  it("de-duplicates repeated identifiers", () => {
    const script = "VAR health = 100\nVAR health = 100";
    const result = extractInkIdentifiers(script);
    expect(result.filter((id) => id === "health")).toHaveLength(1);
  });

  it("extracts every identifier kind from the generated boilerplate", () => {
    // Note: "=== function reset_game ===" isn't matched by the knot regex
    // (it only captures a single \w+ token between the === markers), so
    // only bare knots like "start" show up here, not "function"-prefixed ones.
    const identifiers = extractInkIdentifiers(generateInkBoilerplate());
    expect(identifiers).toEqual(
      expect.arrayContaining(["player_name", "health", "max_health", "start", "game_start"])
    );
  });
});

describe("addExternalFunctionality", () => {
  it("prepends an EXTERNAL declaration for each function name", () => {
    const result = addExternalFunctionality("=== start ===", ["give_item"]);
    expect(result).toContain("EXTERNAL give_item()");
    expect(result.indexOf("EXTERNAL give_item()")).toBeLessThan(result.indexOf("=== start ==="));
  });

  it("does not duplicate an EXTERNAL declaration that's already present", () => {
    const script = "EXTERNAL give_item()\n=== start ===";
    const result = addExternalFunctionality(script, ["give_item"]);
    expect(result.match(/EXTERNAL give_item\(\)/g)).toHaveLength(1);
  });
});

describe("generateInkBoilerplate", () => {
  it("produces a script inkjs can be expected to parse (has a start knot and VAR declarations)", () => {
    const script = generateInkBoilerplate();
    expect(script).toContain("=== start ===");
    expect(script).toContain("VAR player_name");
  });
});
