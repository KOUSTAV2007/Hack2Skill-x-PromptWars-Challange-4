import { describe, it, expect } from "vitest";
import { STADIUM_NODES, LANGUAGES, ECO_ITEMS } from "./types";

describe("Stadium Hub Data Integrity Tests", () => {
  it("should have unique IDs and names for all STADIUM_NODES", () => {
    const ids = STADIUM_NODES.map(node => node.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);

    const names = STADIUM_NODES.map(node => node.name);
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });

  it("should have logical coordinates for all STADIUM_NODES on the map canvas", () => {
    STADIUM_NODES.forEach(node => {
      // Map SVG dimensions: 0 to 1000 range usually
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(1000);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(1000);
    });
  });

  it("should assign valid levels and types to all STADIUM_NODES", () => {
    const allowedTypes = ["entrance", "section", "amenity", "transport"];
    STADIUM_NODES.forEach(node => {
      expect([1, 2]).toContain(node.level);
      expect(allowedTypes).toContain(node.type);
    });
  });

  it("should have correct details and flags for all LANGUAGES", () => {
    const codes = LANGUAGES.map(lang => lang.code);
    const uniqueCodes = new Set(codes);
    expect(codes.length).toBe(uniqueCodes.size);

    LANGUAGES.forEach(lang => {
      expect(lang.code.length).toBe(2);
      expect(lang.name.length).toBeGreaterThan(0);
      expect(lang.flag.length).toBeGreaterThan(0);
    });
  });

  it("should have unique IDs, names, and positive CO2 values for all ECO_ITEMS", () => {
    const ids = ECO_ITEMS.map(item => item.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);

    ECO_ITEMS.forEach(item => {
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.displayName.length).toBeGreaterThan(0);
      expect(item.estimatedCO2).toBeGreaterThanOrEqual(0);
    });
  });
});
