const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

let playerStartingPoint = {
  x: canvas.width / 2,
  y: canvas.height / 2,
};

let isGameRunning = false;
let enemies = [];
let projectiles = [];
let score = 0;
let particles = [];

function init(){
  player = new Player(
    playerStartingPoint.x,
    playerStartingPoint.y,
    14,
    "white")
  enemies = [];
  projectiles = [];
  score = 0;
  particles = [];
  animate(); 
  spawnEnemies();
  isGameRunning = true
}

class CircleElement {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }
}

class Player extends CircleElement {}
let player = new Player(
  playerStartingPoint.x,
  playerStartingPoint.y,
  14,
  "white"
);

class Projectile extends CircleElement {
  constructor(x, y, radius, color, velocity) {
    super(x, y, radius, color);
    this.velocity = velocity;
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Enemy extends CircleElement {
  constructor(x, y, radius, color, velocity) {
    super(x, y, radius, color);
    this.velocity = velocity;
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

const friction = 0.99;
class Particle extends CircleElement {
  constructor(x, y, radius, color, velocity) {
    super(x, y, radius, color);
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw() {
    c.save();
    c.globalAlpha = this.alpha;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01 * Math.random();
  }
}


// funzione che regola lo spawn dei nemici
let intervalId
function spawnEnemies() {
  intervalId = setInterval(() => {
    const minRadius = 7;
    const color = `hsl(${Math.random() * 360}, 60%, 50%)`;
    const radius = Math.random() * (35 - minRadius) + minRadius;
    let x;
    let y;

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
      x = Math.random() * canvas.width;
    }

    const angle = Math.atan2(
      playerStartingPoint.y - y,
      playerStartingPoint.x - x
    );
    const velocity = {
      x: Math.cos(angle) * 0.5,
      y: Math.sin(angle) * 0.5,
    };

    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
}

// Animazione di tutti gli accadimenti nel tempo
let currentFrame;
function animate() {
  currentFrame = requestAnimationFrame(animate);
  c.fillStyle = "rgba(5, 5, 5, 0.3)";
  c.fillRect(0, 0, canvas.width, canvas.height);
  $("#score").text(score);

  // Disegno giocatore
  player.draw();

  // Disegno proiettili
  for (
    let projectileIndex = projectiles.length - 1;
    projectileIndex >= 0;
    projectileIndex--
  ) {
    const projectile = projectiles[projectileIndex];
    projectile.update();
    if (
      projectile.x - projectile.radius > canvas.width ||
      projectile.x + projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height ||
      projectile.y + projectile.radius < 0
    ) {
      projectiles.splice(projectileIndex, 1);
    }
  }

  //Disegno particelle
  for (
    let particleIndex = particles.length - 1;
    particleIndex >= 0;
    particleIndex--
  ) {
    const particle = particles[particleIndex];
    particle.update();
    if (particle.alpha <= 0) {
      particles.splice(particleIndex, 1);
    }
  }

  // Update dei nemici e colliders
  for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
    const enemy = enemies[enemyIndex];
    enemy.update();

    // colliders con il giocatore
    const distPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (distPlayer - player.radius - enemy.radius < 1) {
      cancelAnimationFrame(currentFrame);
      isGameRunning = false 
      clearInterval(intervalId);
      $("#final-score").text(score);
      $("#gameOverOverlay").fadeIn();
    }

    //colliders con i proiettili
    projectiles.forEach((projectile, projectileIndex) => {
      const distProj = Math.hypot(
        projectile.x - enemy.x,
        projectile.y - enemy.y
      );

      //shrink then remove
      if (distProj - projectile.radius - enemy.radius < 1) {
        // spawn Particelle
        for (let i = 0; i < enemy.radius; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 3 + 0.5,
              enemy.color,
              {
                x: (Math.random() - 0.5) * 5,
                y: (Math.random() - 0.5) * 5,
              }
            )
          );
        }
        // shrink
        if (enemy.radius - 10 > 10) {
          gsap.to(enemy, {
            radius: enemy.radius - 10,
          });
          projectiles.splice(projectileIndex, 1);
          score += 50;
          // remove
        } else {
          enemies.splice(enemyIndex, 1);
          projectiles.splice(projectileIndex, 1);
          score += 100;
        }
      }
    });
  }
}

//Emissione dei proiettili al click
  $(document).click((event) => {
    if (isGameRunning == true){
      const angle = Math.atan2(
        event.pageY - playerStartingPoint.y,
        event.pageX - playerStartingPoint.x
      );
      const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5,
      };

      projectiles.push(
        new Projectile(
          playerStartingPoint.x,
          playerStartingPoint.y,
          4,
          "white",
          velocity
        )
      );
    }
  });


// chiamate per iniziare la pagina e refresharla
resetCanvas();
addEventListener("resize", resetCanvas);

function resetCanvas() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;

  player.x = playerStartingPoint.x = canvas.width / 2;
  player.y = playerStartingPoint.y = canvas.height / 2;
}

$("#restart-button").click(() => {
  $("#gameOverOverlay").fadeOut(); 
  init();
});

$("#start-button").click(() => {
  $("#gameStartOverlay").fadeOut(); 
  animate();
  spawnEnemies();
  isGameRunning = true;
});

