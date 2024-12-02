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
      reloadSpeed: 500,
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
      reloadSpeed: 1500,
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
      reloadSpeed: 1000,
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
      reloadSpeed: 5000,
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
    const stats = towerStats[selectedTower];

    if (canPlaceTower(tileX, tileY) && money >= currentCost) {
      const newTower = {
        x: tileX,
        y: tileY,
        type: selectedTower,
        lastShot: 0,
        level: 1,
        damage: stats.damage,
        range: stats.range,
        reloadSpeed: stats.reloadSpeed,
        color: stats.color
      };
      towers.push(newTower);
      map[tileY][tileX] = "tower";
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
    const dx = (enemy.x - tower.x) * tileSize;
    const dy = (enemy.y - tower.y) * tileSize;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= tower.range * tileSize;
  }

  let selectedTowerElement = null;
  let totalDamageDealt = new Map(); // Track total damage for each tower

  function showTowerInfo(tower) {
    const sidebar = document.getElementById('towerInfo');
    const stats = towerStats[tower.type];
    
    // Update tower info
    document.getElementById('towerName').textContent = stats.name;
    document.getElementById('towerLevel').textContent = `Level ${tower.level}`;
    document.getElementById('towerDamage').textContent = Math.round(tower.damage);
    document.getElementById('towerRange').textContent = Math.round(tower.range);
    document.getElementById('towerSpeed').textContent = `${(tower.reloadSpeed / 1000).toFixed(1)}s`;
    document.getElementById('towerTotalDamage').textContent = Math.round(totalDamageDealt.get(tower) || 0);
    
    // Update upgrade cost
    const upgradeCost = Math.floor(getCurrentTowerCost(tower.type) * 0.75 * tower.level);
    document.getElementById('upgradePrice').textContent = `$${upgradeCost}`;
    
    // Show sidebar
    sidebar.classList.remove('hidden');
    selectedTowerElement = tower;
    
    // Update upgrade button state
    const upgradeButton = document.getElementById('upgradeButton');
    upgradeButton.disabled = money < upgradeCost;
    upgradeButton.style.opacity = money < upgradeCost ? '0.5' : '1';
  }

  function hideTowerInfo() {
    const sidebar = document.getElementById('towerInfo');
    sidebar.classList.add('hidden');
    selectedTowerElement = null;
  }

  // Update the click handler
  canvas.addEventListener("click", function (event) {
    const pos = getMousePosition(event);
    const tileX = Math.floor(pos.x / tileSize);
    const tileY = Math.floor(pos.y / tileSize);
    
    const clickedTower = getTowerAt(tileX, tileY);
    if (clickedTower) {
      showTowerInfo(clickedTower);
    } else {
      hideTowerInfo();
      placeTower(pos.x, pos.y);
    }
  });

  // Add upgrade button handler
  document.getElementById('upgradeButton').addEventListener('click', () => {
    if (selectedTowerElement) {
      const upgradeCost = Math.floor(getCurrentTowerCost(selectedTowerElement.type) * 0.75 * selectedTowerElement.level);
      if (money >= upgradeCost) {
        money -= upgradeCost;
        selectedTowerElement.level++;
        selectedTowerElement.damage *= 1.5;
        selectedTowerElement.range *= 1.2;
        selectedTowerElement.reloadSpeed *= 0.8;
        updateMoneyLabel();
        showTowerInfo(selectedTowerElement); // Refresh tower info
      }
    }
  });

  // Add sell button handler
  document.getElementById('sellButton').addEventListener('click', () => {
    if (selectedTowerElement) {
      const sellValue = Math.floor(getCurrentTowerCost(selectedTowerElement.type) * 0.5);
      money += sellValue;
      // Remove tower from the game
      const towerIndex = towers.indexOf(selectedTowerElement);
      if (towerIndex > -1) {
        towers.splice(towerIndex, 1);
        map[selectedTowerElement.y][selectedTowerElement.x] = 'empty';
        towerStats[selectedTowerElement.type].count--;
      }
      updateMoneyLabel();
      hideTowerInfo();
      updateTowerSpawners();
    }
  });

  function damageEnemies() {
    const now = Date.now();
    
    for (const tower of towers) {
      // Skip if tower is still on cooldown
      if (now - tower.lastShot < tower.reloadSpeed) {
        continue;
      }

      // Find closest enemy in range
      let closestEnemy = null;
      let closestDistance = Infinity;

      for (const enemy of enemies) {
        if (isEnemyInRange(tower, enemy)) {
          const dx = (enemy.x - tower.x) * tileSize;
          const dy = (enemy.y - tower.y) * tileSize;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = enemy;
          }
        }
      }

      // Deal damage to closest enemy
      if (closestEnemy) {
        closestEnemy.health -= tower.damage;
        tower.lastShot = now;

        // Draw attack line
        ctx.beginPath();
        ctx.moveTo(tower.x * tileSize + tileSize/2, tower.y * tileSize + tileSize/2);
        ctx.lineTo(closestEnemy.x * tileSize, closestEnemy.y * tileSize);
        ctx.strokeStyle = tower.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Track damage
        if (!totalDamageDealt.has(tower)) {
          totalDamageDealt.set(tower, 0);
        }
        totalDamageDealt.set(tower, totalDamageDealt.get(tower) + tower.damage);

        // Update tower info if this tower is selected
        if (selectedTowerElement === tower) {
          showTowerInfo(tower);
        }

        // Remove dead enemies
        if (closestEnemy.health <= 0) {
          money += enemyStats[closestEnemy.type].money;
          updateMoneyLabel();
          enemies.splice(enemies.indexOf(closestEnemy), 1);
        }
      }
    }
  }

  function drawMap() {
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tileX = x * tileSize;
        const tileY = y * tileSize;
        
        ctx.beginPath();
        ctx.rect(tileX, tileY, tileSize, tileSize);
        
        if (map[y][x] === "rock") {
          ctx.fillStyle = "#555";
        } else if (map[y][x] === "path") {
          ctx.fillStyle = "#d2b48c";
        } else if (map[y][x] === "tower") {
          const tower = getTowerAt(x, y);
          if (tower) {
            // Draw tower base
            ctx.fillStyle = "#333";
            ctx.fill();
            
            // Draw tower in its color
            ctx.beginPath();
            ctx.arc(tileX + tileSize/2, tileY + tileSize/2, tileSize/3, 0, Math.PI * 2);
            ctx.fillStyle = tower.color;
            
            // Highlight selected tower
            if (tower === selectedTowerElement) {
              ctx.strokeStyle = "#fff";
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          } else {
            ctx.fillStyle = "#333";
          }
        } else {
          ctx.fillStyle = "#222";
        }
        ctx.fill();
      }
    }
  }

  function drawEnemies() {
    ctx.save();
    for (const enemy of enemies) {
      // Draw enemy
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(
        enemy.x * tileSize + tileSize / 2,
        enemy.y * tileSize + tileSize / 2,
        tileSize / 3,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw health bar background
      const healthBarWidth = tileSize * 0.8;
      const healthBarHeight = 4;
      const healthBarX = enemy.x * tileSize + tileSize * 0.1;
      const healthBarY = enemy.y * tileSize - healthBarHeight - 2;

      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

      // Draw current health
      const healthPercentage = enemy.health / (enemyStats[enemy.type].health * Math.ceil(Math.pow(waveNumber, 1.3)));
      ctx.fillStyle = getHealthColor(healthPercentage);
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);

      // Draw health text for bigger enemies
      if (enemyStats[enemy.type].health > 10) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          Math.ceil(enemy.health),
          enemy.x * tileSize + tileSize / 2,
          enemy.y * tileSize - 8
        );
      }
    }
    ctx.restore();
  }

  // Helper function to get health bar color based on percentage
  function getHealthColor(percentage) {
    if (percentage > 0.6) {
      return '#2ecc71'; // Green
    } else if (percentage > 0.3) {
      return '#f1c40f'; // Yellow
    } else {
      return '#e74c3c'; // Red
    }
  }

  function getMousePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

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
