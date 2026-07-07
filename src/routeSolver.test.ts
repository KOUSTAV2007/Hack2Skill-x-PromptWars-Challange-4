import { describe, it, expect } from "vitest";
import { computeStadiumRoute } from "./routeSolver";
import { STADIUM_NODES } from "./types";

describe("Stadium Route Pathfinding Solver", () => {
  it("should successfully compute a route between two valid stadium nodes on the same level", () => {
    const nodeA = STADIUM_NODES[0];
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

  it("should return null if an invalid node ID is provided", () => {
    const route = computeStadiumRoute("non_existent_node_a", "non_existent_node_b");
    expect(route).toBeNull();
  });
});
