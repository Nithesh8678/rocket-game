# 🪞 Mirror World: The Reality Swap Game - Roadmap

## 📌 Project Overview

Mirror World is a **puzzle-adventure game** where players navigate **two parallel worlds** that are **mirrors of each other**. Objects, doors, and puzzles exist in both worlds but **interact differently**, requiring players to **switch between worlds** to progress.

---

## 🔥 Phase 1: Planning & Setup (1-2 Days)

### ✅ Define the Game Concept

- Decide **core mechanics**: Switching worlds, puzzles, collectibles.
- Define **visual differences** between the "Real World" and "Mirror World."
- Sketch **level designs** (paper or Figma).

### ✅ Choose Tech Stack

| Component       | Tech                                 |
| --------------- | ------------------------------------ |
| **Game Engine** | Phaser.js (2D) OR Three.js (3D)      |
| **Frontend**    | Next.js + TailwindCSS                |
| **Backend**     | Node.js + Express.js                 |
| **Database**    | MongoDB (for saving game progress)   |
| **Real-time**   | Socket.io (optional for multiplayer) |

### ✅ Set Up the Repository

```sh
git init
npx create-next-app@latest mirror-world
cd mirror-world
npm install phaser tailwindcss express mongodb socket.io
```
