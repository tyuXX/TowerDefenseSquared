document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const moneyLabel = document.getElementById("moneyLabel");
  const waveCounter = document.getElementById("waveCounter");
  const towerSelector = document.getElementById("towerSelector");
  const startButton = document.getElementById("startButton");
  const skipButton = document.getElementById("skipButton");
  const healtLabel = document.getElementById("healtLabel");

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
  let gameStarted = false;

  // Base health
  let baseHealth = 100;

  // Tower stats
  const towerStats = {
    basic: { cost: 10, color: "#f00", range: 3, damage: 1, reloadSpeed: 1000 },
    sniper: { cost: 20, color: "#00f", range: 7, damage: 3, reloadSpeed: 3000 },
    cannon: { cost: 30, color: "#ff0", range: 4, damage: 5, reloadSpeed: 2000 },
  };

  // Enemy stats
  const enemyStats = {
    grunt: { health: 10, money: 5, color: "#0f0", speed: 0.5 },
    fast: { health: 5, money: 3, color: "#f00", speed: 1 },
    tank: { health: 20, money: 10, color: "#00f", speed: 0.25 },
  };

  function updateMoneyLabel() {
    moneyLabel.textContent = `Money: $${money}`;
  }

  function updateWaveCounter() {
    waveCounter.textContent = `Wave: ${waveNumber}`;
  }
  function updateHealtLabel(){
    healtLabel.textContent = `Healt: ${baseHealth}`;
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

    // Regenerate map if no valid path is found
    while (!generatedPath.length) {
      console.log("No valid path found, regenerating map...");
      initMap();
      generatedPath = findPath(start, end);
    }

    // Clear previous path
    for (const p of path) {
      if (map[p.y] && map[p.y][p.x] !== undefined) {
        map[p.y][p.x] = "empty";
      }
    }

    path.length = 0; // Clear the previous path array

    // Mark new path on the map
    for (let i = 0; i < generatedPath.length; i++) {
      const tile = generatedPath[i];
      if (tile && map[tile.y] && map[tile.x] !== undefined) {
        map[tile.y][tile.x] = "path";
        path.push(tile);
      }
    }
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
    const newEnemy = {
      x: 0,
      y: 0,
      type: type,
      health: enemyStats[type].health * Math.ceil(Math.pow(waveNumber, 1.1)),
      money: enemyStats[type].money, // Money value for the enemy
      speed: enemyStats[type].speed,
      color: enemyStats[type].color,
      pathIndex: 0, // To follow the path
    };
    enemies.push(newEnemy);
  }

  function updateEnemies() {
    for (const enemy of enemies) {
      if (enemy.pathIndex < path.length) {
        const target = path[enemy.pathIndex];
        const dx = target.x * tileSize - enemy.x * tileSize;
        const dy = target.y * tileSize - enemy.y * tileSize;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < enemy.speed) {
          enemy.x = target.x;
          enemy.y = target.y;
          enemy.pathIndex++;
        } else {
          enemy.x += (dx / distance) * enemy.speed * enemySpeed;
          enemy.y += (dy / distance) * enemy.speed * enemySpeed;
        }
      } else {
        // Enemy reached the end of the path
        baseHealth -= enemy.health; // Subtract enemy's health from base health
        updateHealtLabel(); // Update the health label
        enemies.splice(enemies.indexOf(enemy), 1); // Remove enemy
      }
    }
  }

  function isEnemyInRange(tower, enemy) {
    const dx = enemy.x * tileSize - tower.x * tileSize;
    const dy = enemy.y * tileSize - tower.y * tileSize;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= towerStats[tower.type].range * tileSize;
  }

  function damageEnemies() {
    for (const tower of towers) {
      for (const enemy of enemies) {
        if (isEnemyInRange(tower, enemy)) {
          enemy.health -= towerStats[tower.type].damage;
          if (enemy.health <= 0) {
            money += enemy.money; // Increment money by the enemy's value
            updateMoneyLabel(); // Update the money label
            enemies.splice(enemies.indexOf(enemy), 1); // Remove dead enemy
          }
        }
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
          ctx.fillStyle = tower ? towerStats[tower.type].color : "#0f0";
        } else {
          ctx.fillStyle = "#0f0"; // Green for the ground
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
    const scaleX = canvas.width / rect.width;    // Scaling factor in the x direction
    const scaleY = canvas.height / rect.height;  // Scaling factor in the y direction
    const x = Math.floor((event.clientX - rect.left) * scaleX / tileSize);
    const y = Math.floor((event.clientY - rect.top) * scaleY / tileSize);
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

  startButton.addEventListener("click", function () {
    if (!gameStarted) {
      gameStarted = true;
      startWaves();
      startButton.disabled = true; // Disable start button after starting the game
    }
  });
  skipButton.addEventListener("click", function () {
    if (gameStarted) {
        waveFunc();
    }
  })

  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    if (gameStarted) {
      updateEnemies();
      damageEnemies(); // Check for towers damaging enemies
      drawEnemies();
    }
    requestAnimationFrame(gameLoop);
  }
  function waveFunc() {
    waveNumber++;
    updateWaveCounter();
    money += waveNumber * 10;
    updateMoneyLabel();
    for (let i = 0; i < Math.ceil(Math.sqrt(waveNumber)); i++) {
        spawnEnemy();
    }
  }

  // Initialize the game
  initMap();
  initPath();
  updateMoneyLabel();
  updateWaveCounter();
  gameLoop();

  // Wave system
  function startWaves() {
    setInterval(() => {waveFunc();}, waveInterval);
  }
});
