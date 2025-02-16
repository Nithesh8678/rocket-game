"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import StatsPanel from "./StatsPanel";

interface Beam {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  speedX?: number;
  speedY?: number;
}

interface Asteroid {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

interface Explosion {
  x: number;
  y: number;
  size: number;
  particles: Array<{
    x: number;
    y: number;
    speedX: number;
    speedY: number;
    size: number;
    life: number;
  }>;
}

interface PowerUp {
  x: number;
  y: number;
  size: number;
  type: "rapidFire" | "tripleShot" | "wideBeam";
  color: string;
}

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [isRespawning, setIsRespawning] = useState(false);
  const gameStateRef = useRef({
    keys: {} as { [key: string]: boolean },
    lastShot: 0,
    lastAsteroidSpawn: 0,
    asteroidsDestroyed: 0,
    beams: [] as Beam[],
    asteroids: [] as Asteroid[],
    explosions: [] as Explosion[],
    respawnTimer: 0,
    character: {
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      speed: 5,
      color: "red",
      isInvulnerable: false,
    },
    powerUps: [] as PowerUp[],
    activePowerUp: null as string | null,
    powerUpEndTime: 0,
  });

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);

  const canvasWidth = useMemo(() => Math.min(800, window.innerWidth - 300), []);
  const canvasHeight = useMemo(
    () => Math.min(600, window.innerHeight - 40),
    []
  );

  // Initialize character position
  useEffect(() => {
    gameStateRef.current.character.x = canvasWidth / 2;
    gameStateRef.current.character.y = canvasHeight * 0.8;
  }, [canvasWidth, canvasHeight]);

  const resetGame = () => {
    const gameState = gameStateRef.current;
    gameState.beams = [];
    gameState.asteroids = [];
    gameState.explosions = [];
    gameState.asteroidsDestroyed = 0;
    gameState.character.x = canvasWidth / 2;
    gameState.character.y = canvasHeight * 0.8;
    gameState.character.isInvulnerable = false;
    setScore(0);
    setLevel(1);
    setLives(3);
    setIsGameOver(false);
    setIsRespawning(false);
  };

  const respawnPlayer = () => {
    const gameState = gameStateRef.current;
    gameState.character.x = canvasWidth / 2;
    gameState.character.y = canvasHeight * 0.8;
    gameState.character.isInvulnerable = true;
    setIsRespawning(false);

    // Make player vulnerable again after 2 seconds
    setTimeout(() => {
      gameState.character.isInvulnerable = false;
    }, 2000);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create images using the global Image constructor
    const bgImage = document.createElement("img");
    bgImage.src = "/space_bg.png";

    const rocketImage = document.createElement("img");
    rocketImage.src = "/rocket.png";

    // Wait for images to load
    Promise.all([
      new Promise((resolve) => (bgImage.onload = resolve)),
      new Promise((resolve) => (rocketImage.onload = resolve)),
    ]).then(() => {
      // Start game loop after images are loaded
      gameLoop();
    });

    const gameState = gameStateRef.current;
    let animationFrameId: number;

    const SHOT_COOLDOWN = 250;
    const POINTS_PER_LEVEL = 1000;
    const MAX_ASTEROIDS = 4;
    const ASTEROID_SPAWN_RATE = 1500;
    const POINTS_PER_ASTEROID = 100;
    const PARTICLE_COUNT = 10;
    const PARTICLE_LIFE = 30;
    const POWER_UP_DURATION = 10000; // 10 seconds
    const POWER_UP_SPAWN_RATE = 30000; // Increased to 30 seconds
    let lastPowerUpSpawn = 0;

    function createExplosion(x: number, y: number, size: number) {
      const explosion: Explosion = {
        x,
        y,
        size,
        particles: [],
      };

      // Create particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT;
        explosion.particles.push({
          x: x,
          y: y,
          speedX: Math.cos(angle) * 3,
          speedY: Math.sin(angle) * 3,
          size: size / 3,
          life: PARTICLE_LIFE,
        });
      }

      gameState.explosions.push(explosion);
    }

    function createAsteroid() {
      const currentTime = Date.now();
      if (
        currentTime - gameState.lastAsteroidSpawn <
        ASTEROID_SPAWN_RATE / level
      )
        return;

      // Only create new asteroid if we haven't reached the maximum
      if (gameState.asteroids.length < MAX_ASTEROIDS) {
        const size = Math.random() * 20 + 20;
        const x = Math.random() * (canvas.width - size * 2) + size;
        // Increase speed based on level
        const speedX = (Math.random() - 0.5) * 2 * (1 + level * 0.1);
        const speedY = (Math.random() * 1 + 0.5) * (1 + level * 0.1);

        const asteroid: Asteroid = {
          x,
          y: -size,
          size,
          speedX,
          speedY,
          color: "#8B4513",
        };

        gameState.asteroids.push(asteroid);
        gameState.lastAsteroidSpawn = currentTime;
      }
    }

    function createPowerUp() {
      const currentTime = Date.now();
      // Only spawn if no power-ups are active or on screen
      if (
        currentTime - lastPowerUpSpawn < POWER_UP_SPAWN_RATE ||
        gameState.powerUps.length > 0 ||
        gameState.activePowerUp
      )
        return;

      const types = ["rapidFire", "tripleShot", "wideBeam"];
      const colors = ["#ff0", "#0ff", "#f0f"]; // Yellow, Cyan, Magenta
      const randomIndex = Math.floor(Math.random() * types.length);

      const powerUp: PowerUp = {
        x: Math.random() * (canvas.width - 30) + 15,
        y: -20,
        size: 15,
        type: types[randomIndex] as PowerUp["type"],
        color: colors[randomIndex],
      };

      gameState.powerUps.push(powerUp);
      lastPowerUpSpawn = currentTime;
    }

    function createBeam() {
      const currentTime = Date.now();
      const { character, activePowerUp, powerUpEndTime } = gameState;

      // Check if power-up has expired
      if (activePowerUp && currentTime > powerUpEndTime) {
        gameState.activePowerUp = null;
      }

      // Adjust cooldown for rapid fire
      const currentCooldown =
        activePowerUp === "rapidFire" ? SHOT_COOLDOWN / 3 : SHOT_COOLDOWN;
      if (currentTime - gameState.lastShot < currentCooldown) return;

      if (activePowerUp === "tripleShot") {
        // Create three beams at different angles
        [-20, 0, 20].forEach((angle) => {
          const rad = (angle * Math.PI) / 180;
          const beam: Beam = {
            x: character.x + character.width / 2 - 5,
            y: character.y + character.height / 2,
            width: 10,
            height: 20,
            speed: 10,
            color: "yellow",
            speedX: Math.sin(rad) * 5,
            speedY: -10,
          };
          gameState.beams.push(beam);
        });
      } else if (activePowerUp === "wideBeam") {
        // Create a wider beam
        const beam: Beam = {
          x: character.x + character.width / 2 - 15,
          y: character.y + character.height / 2,
          width: 30,
          height: 20,
          speed: 10,
          color: "yellow",
          speedX: 0,
          speedY: -10,
        };
        gameState.beams.push(beam);
      } else {
        // Normal beam
        const beam: Beam = {
          x: character.x + character.width / 2 - 5,
          y: character.y + character.height / 2,
          width: 10,
          height: 20,
          speed: 10,
          color: "yellow",
          speedX: 0,
          speedY: -10,
        };
        gameState.beams.push(beam);
      }

      gameState.lastShot = currentTime;
    }

    function handleMovement() {
      const { character, keys } = gameState;
      if (keys["ArrowUp"]) character.y -= character.speed;
      if (keys["ArrowDown"]) character.y += character.speed;
      if (keys["ArrowLeft"]) character.x -= character.speed;
      if (keys["ArrowRight"]) character.x += character.speed;
      if (keys[" "]) createBeam();
    }

    function drawCharacter() {
      const { character } = gameState;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Flash the character when invulnerable
      if (character.isInvulnerable) {
        ctx.globalAlpha = Math.sin(Date.now() / 100) * 0.5 + 0.5;
      }

      // Draw rocket image instead of rectangle
      ctx.drawImage(
        rocketImage,
        character.x,
        character.y,
        character.width,
        character.height
      );

      ctx.globalAlpha = 1;
    }

    function drawBeams() {
      const { beams } = gameState;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      beams.forEach((beam, index) => {
        // Move beam upward
        beam.y -= beam.speed;

        // Remove beam if it goes off screen
        if (beam.y + beam.height < 0) {
          beams.splice(index, 1);
          return;
        }

        // Draw beam
        ctx.fillStyle = beam.color;
        ctx.fillRect(beam.x, beam.y, beam.width, beam.height);

        // Add glow effect
        ctx.shadowColor = "yellow";
        ctx.shadowBlur = 15;
        ctx.fillRect(beam.x, beam.y, beam.width, beam.height);
        ctx.shadowBlur = 0;
      });
    }

    function drawExplosions() {
      const { explosions } = gameState;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      explosions.forEach((explosion, explosionIndex) => {
        explosion.particles = explosion.particles.filter((particle) => {
          // Update particle position
          particle.x += particle.speedX;
          particle.y += particle.speedY;
          particle.life--;

          // Draw particle
          ctx.beginPath();
          ctx.arc(
            particle.x,
            particle.y,
            particle.size * (particle.life / PARTICLE_LIFE),
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `rgba(255, 87, 34, ${particle.life / PARTICLE_LIFE})`;
          ctx.fill();
          ctx.closePath();

          return particle.life > 0;
        });

        // Remove explosion if all particles are dead
        if (explosion.particles.length === 0) {
          explosions.splice(explosionIndex, 1);
        }
      });
    }

    function drawAsteroids() {
      const { asteroids, character } = gameState;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      asteroids.forEach((asteroid, index) => {
        // Move asteroid
        asteroid.x += asteroid.speedX;
        asteroid.y += asteroid.speedY;

        // Bounce off walls
        if (
          asteroid.x - asteroid.size < 0 ||
          asteroid.x + asteroid.size > canvas.width
        ) {
          asteroid.speedX *= -1;
        }

        // Remove if below screen and reduce life
        if (asteroid.y - asteroid.size > canvas.height) {
          asteroids.splice(index, 1);
          // Only reduce life if game is still active
          if (!isGameOver && !character.isInvulnerable) {
            setLives((prev) => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                setIsGameOver(true);
              } else {
                // Create explosion at the bottom where asteroid disappeared
                createExplosion(asteroid.x, canvas.height, asteroid.size);
                setIsRespawning(true);
              }
              return newLives;
            });
          }
          return;
        }

        // Draw asteroid
        ctx.beginPath();
        ctx.arc(asteroid.x, asteroid.y, asteroid.size, 0, Math.PI * 2);
        ctx.fillStyle = asteroid.color;
        ctx.fill();
        ctx.closePath();

        // Add crater effect
        ctx.beginPath();
        ctx.arc(
          asteroid.x - asteroid.size / 3,
          asteroid.y - asteroid.size / 3,
          asteroid.size / 4,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = "#654321";
        ctx.fill();
        ctx.closePath();
      });
    }

    function drawPowerUps() {
      const { powerUps } = gameState;
      powerUps.forEach((powerUp, index) => {
        // Move power-up down
        powerUp.y += 2;

        // Remove if off screen
        if (powerUp.y > canvas.height) {
          powerUps.splice(index, 1);
          return;
        }

        // Draw power-up
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.size, 0, Math.PI * 2);
        ctx.fillStyle = powerUp.color;
        ctx.fill();
        ctx.closePath();

        // Add glow effect
        ctx.shadowColor = powerUp.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    function clearScreen() {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw background image
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    }

    function keepCharacterInBounds() {
      const { character } = gameState;
      // Left boundary
      if (character.x < 0) {
        character.x = 0;
      }
      // Right boundary
      if (character.x + character.width > canvas.width) {
        character.x = canvas.width - character.width;
      }
      // Top boundary
      if (character.y < 0) {
        character.y = 0;
      }
      // Bottom boundary
      if (character.y + character.height > canvas.height) {
        character.y = canvas.height - character.height;
      }
    }

    function checkCollisions() {
      const { beams, asteroids } = gameState;
      beams.forEach((beam, beamIndex) => {
        asteroids.forEach((asteroid, asteroidIndex) => {
          const dx = beam.x + beam.width / 2 - asteroid.x;
          const dy = beam.y + beam.height / 2 - asteroid.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < asteroid.size) {
            createExplosion(asteroid.x, asteroid.y, asteroid.size);

            // Update score and check for level up
            setScore((prevScore) => {
              const newScore = prevScore + POINTS_PER_ASTEROID;

              // Check for level up at exact 1000 point intervals
              if (newScore % POINTS_PER_LEVEL === 0) {
                setLevel((prev) => prev + 1);
              }

              // Update high score if needed
              if (newScore > highScore) {
                setHighScore(newScore);
              }
              return newScore;
            });

            beams.splice(beamIndex, 1);
            asteroids.splice(asteroidIndex, 1);
          }
        });
      });
    }

    function checkPlayerCollision() {
      const { character, asteroids } = gameState;
      if (character.isInvulnerable) return false;

      const playerCenterX = character.x + character.width / 2;
      const playerCenterY = character.y + character.height / 2;

      for (const asteroid of asteroids) {
        const dx = playerCenterX - asteroid.x;
        const dy = playerCenterY - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < asteroid.size + character.width / 2) {
          // Create explosion at player position
          createExplosion(playerCenterX, playerCenterY, character.width);

          // Reduce lives and check for game over
          setLives((prev) => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setIsGameOver(true);
            } else {
              setIsRespawning(true);
            }
            return newLives;
          });
          return true;
        }
      }
      return false;
    }

    function checkPowerUpCollision() {
      const { character, powerUps } = gameState;
      const playerCenterX = character.x + character.width / 2;
      const playerCenterY = character.y + character.height / 2;

      powerUps.forEach((powerUp, index) => {
        const dx = playerCenterX - powerUp.x;
        const dy = playerCenterY - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < powerUp.size + character.width / 2) {
          // Activate power-up
          gameState.activePowerUp = powerUp.type;
          gameState.powerUpEndTime = Date.now() + POWER_UP_DURATION;
          powerUps.splice(index, 1);

          // Visual feedback
          createExplosion(powerUp.x, powerUp.y, powerUp.size * 2);
        }
      });
    }

    function gameLoop() {
      if (!isGameOver) {
        clearScreen();

        if (isRespawning) {
          respawnPlayer();
        }

        handleMovement();
        keepCharacterInBounds();
        createAsteroid();
        createPowerUp();
        checkCollisions();
        checkPowerUpCollision();
        if (checkPlayerCollision()) {
          // Don't stop the game loop, just wait for respawn
          drawAsteroids();
          drawBeams();
          drawExplosions();
          drawPowerUps();
          return;
        }
        drawAsteroids();
        drawBeams();
        drawExplosions();
        drawPowerUps();
        drawCharacter();
      }
      animationFrameId = requestAnimationFrame(gameLoop);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      gameState.keys[event.key] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      gameState.keys[event.key] = false;
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    // Don't start game loop immediately, wait for images to load
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    canvasWidth,
    canvasHeight,
    isGameOver,
    score,
    highScore,
    isRespawning,
    level,
  ]);

  return (
    <div className="relative flex gap-4 items-start p-4 max-h-screen">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="border border-black rounded-lg"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          {[...Array(lives)].map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 bg-red-500 rounded-full"
              title="Life"
            />
          ))}
        </div>
        {isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-4 text-black">Game Over!</h2>
              <p className="mb-2 text-black">Final Score: {score}</p>
              <p className="mb-4 text-black">High Score: {highScore}</p>
              <button
                onClick={resetGame}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      <StatsPanel score={score} highScore={highScore} level={level} />
    </div>
  );
};

export default Game;
