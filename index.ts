import { aMajorNotes, playSound } from "./sound";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const LINE_WIDTH = 0.1;
const GAME_AREA = 10;
const INIT_GRAVITY = 0.00005;
const IMPACT_THRESHOLD = 0.005;

const polygonPoints = 6;
const polygonRadius = 4;
const initPoints = [] as { x: number; y: number }[];

for (let i = 0; i < polygonPoints; i++) {
  const angle = (i / polygonPoints) * 2 * Math.PI;
  const x = Math.cos(angle) * polygonRadius;
  const y = Math.sin(angle) * polygonRadius;
  initPoints.push({ x, y });
}

const state = {
  gravity: INIT_GRAVITY,
  balls: [] as {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    hz: number;
  }[],
  // lines
  lineRotation: 0,
};

// init
const ballAmount = 5;
for (let i = 0; i < ballAmount; i++) {
  const jitter = 0.1;
  state.balls.push({
    x: 0,
    y: 0,
    vx: Math.random() * jitter - jitter * 0.5,
    vy: Math.random() * jitter - jitter * 0.5,
    r: 0.2,
    hz: aMajorNotes[Math.floor(Math.random() * aMajorNotes.length)]!,
  });
}

let lastTime = 0;
function tick() {
  const now = performance.now();
  const dt = now - lastTime;
  lastTime = now;

  const canvasRect = canvas.getBoundingClientRect();
  const dpi = window.devicePixelRatio;
  canvas.width = canvasRect.width * dpi;
  canvas.height = canvasRect.height * dpi;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");
  ctx.scale(dpi, dpi);

  // UPDATE
  //////////////////////////

  const LINE_ROTATION_SPEED = 0.001;
  state.lineRotation += dt * LINE_ROTATION_SPEED;
  const rotatedPoints = initPoints.map((p) => ({
    x: p.x * Math.cos(state.lineRotation) - p.y * Math.sin(state.lineRotation),
    y: p.x * Math.sin(state.lineRotation) + p.y * Math.cos(state.lineRotation),
  }));

  let lines = [] as {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    w: number;
  }[];

  for (let i = 0; i < polygonPoints; i++) {
    const x1 = rotatedPoints[i]!.x;
    const y1 = rotatedPoints[i]!.y;
    const x2 = rotatedPoints[(i + 1) % polygonPoints]!.x;
    const y2 = rotatedPoints[(i + 1) % polygonPoints]!.y;
    lines.push({ x1, y1, x2, y2, w: 0.5 * LINE_WIDTH });
  }

  // gravity
  for (const ball of state.balls) {
    ball.vy += state.gravity * dt;
  }

  for (const ball of state.balls) {
    ball.x += ball.vx;
    ball.y += ball.vy;
  }

  // check for collisions
  for (const ball of state.balls) {
    for (const walls of lines) {
      const ballRelativeToFirstPoint = {
        x: ball.x - walls.x1,
        y: ball.y - walls.y1,
      };
      const secondPointRelativeToFirstPoint = {
        x: walls.x2 - walls.x1,
        y: walls.y2 - walls.y1,
      };

      const lineLengthSq =
        secondPointRelativeToFirstPoint.x ** 2 +
        secondPointRelativeToFirstPoint.y ** 2;

      const dotProduct =
        ballRelativeToFirstPoint.x * secondPointRelativeToFirstPoint.x +
        ballRelativeToFirstPoint.y * secondPointRelativeToFirstPoint.y;

      const t = Math.max(0, Math.min(1, dotProduct / lineLengthSq));

      const closestPoint = {
        x: walls.x1 + t * secondPointRelativeToFirstPoint.x,
        y: walls.y1 + t * secondPointRelativeToFirstPoint.y,
      };

      const dist = Math.sqrt(
        (ball.x - closestPoint.x) ** 2 + (ball.y - closestPoint.y) ** 2,
      );
      if (dist < ball.r + walls.w * 0.5) {
        const nx = (ball.x - closestPoint.x) / dist;
        const ny = (ball.y - closestPoint.y) / dist;
        const overlap = ball.r + walls.w * 0.5 - dist;
        ball.x += nx * overlap;
        ball.y += ny * overlap;

        const vDotN = ball.vx * nx + ball.vy * ny;
        if (vDotN < 0) {
          ball.vx -= 2 * vDotN * nx;
          ball.vy -= 2 * vDotN * ny;
          if (-vDotN > IMPACT_THRESHOLD) playSound(ball.hz);
        }
      }
    }
  }

  // DRAWING
  //////////////////////////

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // letter box to game area
  {
    const widthFactor = canvasRect.width / GAME_AREA;
    const heightFactor = canvasRect.height / GAME_AREA;
    const scaleFactor = Math.min(widthFactor, heightFactor);

    const offsetX = (canvasRect.width - GAME_AREA * scaleFactor) / 2;
    const offsetY = (canvasRect.height - GAME_AREA * scaleFactor) / 2;
    ctx.translate(
      offsetX + (GAME_AREA * scaleFactor) / 2,
      offsetY + (GAME_AREA * scaleFactor) / 2,
    );

    ctx.scale(scaleFactor, scaleFactor);
  }

  ctx.lineWidth = LINE_WIDTH;
  ctx.lineCap = "round";
  for (const line of lines) {
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
  }

  // draw balls
  for (const ball of state.balls) {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, 2 * Math.PI);
    ctx.fill();
  }

  requestAnimationFrame(tick);
}
tick();
