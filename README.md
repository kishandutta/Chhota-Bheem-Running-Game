# Chhota Bheem: Dholakpur Rush 3D 🏃💨

An ultra-realistic, highly immersive 3D endless runner game built with **Three.js** and **WebGL**, starring **Chhota Bheem** navigating the twilight forest of Dholakpur.

---

## 🌟 Features

- **Procedural 3D Character Model**: Meticulously sculpted Chhota Bheem cartoon model matching official turnaround references:
  - 1024×1024 high-definition procedural cartoon face texture (expressive eyes with dual sparkles, arched brows, sacred tilak, cute button nose, and joyful smile).
  - Voluminous chestnut-brown hair dome with signature rear nape flick (ducktail).
  - Saffron-orange pleated dhoti, golden amulet locket, and golden wrist cuffs.
  - Realistic running animations with harmonic body bobbing, leaps, and sliding rolls.
- **Cinematic Atmosphere & Lighting**:
  - Dynamic twilight sunset directional lighting with PCF soft shadows.
  - Atmospheric forest fog and roadside golden flame torches.
  - Over 140 bioluminescent fireflies swarming along the dirt paths.
- **Dynamic 3-Lane Track Streaming**:
  - Seamless chunk recycling system with zero garbage collection spikes.
  - Varied ancient banyan tree barriers, wooden hurdles, and rock obstacles.
- **Collectibles & Power-Ups**:
  - Golden Motichoor Laddus with rotating halos.
  - **Laddu Magnet**: Pulls laddus dynamically with quadratic Bézier curves.
  - **Super Laddu Boost**: High-speed warp mode with speed lines, dynamic FOV expansion, and obstacle-shattering physics.
- **Relaxing Procedural BGM & Sound Engine**:
  - 100% offline Web Audio API synthesizer.
  - Soothing background music featuring gentle bamboo flute (*Bansuri*), wooden marimba/kalimba arpeggios, and sunset ambient pad chords.
  - Procedural sound effects for jumps, slides, laddu collections, power-ups, and crashes.
- **Responsive Touch & Swipe Controls**:
  - Optimized for mobile smartphones and desktop keyboards.
  - Real-time gesture detection for ultra-low latency response.

---

## 🎮 Controls

### Desktop (Keyboard)
| Key | Action |
| --- | --- |
| **A** / **Left Arrow** | Switch Lane Left |
| **D** / **Right Arrow** | Switch Lane Right |
| **W** / **Up Arrow** / **Space** | Jump over obstacles |
| **S** / **Down Arrow** | Slide / Roll under high barriers |
| **P** / **Esc** | Pause / Resume |

### Mobile (Touch / Swipe)
| Gesture | Action |
| --- | --- |
| **Swipe Left** | Move Left |
| **Swipe Right** | Move Right |
| **Swipe Up** | Jump |
| **Swipe Down** | Slide / Roll |
| **Tap Screen** | Start Game / Dismiss Menu |

---

## 🚀 Getting Started

### Local Setup
No build tools or installations required! Simply serve the directory with any local static server:

```bash
# Using Python
python -m http.server 8080

# Or using Node.js npx serve
npx serve .
```

Open your browser at `http://localhost:8080` to play.

---

## 🛠️ Tech Stack

- **Graphics Engine**: Three.js (r128)
- **Rendering**: WebGL 2.0 with PCF Soft Shadows & ACES Filmic Tone Mapping
- **Audio**: Web Audio API (100% procedural sound synthesis)
- **Styling**: Vanilla CSS3 Glassmorphism with Google Fonts (*Cinzel Decorative* & *Outfit*)

---

## 📜 License

This project is licensed under the MIT License.
