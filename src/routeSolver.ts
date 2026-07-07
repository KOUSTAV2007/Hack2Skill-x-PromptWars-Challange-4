import { STADIUM_NODES, NavNode } from "./types";

export interface ComputedRoute {
  points: [number, number][];
  distanceMeters: number;
  estimatedTimeSeconds: number;
  steps: string[];
  isAccessible: boolean;
  levelChanged: boolean;
}

export function computeStadiumRoute(fromId: string, toId: string): ComputedRoute | null {
  const fromNode = STADIUM_NODES.find(n => n.id === fromId);
  const toNode = STADIUM_NODES.find(n => n.id === toId);

  if (!fromNode || !toNode) return null;

  const points: [number, number][] = [];
  const steps: string[] = [];
  let isAccessible = true;

  // Stadium center coordinates
  const centerX = 400;
  const centerY = 350;

  // Let's create an elegant pathing algorithm that mimics stadium concourses
  // Concourses are circular rings around the center pitch.
  // Pitch bounds: x from 300 to 500, y from 270 to 430.
  // Level 1 Ring: Radius ~ 180
  // Level 2 Ring: Radius ~ 240

  points.push([fromNode.x, fromNode.y]);

  const levelChanged = fromNode.level !== toNode.level;

  if (levelChanged) {
    steps.push(`Start at ${fromNode.name} on Level ${fromNode.level}.`);
    // Connect to an elevator/escalator junction
    // We can simulate an elevator at x: 400, y: 350 (stadium core escalators)
    const escalatorX = 400;
    const escalatorY = fromNode.y > 350 ? 500 : 200;
    points.push([escalatorX, escalatorY]);
    steps.push(`Proceed to the Level ${fromNode.level} Escalators & Elevators core.`);
    steps.push(`Take Elevator or Escalator up to Level ${toNode.level} (Wheelchair accessible).`);
    points.push([escalatorX, escalatorY]); // intermediate point on Level 2
  } else {
    steps.push(`Start at ${fromNode.name}.`);
  }

  // To make the path look curved like a real stadium concourse, we can insert intermediate bends
  // along the stadium oval if the points are on opposite sides.
  const crossX = (fromNode.x < centerX && toNode.x > centerX) || (fromNode.x > centerX && toNode.x < centerX);
  const crossY = (fromNode.y < centerY && toNode.y > centerY) || (fromNode.y > centerY && toNode.y < centerY);

  if (crossX && crossY) {
    // Large detour: go via concourse arc
    // Choose quadrant bend
    const arcX = fromNode.x < centerX ? 250 : 550;
    const arcY = toNode.y < centerY ? 220 : 480;
    points.push([arcX, arcY]);
    steps.push("Follow the main concourse curve around the stadium oval.");
  } else if (crossX) {
    const arcY = fromNode.y > centerY ? 500 : 200;
    points.push([centerX, arcY]);
    steps.push("Head along the outer ring concourse.");
  }

  points.push([toNode.x, toNode.y]);
  steps.push(`Arrive at ${toNode.name}.`);

  // Calculate pixel distance
  let pixelDist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i+1][0] - points[i][0];
    const dy = points[i+1][1] - points[i][1];
    pixelDist += Math.sqrt(dx*dx + dy*dy);
  }

  // Map pixels to real meters (1 pixel = ~0.6 meters)
  const distanceMeters = Math.round(pixelDist * 0.6);
  // Average walking speed is 1.2 m/s
  const estimatedTimeSeconds = Math.round(distanceMeters / 1.2);

  // If path is accessible
  if (levelChanged) {
    isAccessible = true; // escalators/elevators are dual equipped
  }

  return {
    points,
    distanceMeters,
    estimatedTimeSeconds,
    steps,
    isAccessible,
    levelChanged
  };
}
