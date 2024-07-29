const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

//Set canvas to window size
canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

//Statics
//const mapWidth = 20;
//const mapHeight = 15;


//Dynamics
const tileSize = 32;
const mapWidth = canvas.clientWidth / tileSize;
const mapHeight = canvas.clientHeight / tileSize;


// Game variables and functions will go here
var map = [];

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
  const openSet = new Set();
  const closedSet = new Set();
  const cameFrom = {};

  const gScore = new Map();
  const fScore = new Map();

  gScore.set(`${start.x},${start.y}`, 0);
  fScore.set(`${start.x},${start.y}`, heuristicCostEstimate(start, end));
  openSet.add(`${start.x},${start.y}`);

  function heuristicCostEstimate(a, b) {
    // Manhattan distance heuristic
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function reconstructPath(current) {
    const totalPath = [];
    while (`${current.x},${current.y}` in cameFrom) {
      totalPath.unshift(current);
      current = cameFrom[`${current.x},${current.y}`];
    }
    totalPath.unshift(start);
    return totalPath;
  }

  while (openSet.size > 0) {
    let current;
    let lowestFScore = Infinity;
    for (const pos of openSet) {
      const x = parseInt(pos.split(",")[0], 10);
      const y = parseInt(pos.split(",")[1], 10);
      if (fScore.get(`${x},${y}`) < lowestFScore) {
        lowestFScore = fScore.get(`${x},${y}`);
        current = { x, y };
      }
    }

    if (current.x === end.x && current.y === end.y) {
      return reconstructPath(current);
    }

    openSet.delete(`${current.x},${current.y}`);
    closedSet.add(`${current.x},${current.y}`);

    const neighbors = [
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 },
    ];

    for (const neighbor of neighbors) {
      if (
        neighbor.x < 0 ||
        neighbor.x >= mapWidth ||
        neighbor.y < 0 ||
        neighbor.y >= mapHeight
      )
        continue;
      if (map[neighbor.y][neighbor.x] === 1) continue; // Obstacle

      const tentativeGScore = gScore.get(`${current.x},${current.y}`) + 1;

      if (
        closedSet.has(`${neighbor.x},${neighbor.y}`) &&
        tentativeGScore >= gScore.get(`${neighbor.x},${neighbor.y}`)
      )
        continue;

      if (
        !openSet.has(`${neighbor.x},${neighbor.y}`) ||
        tentativeGScore < gScore.get(`${neighbor.x},${neighbor.y}`)
      ) {
        cameFrom[`${neighbor.x},${neighbor.y}`] = current;
        gScore.set(`${neighbor.x},${neighbor.y}`, tentativeGScore);
        fScore.set(
          `${neighbor.x},${neighbor.y}`,
          tentativeGScore + heuristicCostEstimate(neighbor, end)
        );
        openSet.add(`${neighbor.x},${neighbor.y}`);
      }
    }
  }

  return []; // No path found
}

function generateMapWithPath() {
  const map = [];

  // Generate the base map
  for (let y = 0; y < mapHeight; y++) {
    map[y] = [];
    for (let x = 0; x < mapWidth; x++) {
      map[y][x] = Math.random() < 0.3 ? 1 : 0; // Randomly generate terrain (1: obstacle, 0: empty)
    }
  }

  // Randomly select start and end points
  const startX = 0;
  let startY = Math.floor(Math.random() * mapHeight);
  while(map[startY][startX] === 1) {
    startY = Math.floor(Math.random() * mapHeight);
  }
  const endX = mapWidth - 1;
  let endY = Math.floor(Math.random() * mapHeight);
  while(map[endY][endX] === 1) {
    endX = Math.floor(Math.random() * mapWidth);
  }

  // Find a path using A* or another algorithm
  const path = findPath({ x: startX, y: startY }, { x: endX, y: endY }, map);
  if(path === undefined || path == []) {
    return generateMapWithPath();
  }

  // Carve the path into the map
  for (const point of path) {
    map[point.y][point.x] = 2; // Mark as path tile
  }

  return map;
}

map = generateMapWithPath();
gameLoop();
