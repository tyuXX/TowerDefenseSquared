const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

//Set canvas to window size
//canvas.width = window.innerWidth;
//canvas.height = window.innerHeight;

//Statics
//const mapWidth = 20;
//const mapHeight = 15;

//Dynamics
const tileSize = 16;
const mapWidth = canvas.clientWidth / tileSize;
const mapHeight = canvas.clientHeight / tileSize;

// Game variables and functions will go here
var map = [];
var path = [];

function gameLoop() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update game logic (e.g., enemy movement, tower attacks)

  // Draw game elements (e.g., map, towers, enemies)
  drawMap();
  requestAnimationFrame(gameLoop);
}

function drawMap() {
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      switch (map[y][x]) {
        case 0:
          ctx.fillStyle = "#a7a7a7";
          break;
        case 1:
          ctx.fillStyle = "#3f3f3f";
          break;
        case 2:
          ctx.fillStyle = "#c18274";
          break;
        default:
          break;
      }
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
}

function findPath(start, end, map) {
  const stack = [start];
  const cameFrom = {};

  while (stack.length > 0) {
    const current = stack.pop();

    if (current.x === end.x && current.y === end.y) {
      const path = reconstructPath(cameFrom, current);
      return path;
    }

    const neighbors = getNeighbors(current, map);
    for (const neighbor of neighbors) {
      if (!cameFrom[`${neighbor.x},${neighbor.y}`]) {
        cameFrom[`${neighbor.x},${neighbor.y}`] = current;
        stack.push(neighbor);
      }
    }
  }

  return []; // No path found
}

function reconstructPath(cameFrom, current) {
  const path = [current];
  while (cameFrom[`${current.x},${current.y}`]) {
    current = cameFrom[`${current.x},${current.y}`];
    path.unshift(current);
  }
  return path;
}

function getNeighbors(node, map) {
  const neighbors = [];
  const directions = [
    { x: 0, y: -1 }, // Up
    { x: 1, y: 0 }, // Right
    { x: 0, y: 1 }, // Down
    { x: -1, y: 0 }, // Left
  ];

  for (const direction of directions) {
    const x = node.x + direction.x;
    const y = node.y + direction.y;
    if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight && map[y][x] !== 1) {
      neighbors.push({ x, y });
    }
  }

  return neighbors;
}


function generateMap() {
  const map = [];

  // Generate the base map
  for (let y = 0; y < mapHeight; y++) {
    map[y] = [];
    for (let x = 0; x < mapWidth; x++) {
      map[y][x] = Math.random() < 0.1 ? 1 : 0; // Randomly generate terrain (1: obstacle, 0: empty)
    }
  }

  // Randomly select start and end points

  return map;
}

function generatePath() {
  const startX = 0;
  let startY = Math.floor(Math.random() * mapHeight);
  while (map[startY][startX] === 1) {
    startY = Math.floor(Math.random() * mapHeight);
  }
  const endX = mapWidth - 1;
  let endY = Math.floor(Math.random() * mapHeight);
  while (map[endY][endX] === 1) {
    endX = Math.floor(Math.random() * mapWidth);
  }
  // Find a path using A* or another algorithm
  const path = findPath({ x: startX, y: startY }, { x: endX, y: endY }, map);
  if (path === undefined || path == []) {
    return generateMapWithPath();
  }

  for (const point of path) {
    map[point.y][point.x] = 2;
  }

  return path;
}

map = generateMap();
path = generatePath();
gameLoop();
