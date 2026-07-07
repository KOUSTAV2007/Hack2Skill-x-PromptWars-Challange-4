import { describe, it, expect } from "vitest";
import { computeStadiumRoute } from "./routeSolver";
import { STADIUM_NODES } from "./types";

describe("Stadium Route Pathfinding Solver", () => {
  it("should successfully compute a route between two valid stadium nodes on the same level", () => {
    const nodeA = STADIUM_NODES[0]; // gate-a (Level 1)
    const nodeB = STADIUM_NODES.find(n => n.level === nodeA.level && n.id !== nodeA.id);

    if (nodeA && nodeB) {
      const route = computeStadiumRoute(nodeA.id, nodeB.id);
      expect(route).not.toBeNull();
      if (route) {
        expect(route.distanceMeters).toBeGreaterThan(0);
        expect(route.estimatedTimeSeconds).toBeGreaterThan(0);
        expect(route.steps.length).toBeGreaterThan(0);
        expect(route.levelChanged).toBe(false);
      }
    }
  });

  it("should successfully identify and handle routes between different levels", () => {
    const nodeA = STADIUM_NODES.find(n => n.level === 1);
    const nodeB = STADIUM_NODES.find(n => n.level === 2);

    if (nodeA && nodeB) {
      const route = computeStadiumRoute(nodeA.id, nodeB.id);
      expect(route).not.toBeNull();
      if (route) {
        expect(route.levelChanged).toBe(true);
        expect(route.isAccessible).toBe(true); // Escalators/Elevators core used
        expect(route.steps.some(step => step.toLowerCase().includes("elevator") || step.toLowerCase().includes("escalator"))).toBe(true);
      }
    }
  });

  it("should handle same-node route calculation gracefully", () => {
    const node = STADIUM_NODES[0];
    const route = computeStadiumRoute(node.id, node.id);
    expect(route).not.toBeNull();
    if (route) {
      expect(route.distanceMeters).toBe(0);
      expect(route.levelChanged).toBe(false);
    }
  });

  it("should calculate correct concourse curvature pathing for opposite quadrant nodes", () => {
    // North-West (Gate A, Level 1) to South-East (e.g. green-concession-2 or sensory-room)
    const nodeA = STADIUM_NODES.find(n => n.id === "green-concession-1"); // x: 220, y: 480
    const nodeB = STADIUM_NODES.find(n => n.id === "green-concession-2"); // x: 580, y: 220

    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();

    if (nodeA && nodeB) {
      const route = computeStadiumRoute(nodeA.id, nodeB.id);
      expect(route).not.toBeNull();
      if (route) {
        expect(route.steps.some(step => step.toLowerCase().includes("curve") || step.toLowerCase().includes("ring"))).toBe(true);
        expect(route.points.length).toBeGreaterThan(2); // Should have arc intermediate point
      }
    }
  });

  it("should calculate correct ring pathing for crossX but not crossY nodes", () => {
    // West to East across the stadium pitch (Gate A to Gate C)
    const nodeA = STADIUM_NODES.find(n => n.id === "gate-a"); // x: 100, y: 350
    const nodeB = STADIUM_NODES.find(n => n.id === "gate-c"); // x: 700, y: 350

    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();

    if (nodeA && nodeB) {
      const route = computeStadiumRoute(nodeA.id, nodeB.id);
      expect(route).not.toBeNull();
      if (route) {
        expect(route.steps.some(step => step.toLowerCase().includes("outer ring concourse"))).toBe(true);
      }
    }
  });

  it("should calculate direct pathing with no arc/ring detours when nodes are in the same region", () => {
    const nodeA = STADIUM_NODES.find(n => n.id === "section-101"); // x: 250, y: 350
    const nodeB = STADIUM_NODES.find(n => n.id === "green-concession-1"); // x: 220, y: 480

    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();

    if (nodeA && nodeB) {
      const route = computeStadiumRoute(nodeA.id, nodeB.id);
      expect(route).not.toBeNull();
      if (route) {
        // Should be direct pathing, i.e., only start and end points
        expect(route.points.length).toBe(2);
        expect(route.steps.length).toBe(2); // Start and arrive
      }
    }
  });

  it("should return null if an invalid node ID is provided", () => {
    const route = computeStadiumRoute("non_existent_node_a", "non_existent_node_b");
    expect(route).toBeNull();
  });

  it("should compute valid routes for every possible pair combination of stadium nodes", () => {
    for (const nodeA of STADIUM_NODES) {
      for (const nodeB of STADIUM_NODES) {
        const route = computeStadiumRoute(nodeA.id, nodeB.id);
        expect(route).not.toBeNull();
        if (route) {
          expect(route.points.length).toBeGreaterThanOrEqual(2);
          expect(route.distanceMeters).toBeGreaterThanOrEqual(0);
          expect(route.estimatedTimeSeconds).toBeGreaterThanOrEqual(0);
          expect(route.steps.length).toBeGreaterThanOrEqual(1);
          expect(typeof route.isAccessible).toBe("boolean");
          expect(typeof route.levelChanged).toBe("boolean");
        }
      }
    }
  });
});
