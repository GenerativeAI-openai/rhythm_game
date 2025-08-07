let selectedSong = 'golden';
let difficulty = 'easy';
let combo = 0;
let score = 0;
let audio;
let bpm = 120;
let gameInterval;
let analyser, audioContext, source;
let pitch = 0;
let activeNotes = new Map();

const songs = {
  golden: {
    title: "Golden",
    artist: "KPop Demon Hunters",
    date: "2025.07.04",
    cover: "image/Kpop Demon Hunters.webp",
    src: "music/Golden.mp3",
    bpm: 123
  },
  sodapop: {
    title: "Soda Pop",
    artist: "KPop Demon Hunters",
    date: "2025.07.04",
    cover: "image/Kpop Demon Hunters.webp",
    src: "music/Soda Pop.mp3",
    bpm: 126
  },
  takedown: {
    title: "Takedown",
    artist: "KPop Demon Hunters",
    date: "2025.07.04",
    cover: "image/Kpop Demon Hunters.webp",
    src: "music/Takedown.mp3",
    bpm: 140
  },
  apt: {
    title: "APT.",
    artist: "ROSE & Bruno Mars",
    date: "2025.07.04",
    cover: "image/apt.webp",
    src: "music/APT.mp3",
    bpm: 149
  }
};

function detectPitch(buffer, sampleRate) {
  const SIZE = buffer.length;
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;
  let lastCorrelation = 1;
  for (let offset = 8; offset < 1000; offset++) {
    let correlation = 0;
    for (let i = 0; i < SIZE - offset; i++) {
      correlation += Math.abs((buffer[i]) - (buffer[i + offset]));
    }
    correlation = 1 - (correlation / SIZE);
    if (correlation > 0.9 && correlation > lastCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
    lastCorrelation = correlation;
  }
  if (bestCorrelation > 0.9) {
    return sampleRate / bestOffset;
  }
  return -1;
}

function getPitch() {
  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);
  const p = detectPitch(buffer, audioContext.sampleRate);
  if (p > 0) {
    pitch = p;
  }
}

function selectDifficulty(diff) {
  difficulty = diff;
}

function startGame() {
  document.querySelector(".play-field").style.display = "block";
  if (audio) audio.pause();
  const data = songs[selectedSong];
  bpm = data.bpm;
  audio = new Audio(data.src);
  audioContext = new AudioContext();
  source = audioContext.createMediaElementSource(audio);
  analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  analyser.fftSize = 2048;
  setInterval(getPitch, 200);

  audio.play();
  spawnNotes();
}

function spawnNotes() {
  const lanes = [0, 1, 2, 3];
  if (gameInterval) clearInterval(gameInterval);
  const beatInterval = 60000 / bpm;
  const spawnInterval = beatInterval / (difficulty === 'easy' ? 1 : 2);

  gameInterval = setInterval(() => {
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const note = document.createElement("div");
    note.className = "note";
    note.style.top = "-40px";

    // 길이 설정
    const isLong = pitch > 500;
    const height = isLong ? 100 : 40;
    note.style.height = height + "px";
    note.dataset.long = isLong;

    document.getElementById(`lane-${lane}`).appendChild(note);

    let pos = -40;
    const speed = difficulty === 'easy' ? 4 : 6;
    const spawnTime = Date.now();
    activeNotes.set(note, { spawnTime, isLong });

    const fall = setInterval(() => {
      pos += speed;
      note.style.top = pos + "px";

      if (pos >= window.innerHeight) {
        clearInterval(fall);
        note.remove();
        activeNotes.delete(note);
        showJudgment("MISS");
        combo = 0;
        updateCombo();
      }
    }, 20);

    // 클릭 판정
    note.addEventListener("mousedown", () => handleNoteHit(note, fall));
    note.addEventListener("touchstart", () => handleNoteHit(note, fall), { passive: true });
    if (isLong) {
      note.addEventListener("mouseup", () => handleLongRelease(note));
      note.addEventListener("touchend", () => handleLongRelease(note));
    }
  }, spawnInterval);
}

function handleNoteHit(note, fall) {
  if (note.isHit) return;
  const { spawnTime, isLong } = activeNotes.get(note) || {};
  const now = Date.now();
  const delta = Math.abs(now - spawnTime - 1000); // 1초 후 도착 가정
  let judgment = "GOOD";
  if (delta < 100) judgment = "PERFECT";
  else if (delta < 250) judgment = "GREAT";

  if (isLong) {
    note.style.background = "lime";
    note.dataset.held = "true";
    return; // 판정은 release에서
  }

  clearInterval(fall);
  note.remove();
  activeNotes.delete(note);
  showJudgment(judgment);
  updateScore(judgment);
}

function handleLongRelease(note) {
  if (note.dataset.held === "true") {
    note.remove();
    activeNotes.delete(note);
    showJudgment("PERFECT");
    updateScore("PERFECT");
  }
}

function updateScore(judgment) {
  if (judgment === "MISS") {
    combo = 0;
  } else {
    combo++;
    let base = 0;
    if (judgment === "PERFECT") base = 100;
    else if (judgment === "GREAT") base = 60;
    else if (judgment === "GOOD") base = 30;
    score += base * Math.max(1, combo);
  }
  updateCombo();
  updateScoreDisplay();
}

function showJudgment(text) {
  const judgment = document.getElementById("judgment");
  judgment.innerText = text;
  judgment.style.animation = "none";
  void judgment.offsetWidth;
  judgment.style.animation = "fadeout 1s ease-out forwards";
}

function updateCombo() {
  const comboBox = document.getElementById("combo");
  if (combo > 1) comboBox.innerText = combo + " Combo!";
  else comboBox.innerText = "";
  comboBox.style.animation = "none";
  void comboBox.offsetWidth;
  comboBox.style.animation = "fadeout 1s ease-out forwards";
}

function updateScoreDisplay() {
  let el = document.getElementById("score");
  if (!el) {
    el = document.createElement("div");
    el.id = "score";
    el.style.position = "absolute";
    el.style.top = "5%";
    el.style.right = "5%";
    el.style.color = "white";
    el.style.fontSize = "24px";
    el.style.textShadow = "0 0 10px #fff";
    el.style.zIndex = "99999";
    document.body.appendChild(el);
  }
  el.innerText = "Score: " + score;
}

window.addEventListener("DOMContentLoaded", () => {
  const songListEl = document.getElementById("song-list");
  const cover = document.getElementById("cover");
  const title = document.getElementById("title");
  const artist = document.getElementById("artist");
  const date = document.getElementById("date");

  Object.entries(songs).forEach(([key, data], index) => {
    const songDiv = document.createElement("div");
    songDiv.className = "song";
    songDiv.dataset.song = key;

    songDiv.innerHTML = `
      <img src="${data.cover}" alt="${data.title}" />
      <div class="info">
        <strong>${data.title}</strong>
        <small>${data.artist}</small>
      </div>
    `;

    songDiv.addEventListener("click", () => {
      selectedSong = key;
      cover.src = data.cover;
      title.innerText = data.title;
      artist.innerText = data.artist;
      date.innerText = data.date;
    });

    if (index === 0) {
      selectedSong = key;
      cover.src = data.cover;
      title.innerText = data.title;
      artist.innerText = data.artist;
      date.innerText = data.date;
    }

    songListEl.appendChild(songDiv);
  });
});
