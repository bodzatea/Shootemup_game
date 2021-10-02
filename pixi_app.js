
//Making the application
const Application = PIXI.Application;

const app = new Application({
  width: 800,
  height: 600,
  transparent: false,
  antialias: true
});

app.renderer.backgroundColor = 0x232850;
document.body.appendChild(app.view);

const Graphics = PIXI.Graphics;

//Preloading for some sprites
PIXI.Loader.shared.add('button', './button.png');
PIXI.Loader.shared.add('spaceship', './sample.png');
PIXI.Loader.shared.add('background', './background.png');
PIXI.Loader.shared.add('./spritesheet.json');
PIXI.Loader.shared.load((loader, resources) => initialLoadFinished());

function initialLoadFinished(loader, resources) {
  setUpSplashScreen();
}

//Container priority
const menuContainer = new PIXI.Container();
app.stage.addChild(menuContainer);

const splashScreenContainer = new PIXI.Container();
app.stage.addChild(splashScreenContainer);

const gameContainer = new PIXI.Container();
app.stage.addChild(gameContainer);

const particleCont = new PIXI.Container();

//Splash screen - appears for two seconds then fades away
let splashRectange = null;
let starIcon = null;
function setUpSplashScreen() {
  splashRectange = new Graphics()
    .beginFill(0x091229)
    .drawRect(0, 0, app.screen.width, app.screen.height)
    .endFill();
  splashScreenContainer.addChild(splashRectange);

  starIcon = new Graphics()
    .lineStyle(2, 0xFFFFFF)
    .beginFill(0xFFCC5A, 1)
    .drawRoundedRect(0, 0, 100, 100, 45)
    .endFill();
  starIcon.pivot.set(starIcon.width / 2, starIcon.height / 2);
  starIcon.position.set(app.screen.width / 2, app.screen.height / 2)
  starIcon.angle = 45;

  splashScreenContainer.addChild(starIcon);
  app.ticker.add(checkFlashScreenTime);

  setUpMenu();
}


//Fading out effect
let seconds = 0;
const fadeOutValue = 0.01;

function checkFlashScreenTime(delta) {
  seconds += (1 / 60) * delta;
  if (seconds >= 2) {
    app.ticker.remove(checkFlashScreenTime);
    app.ticker.add(fadeOutSplashScreen);
  }
};

function fadeOutSplashScreen(delta) {
  if (splashScreenContainer.alpha > 0) {
    splashScreenContainer.alpha = Math.max(0, splashScreenContainer.alpha - fadeOutValue * delta);
  }
  else {
    splashRectange.destroy();
    starIcon.destroy();

    splashScreenContainer.visible = false;
    app.ticker.remove(fadeOutSplashScreen);
    //Only make the buttons interactable after the fade out effect is done
    for (let i = 0; i < 4; i++) {
      buttons[i].interactive = true;
      buttons[i].buttonMode = true;
    }
  }
};

//Main menu
const buttonDistance = 75;
const buttonDisplacement = 200;
const buttonScale = 0.6;
const textStyle = new PIXI.TextStyle({
  dropShadow: true,
  dropShadowAlpha: 0.2,
  dropShadowBlur: 5,
  fontSize: 20,
  fontVariant: "small-caps",
  fontWeight: "bold"
});

var buttons = [];
function setUpMenu() {
  for (let i = 0; i < 4; i++) {
    buttons[i] = new PIXI.Sprite(PIXI.Loader.shared.resources.button.texture);
    buttons[i].position.set(app.screen.width / 2, i * buttonDistance + buttonDisplacement);
    buttons[i].pivot.set(buttons[i].width / 2, buttons[i].height / 2);
    buttons[i].scale.set(buttonScale, buttonScale);

    //the last button has different features
    let basicText = null;
    if (i === 3) {
      basicText = new PIXI.Text('EXIT', textStyle);
      buttons[i].on('pointerdown', onButtonDownExit);
    }
    else {
      basicText = new PIXI.Text('GAME' + (i + 1), textStyle);
      buttons[i].on('pointerdown', onButtonDownGame);
    }

    menuContainer.addChild(buttons[i]);
    basicText.position.set(app.screen.width / 2, i * buttonDistance + buttonDisplacement);
    menuContainer.addChild(basicText);
    basicText.pivot.set(basicText.width / 2, basicText.height / 2);
  }

  //Top icon
  const starIcon = new Graphics()
    .lineStyle(2, 0xFFFFFF)
    .beginFill(0xFFCC5A, 1)
    .drawRoundedRect(0, 0, 75, 75, 30)
    .endFill();
  starIcon.pivot.set(starIcon.width / 2, starIcon.height / 2);
  starIcon.position.set(app.screen.width / 2, 100);
  starIcon.angle = 45;
  menuContainer.addChild(starIcon);

  //Animation
  const sheet = PIXI.Loader.shared.resources["./spritesheet.json"].spritesheet;
  // create an animated sprite
  animatedCapguy = new PIXI.AnimatedSprite(sheet.animations["idle"]);

  // set speed, start playback and add it to the stage
  animatedCapguy.animationSpeed = 0.1;
  animatedCapguy.play();
  animatedCapguy.position.set(75, app.screen.height - 90);
  menuContainer.addChild(animatedCapguy);
}


//main menu - text
function onButtonDownGame() {
  console.log('Game opened!');
  menuContainer.visible = false;
  setUpGame();
}

function onButtonDownExit() {
  //console.log('You are now somewhere else!!');
  window.location.href = "https://www.google.com";
}


function setUpGame() {
  gameContainer.visible = true;
  setUpBackground();
  gameContainer.addChild(particleCont);

  //Adding player's spaceship
  playerSpaceship = new PIXI.Sprite(PIXI.Loader.shared.resources.spaceship.texture);
  playerSpaceship.pivot.set(playerSpaceship.width / 2, playerSpaceship.height / 2);
  playerSpaceship.position.set(50, app.screen.height / 2);
  playerSpaceship.scale.set(0.25, 0.25);
  playerSpaceship.angle = 90;
  playerSpaceship.vx = 0;
  playerSpaceship.vy = 0;

  gameContainer.addChild(playerSpaceship);

  //Listeners during gameplay
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  app.ticker.add(movePlayer);
  app.ticker.add(spawnEnemy);
  app.ticker.add(updateEnemyPosition);
  app.ticker.add(checkEnemyBulletSpawn);
  app.ticker.add(updatePlayerBulletPosition);
  app.ticker.add(updateEnemyBulletPosition);
  app.ticker.add(moveParticles);
}

let tilingCount;
let tilingSprite;
function setUpBackground() {
  let texture = new PIXI.Texture(PIXI.Loader.shared.resources.background.texture);

  tilingSprite = new PIXI.TilingSprite(
    texture,
    app.screen.width,
    app.screen.height,
  );
  gameContainer.addChild(tilingSprite);

  app.ticker.add(moveBackground);
}

function moveBackground(delta) {
  tilingSprite.tilePosition.x -= 1 * delta;
}

//Helps determining if the object is still on the screen
function isOutOfBoundsY(bounds, object) {
  let futureY = object.y + object.vy;
  if (futureY < bounds.y || futureY > (bounds.height + bounds.y)) {
    return true;
  }
}

function isOutOfBoundsX(bounds, object) {
  let futureX = object.x + object.vx;
  if (futureX < bounds.x || futureX > (bounds.width + bounds.x)) {
    return true;
  }
}

//Sets the movement of an object based on an another object's angle
function setMovementDirection(baseObject, objectToSet, speed) {
  if (baseObject != null) {
    let xDir = Math.cos((baseObject.angle + 270) * Math.PI / 180);
    let yDir = Math.sin((baseObject.angle + 270) * Math.PI / 180);
    objectToSet.vx = xDir * speed;
    objectToSet.vy = yDir * speed;
  }
}

//-- PLAYER --
//Player's spaceship movement
const playerMovementSpeed = 3;
let isSpaceUp = true;

const playerPadding = 25;
const playerBounds = new PIXI.Rectangle(playerPadding,
  playerPadding,
  app.screen.width - playerPadding * 2,
  app.screen.height - playerPadding * 2);

function onKeyDown(key) {
  if (key.keyCode === 40) { //down
    playerSpaceship.vy = playerMovementSpeed;
  }
  if (key.keyCode === 37) { //left
    playerSpaceship.vx = -playerMovementSpeed;
  }
  if (key.keyCode === 39) { //right
    playerSpaceship.vx = playerMovementSpeed;
  }
  if (key.keyCode === 38) { //up
    playerSpaceship.vy = -playerMovementSpeed;
  }

  if (key.keyCode === 32 && isSpaceUp) { //space
    isSpaceUp = false;
    spawnBullet(playerSpaceship, true);
  }
}

function onKeyUp(key) {
  if (key.keyCode === 40) {
    playerSpaceship.vy = 0;
  }
  if (key.keyCode === 37) {
    playerSpaceship.vx = 0;
  }
  if (key.keyCode === 39) {
    playerSpaceship.vx = 0;
  }
  if (key.keyCode === 38) {
    playerSpaceship.vy = 0;
  }

  if (key.keyCode === 32) {
    isSpaceUp = true;
  }
}

function movePlayer(delta) {
  if (!isOutOfBoundsX(playerBounds, playerSpaceship)) {
    playerSpaceship.x += playerSpaceship.vx * delta;
  }
  if (!isOutOfBoundsY(playerBounds, playerSpaceship)) {
    playerSpaceship.y += playerSpaceship.vy * delta;
  }
};

//-- ENEMY --
let secondsSinceEnemy = 0;
const enemySeconds = 2;
let enemies = [];
const enemySpeed = 2;
const outOfScreenSpawnPos = 20;
const maxAngleChange = 90;
const turnChance = 0.005;

const enemyPadding = 25;
const enemyBounds = new PIXI.Rectangle(enemyPadding,
  enemyPadding,
  app.screen.width - enemyPadding * 2,
  app.screen.height - enemyPadding * 2);

//Enemy spaceships
function spawnEnemy(delta) {
  secondsSinceEnemy += (1 / 60) * delta;
  if (secondsSinceEnemy >= enemySeconds) {
    secondsSinceEnemy = 0;

    enemyShip = new PIXI.Sprite(PIXI.Loader.shared.resources.spaceship.texture);
    enemyShip.pivot.set(enemyShip.width / 2, enemyShip.height / 2);
    enemyShip.scale.set(0.25, 0.25);
    enemyShip.vx = 0;
    enemyShip.vy = 0;
    enemyShip.tint = 0xff1100;

    //get a random position to spawn at
    let positionY = (Math.random() * (app.screen.height - 2 * enemyBounds.y)) + enemyBounds.y;
    enemyShip.angle = -90;
    enemyShip.position.set(app.screen.width + outOfScreenSpawnPos, positionY);
    enemyShip.vx = -enemySpeed;
    enemyShip.vy = 0;

    gameContainer.addChild(enemyShip);
    enemies.push(enemyShip);

    timeUntilEnemyBullet[enemies.length - 1] = 0;
  }
};

function updateEnemyPosition(delta) {
  for (let i = 0; i < enemies.length; i++) {
    let chanceToTurn = Math.random();
    if (chanceToTurn < turnChance) {   //the enemy can randomly turn
      let dir = Math.random() * maxAngleChange;
      enemies[i].angle = dir - 120;
      setMovementDirection(enemies[i], enemies[i], enemySpeed);
    }

    //cant go out of bounds, so change direction
    if (enemies[i].y < enemyBounds.y) { //top of screen
      let dir = Math.random() * 45;
      enemies[i].angle = dir - 120;
      setMovementDirection(enemies[i], enemies[i], enemySpeed);
    }
    else if (enemies[i].y > (enemyBounds.height + enemyBounds.y)) { //bottom of screen
      let dir = Math.random() * 45;
      enemies[i].angle = dir - 90;
      setMovementDirection(enemies[i], enemies[i], enemySpeed);
    }

    enemies[i].x += enemies[i].vx * delta;
    enemies[i].y += enemies[i].vy * delta;

    if (enemies[i].x < -outOfScreenSpawnPos) { //left side of screen
      removeFromGame(enemies, i);
    }
    else if (checkEnemyHit(enemies[i])) { //Enemy got shot by the player
      spawnParticles(enemies[i]);
      timeUntilEnemyBullet.splice(i, 1);
      removeFromGame(enemies, i);
    }
    else if (isCollided(playerSpaceship, enemies[i])) {
      console.log('Player died');
      spawnParticles(playerSpaceship);
      gameOver();
    }
  }
}

function checkEnemyHit(enemy) {
  for (let i = 0; i < playerBullets.length; i++) {
    if (isCollided(enemy, playerBullets[i])) {
      removeFromGame(playerBullets, i);
      return true;
    }
  }
  return false;
}

function isCollided(enemy, bullet) {  //Uses two circles as colliders
  let globalE = enemy.getGlobalPosition();
  let globalB = bullet.getGlobalPosition();

  let dx = globalE.x - globalB.x;
  let dy = globalE.y - globalB.y;
  let distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < bullet.width / 2 + enemy.width / 2) {
    return true;
  }
  else return false;
}

//-- BULLETS --
//PLAYER -- Spawn rockets by pressing space
const bulletWidth = 5;
const bulletSpeed = 6;
let playerBullets = [];
let enemyBullets = [];
const bulletGraphics = PIXI.Graphics;
function spawnBullet(object, isPlayer) {
  //creating bullet
  if (object != null) {
    let bullet = null;
    if (isPlayer) {
      bullet = new bulletGraphics()
        .lineStyle(0)
        .beginFill(0x60ed40, 1)
        .drawCircle(0, 0, bulletWidth)
        .endFill();
      playerBullets.push(bullet);
    }
    else {
      bullet = new bulletGraphics()
        .lineStyle(0)
        .beginFill(0xed4040, 1)
        .drawCircle(0, 0, bulletWidth)
        .endFill();
      enemyBullets.push(bullet);
    }
    setMovementDirection(object, bullet, bulletSpeed);
    bullet.position.set(object.x, object.y);

    gameContainer.addChild(bullet);
  }
}

//ENEMY -- Spawns bullets by time
let timeUntilEnemyBullet = [];
const EnemyBulletFrequency = 1;
function checkEnemyBulletSpawn(delta) {
  for (let i = 0; i < timeUntilEnemyBullet.length; i++) {
    timeUntilEnemyBullet[i] += (1 / 60) * delta;
    if (timeUntilEnemyBullet[i] >= EnemyBulletFrequency) {
      spawnBullet(enemies[i], false);
      timeUntilEnemyBullet[i] = 0;
    }
  }
}

const bulletPadding = 0;
const bulletBounds = new PIXI.Rectangle(bulletPadding,
  bulletPadding,
  app.screen.width - bulletPadding * 2,
  app.screen.height - bulletPadding * 2);

function updatePlayerBulletPosition(delta) {
  for (let i = 0; i < playerBullets.length; i++) {
    playerBullets[i].x += playerBullets[i].vx * delta;
    playerBullets[i].y += playerBullets[i].vy * delta;
    if (isOutOfBoundsX(bulletBounds, playerBullets[i]) || isOutOfBoundsX(bulletBounds, playerBullets[i])) { //if the bullet moved past the screen
      //remove the bullet
      removeFromGame(playerBullets, i);
    }
  }
}

function updateEnemyBulletPosition(delta) {
  for (let i = 0; i < enemyBullets.length; i++) {
    enemyBullets[i].x += enemyBullets[i].vx * delta;
    enemyBullets[i].y += enemyBullets[i].vy * delta;
    if (isOutOfBoundsX(bulletBounds, enemyBullets[i]) || isOutOfBoundsX(bulletBounds, enemyBullets[i])) { //if the bullet moved past the screen
      //remove the bullet
      removeFromGame(enemyBullets, i);
    }
    else if (isCollided(playerSpaceship, enemyBullets[i])) {
      console.log('Player died');
      spawnParticles(playerSpaceship);
      gameOver();
    }

  }
}

//-- PARTICLES --
const particleCount = 20;
const particleWidth = 2;
const particleSpeed = 4;
const particleFadeOut = 0.025;
function spawnParticles(object) {
  for (let i = 0; i < particleCount; ++i) {
    const Graphics = PIXI.Graphics;
    const particle = new Graphics()
      .lineStyle(0) // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
      .beginFill(0xDE3249, 1)
      .drawCircle(0, 0, particleWidth)
      .endFill();

    particle.position.set(object.x, object.y);
    let dir = Math.random() * 350;
    particle.angle = dir;
    setMovementDirection(particle, particle, particleSpeed);

    particleCont.addChild(particle);
  }
}

function moveParticles(delta) {
  for (let i = 0; i < particleCont.children.length; ++i) {
    particleCont.children[i].x += particleCont.children[i].vx * delta;
    particleCont.children[i].y += particleCont.children[i].vy * delta;

    particleCont.children[i].alpha = particleCont.children[i].alpha - particleFadeOut;
    if (particleCont.children[i].alpha === 0) {
      particleCont.children[i].destroy();
      particleCont.removeChild(particleCont.children[i]);
    }

  }
}

function removeFromGame(container, idx) {
  gameContainer.removeChild(container[idx]);
  container[idx].destroy();
  container.splice(idx, 1);
}

let timeUntilRestart = 0;
const waitingScreenTime = 2;
function endGameWaitingScreen(delta) {
  timeUntilRestart += (1 / 60) * delta;
  if (timeUntilRestart >= waitingScreenTime) {
    app.ticker.remove(endGameWaitingScreen);
    app.ticker.remove(moveParticles);

    //Cleaning up
    playerSpaceship.destroy();
    for (let i = 0; i < enemies.length; i++) {
      enemies[i].destroy();
    }
    for (let i = 0; i < playerBullets.length; i++) {
      playerBullets[i].destroy();
    }
    for (let i = 0; i < enemyBullets.length; i++) {
      enemyBullets[i].destroy();
    }
    for (let i = 0; i < particleCont.children.length; ++i) {
      particleCont.children[i].destroy();
      particleCont.removeChild(particleCont.children[i]);
    }
    enemies = [];
    playerBullets = [];
    enemyBullets = [];

    menuContainer.visible = true;
    gameContainer.visible = false;
    timeUntilRestart = 0;
    //Bring the player back to the menu
  }
}

function gameOver() {
  //stay here for two sec just to show of animation
  //character shouldnt move

  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);

  app.ticker.remove(movePlayer);
  app.ticker.remove(spawnEnemy);
  app.ticker.remove(updateEnemyPosition);
  app.ticker.remove(checkEnemyBulletSpawn);
  app.ticker.remove(updatePlayerBulletPosition);
  app.ticker.remove(updateEnemyBulletPosition);

  app.ticker.add(endGameWaitingScreen);
  playerSpaceship.visible = false;
}



