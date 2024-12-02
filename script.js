document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const moneyLabel = document.getElementById("moneyLabel");
  const waveCounter = document.getElementById("waveCounter");
  const towerSelector = document.getElementById("towerSelector");
  const startButton = document.getElementById("startButton");
  const skipButton = document.getElementById("skipButton");
  const healtLabel = document.getElementById("healtLabel");
  const menuButton1 = document.getElementById("menuButton1");
  const menuButton2 = document.getElementById("menuButton2");

  // Configurable map size
  const mapWidth = 50;
  const mapHeight = 30;
  const tileSize = 32;

  canvas.width = visualViewport.width;
  canvas.height = visualViewport.height;

  const map = [];
  const rocks = [];
  const path = [];
  let towers = [];
  let enemies = [];
  let enemyqueue = [];
  let money = 100; // Initial money
  let selectedTower = "basic"; // Default selected tower
  let waveNumber = 0;
  let enemySpeed = 0.5; // Speed of enemies
  let gameStarted = false;
  let enemyqueueCooldown = 0;
  let menuOpen = false;
  let firstrun = true;

  // Base health
  let baseHealth = 1000;

  // Tower stats
  const towerStats = {
    basic: {
      name: "Basic Tower",
      baseCost: 15,
      color: "#f00",
      range: 3,
      damage: 1,
      reloadSpeed: 1000,
      level: 1,
      count: 0,
      priceScale: 1.4, // 40% increase per tower
    },
    sniper: {
      name: "Sniper Tower",
      baseCost: 25,
      color: "#00f",
      range: 7,
      damage: 3,
      reloadSpeed: 3000,
      level: 1,
      count: 0,
      priceScale: 1.5, // 50% increase per tower
    },
    cannon: {
      name: "Cannon Tower",
      baseCost: 40,
      color: "#ff0",
      range: 4,
      damage: 5,
      reloadSpeed: 2000,
      level: 1,
      count: 0,
      priceScale: 1.6, // 60% increase per tower
    },
    railcannon: {
      name: "Railcannon",
      baseCost: 200,
      color: "#fff",
      range: 15,
      damage: 100,
      reloadSpeed: 10000,
      level: 1,
      count: 0,
      priceScale: 2.0, // 100% increase per tower
    },
  };

  // Enemy stats
  const enemyStats = {
    grunt: { health: 10, money: 3, color: "#0f0", speed: 0.5 },
    fast: { health: 5, money: 1, color: "#f00", speed: 1 },
    tank: { health: 20, money: 5, color: "#00f", speed: 0.25 },
  };

  function updateMoneyLabel() {
    moneyLabel.textContent = `Money: $${money}`;
  }

  function updateWaveCounter() {
    waveCounter.textContent = `Wave: ${waveNumber}`;
  }
  function updateHealtLabel() {
    healtLabel.textContent = `Healt: ${baseHealth}`;
  }

  function updateTowerSpawners() {
    const buttons = document.getElementsByClassName("towerbutton");
    for (let button of buttons) {
      const towerType = button.getAttribute("data-tower");
      const cost = getCurrentTowerCost(towerType);
      button.title = `${towerStats[towerType].name} - $${cost}`;
      button.textContent = towerType.charAt(0).toUpperCase();
    }
  }

  function getCurrentTowerCost(type) {
    const stats = towerStats[type];
    return Math.floor(stats.baseCost * Math.pow(stats.priceScale, stats.count));
  }

  function initMap() {
    towers = [];
    enemies = [];
    enemyqueue = [];
    waveNumber = 0;
    money = 100;
    baseHealth = 1000;
    enemyqueueCooldown = 0;
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
    initPath();
    updateMoneyLabel();
    updateWaveCounter();
    updateTowerSpawners();
    updateHealtLabel();
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
      map[y] &&
      map[y][x] === "empty" &&
      money >= getCurrentTowerCost(selectedTower)
    );
  }

  function getTowerAt(x, y) {
    for (let i = 0; i < towers.length; i++) {
      if (towers[i].x === x && towers[i].y === y) {
        return towers[i];
      }
    }
    return null;
  }

  function canUpgradeTower(x, y) {
    return (
      map[y] &&
      map[y][x] === "tower" &&
      money >=
        getCurrentTowerCost(getTowerAt(x, y).type) * getTowerAt(x, y).level
    );
  }

  function placeTower(x, y) {
    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor(y / tileSize);
    const currentCost = getCurrentTowerCost(selectedTower);

    if (canPlaceTower(tileX, tileY) && money >= currentCost) {
      const newTower = {
        x: tileX,
        y: tileY,
        type: selectedTower,
        lastShot: 0,
        level: 1,
      };
      towers.push(newTower);
      map[tileY][tileX] = "tower"; // Update map state
      money -= currentCost;
      towerStats[selectedTower].count++;
      updateMoneyLabel();
      updateTowerSpawners();
    }
  }

  function upgradeTower(x, y) {
    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor(y / tileSize);
    const tower = getTowerAt(tileX, tileY);

    if (tower && canUpgradeTower(tileX, tileY)) {
      const upgradeCost =
        Math.floor(getCurrentTowerCost(tower.type) * 0.75 * tower.level);
      if (money >= upgradeCost) {
        money -= upgradeCost;
        tower.level++;
        tower.damage *= 1.5;
        tower.range *= 1.2;
        tower.reloadSpeed *= 0.8;
        updateMoneyLabel();
        return true;
      }
    }
    return false;
  }

  function spawnEnemy() {
    const enemyTypes = Object.keys(enemyStats);
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const newEnemy = {
      x: 0,
      y: 0,
      type: type,
      health: enemyStats[type].health * Math.ceil(Math.pow(waveNumber, 1.3)),
      money: enemyStats[type].money, // Money value for the enemy
      speed: enemyStats[type].speed,
      color: enemyStats[type].color,
      pathIndex: 0, // To follow the path
    };
    enemyqueue.push(newEnemy);
  }

  function updateEnemies() {
    if (enemyqueue.length > 0) {
      if (enemyqueueCooldown === 0) {
        enemies.push(enemyqueue.shift());
        enemyqueueCooldown = Math.max(
          0,
          10 - Math.ceil(Math.sqrt(enemyqueue.length))
        );
      }
      enemyqueueCooldown--;
    }
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
    if (enemyqueue.length === 0 && enemies.length === 0) {
      waveFunc();
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
      if (tower.reloadcooldown > 0) {
        tower.reloadcooldown--;
      } else {
        for (const enemy of enemies) {
          if (isEnemyInRange(tower, enemy)) {
            enemy.health -=
              towerStats[tower.type].damage * Math.sqrt(tower.level);
            enemy.health = Math.ceil(enemy.health);
            tower.reloadcooldown =
              tower.type.reloadSpeed / Math.floor(Math.sqrt(tower.level));
            if (enemy.health <= 0) {
              money += enemy.money; // Increment money by the enemy's value
              updateMoneyLabel(); // Update the money label
              enemies.splice(enemies.indexOf(enemy), 1); // Remove dead enemy
            }
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
          const tower = getTowerAt(x, y);
          ctx.fillStyle = tower ? towerStats[tower.type].color : "#0f0";
        } else {
          ctx.fillStyle = "#0f0"; // Green for the ground
        }
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
    for (const tower of towers) {
      ctx.fillStyle = towerStats[tower.type].color;
      ctx.beginPath();
      ctx.moveTo(tower.x * tileSize, tower.y * tileSize);
      ctx.lineTo((tower.x + 1) * tileSize, tower.y * tileSize);
      ctx.lineTo((tower.x + 1) * tileSize, (tower.y + 1) * tileSize);
      ctx.lineTo(tower.x * tileSize, (tower.y + 1) * tileSize);
      ctx.lineTo(tower.x * tileSize, tower.y * tileSize);
      ctx.stroke();
      ctx.fillStyle = "#000";
      ctx.font = tileSize + "px Arial";
      ctx.fillText(
        tower.level,
        (tower.x + 0.5) * tileSize,
        (tower.y + 0.5) * tileSize
      );
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
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  canvas.addEventListener("click", function (event) {
    const pos = getMousePosition(event);
    const tileX = Math.floor(pos.x / tileSize);
    const tileY = Math.floor(pos.y / tileSize);
    
    // Try to upgrade first, then try to place if upgrade fails
    if (!upgradeTower(tileX, tileY)) {
      placeTower(pos.x, pos.y);
    }
  });

  document.querySelectorAll('.towerbutton').forEach(button => {
    button.addEventListener('click', () => {
      selectedTower = button.getAttribute('data-tower');
      document.querySelectorAll('.towerbutton').forEach(b => b.style.border = 'none');
      button.style.border = '2px solid white';
    });
  });

  startButton.addEventListener("click", function () {
    if (!gameStarted) {
      gameStarted = true;
      startButton.disabled = true; // Disable start button after starting the game
      if (!firstrun) {
        initMap();
      }
      firstrun = false;
    }
  });
  skipButton.addEventListener("click", function () {
    if (gameStarted) {
      waveFunc();
    }
  });
  menuButton1.addEventListener("click", function () {
    menu.style.display = "block";
    menuOpen = true;
  });
  menuButton2.addEventListener("click", function () {
    menu.style.display = "none";
    menuOpen = false;
  });

  function gameLoop() {
    if (!menuOpen) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawMap();
      if (gameStarted) {
        updateEnemies();
        damageEnemies(); // Check for towers damaging enemies
        drawEnemies();
      }
    }
    if (!(baseHealth > 0)) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = Math.min(canvas.width, canvas.height) / 10 + "px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
      startButton.disabled = false;
      gameStarted = false;
    }
    requestAnimationFrame(gameLoop);
  }
  function waveFunc() {
    waveNumber++;
    updateWaveCounter();
    money += waveNumber * 5;
    updateMoneyLabel();
    for (let i = 0; i < Math.ceil(Math.sqrt(waveNumber)); i++) {
      spawnEnemy();
    }
  }

  // Initialize the game

  initMap();
  gameLoop();
});
