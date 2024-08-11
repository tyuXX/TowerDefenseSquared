document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const moneyLabel = document.getElementById("moneyLabel");
  const towerSelector = document.getElementById("towerSelector");

  // Configurable map size
  const mapWidth = 50;
  const mapHeight = 30;
  const tileSize = 32;

  canvas.width = mapWidth * tileSize;
  canvas.height = mapHeight * tileSize;

  const map = [];
  const rocks = [];
  const path = [];
  let towers = [];
  let enemies = [];
  let money = 100; // Initial money
  let selectedTower = "basic"; // Default selected tower
  let waveNumber = 0;
  let waveInterval = 5000; // 5 seconds between waves
  let enemySpeed = 1; // Speed of enemies

  // Tower stats
  const towerStats = {
    basic: { cost: 10, color: "#f00", range: 3, damage: 1, reloadSpeed: 1000 },
    sniper: { cost: 20, color: "#00f", range: 7, damage: 3, reloadSpeed: 3000 },
    cannon: { cost: 30, color: "#ff0", range: 4, damage: 5, reloadSpeed: 2000 },
  };

  // Enemy stats
  const enemyStats = {
    grunt: { health: 10, color: "#0f0", speed: 1 },
    fast: { health: 5, color: "#f00", speed: 2 },
    tank: { health: 20, color: "#00f", speed: 0.5 },
  };

  function updateMoneyLabel() {
    moneyLabel.textContent = `Money: $${money}`;
  }

  function initMap() {
    rocks.length = 0;
    for (let y = 0; y < mapHeight; y++) {
      map[y] = [];
      for (let x = 0; x < mapWidth; x++) {
        const isRock = Math.random() < 0.2; // 20% chance to be a rock
        map[y][x] = isRock ? "rock" : "empty";
        if (isRock) {
          rocks.push({ x, y });
        }
      }
    }
  }

  function isValid(x, y) {
    return x >= 0 && x < mapWidth && y >= 0 && y < mapHeight;
  }

  function findPath(start, end) {
    const queue = [start];
    const cameFrom = {};
    const visited = new Set();
    visited.add(`${start.x},${start.y}`);
    cameFrom[`${start.x},${start.y}`] = null;

    while (queue.length > 0) {
      const current = queue.shift();

      if (current.x === end.x && current.y === end.y) {
        let path = [];
        let curr = current;
        while (curr) {
          path.push(curr);
          curr = cameFrom[`${curr.x},${curr.y}`];
        }
        return path.reverse();
      }

      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      ];

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (
          isValid(neighbor.x, neighbor.y) &&
          map[neighbor.y][neighbor.x] !== "rock" &&
          !visited.has(key)
        ) {
          queue.push(neighbor);
          cameFrom[key] = current;
          visited.add(key);
        }
      }
    }
    return []; // Return empty array if no valid path is found
  }

  function initPath() {
    const start = { x: 0, y: 0 };
    const end = { x: mapWidth - 1, y: mapHeight - 1 };
    let generatedPath = findPath(start, end);

    while (!generatedPath.length) {
      console.log("No valid path found, regenerating map...");
      initMap();
      generatedPath = findPath(start, end);
    }

    for (let i = 0; i < generatedPath.length; i++) {
      const tile = generatedPath[i];
      if (tile && map[tile.y] && map[tile.x] !== undefined) {
        map[tile.y][tile.x] = "path";
      }
    }
    path.push(...generatedPath);
  }

  function canPlaceTower(x, y) {
    return (
      map[y] && map[y][x] === "empty" && money >= towerStats[selectedTower].cost
    );
  }

  function placeTower(x, y) {
    if (canPlaceTower(x, y)) {
      towers.push({ x, y, type: selectedTower });
      map[y][x] = "tower";
      money -= towerStats[selectedTower].cost; // Deduct money for placing a tower
      updateMoneyLabel(); // Update the money label
    }
  }

  function spawnEnemy() {
    const enemyTypes = Object.keys(enemyStats);
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    enemies.push({
      x: 0,
      y: 0,
      type: type,
      health: enemyStats[type].health,
      speed: enemyStats[type].speed,
      color: enemyStats[type].color,
    });
  }

  function updateEnemies() {
    for (const enemy of enemies) {
      enemy.x += enemy.speed; // Move enemy (basic implementation, replace with proper path following)
      if (enemy.x >= canvas.width / tileSize) {
        enemies.splice(enemies.indexOf(enemy), 1); // Remove enemy if it reaches the end
      }
    }
  }

  function drawMap() {
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        if (map[y][x] === "rock") {
          ctx.fillStyle = "#555";
        } else if (map[y][x] === "path") {
          ctx.fillStyle = "#d2b48c"; // Light brown
        } else if (map[y][x] === "tower") {
          const tower = towers.find((t) => t.x === x && t.y === y);
          ctx.fillStyle = towerStats[tower.type].color; // Tower color based on type
        } else {
          ctx.fillStyle = "#228B22"; // Green for ground
        }
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }

  function drawEnemies() {
    for (const enemy of enemies) {
      ctx.fillStyle = enemy.color;
      ctx.fillRect(enemy.x * tileSize, enemy.y * tileSize, tileSize, tileSize);
    }
  }

  function getMousePosition(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / tileSize);
    const y = Math.floor((event.clientY - rect.top) / tileSize);
    return { x, y };
  }

  canvas.addEventListener("click", function (event) {
    const { x, y } = getMousePosition(event);
    placeTower(x, y);
  });

  towerSelector.addEventListener("click", function (event) {
    if (event.target.tagName === "BUTTON") {
      selectedTower = event.target.getAttribute("data-tower");
    }
  });

  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    updateEnemies();
    drawEnemies();
    requestAnimationFrame(gameLoop);
  }
  // Initialize the game
  initMap();
  initPath();
  updateMoneyLabel();
  gameLoop();

  // Wave system
  function startWaves() {
    setInterval(() => {
      waveNumber++;
      spawnEnemy();
    }, waveInterval);
  }

  startWaves();
});
