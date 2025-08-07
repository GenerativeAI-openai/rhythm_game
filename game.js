let selectedSong = 'golden';
let difficulty = 'easy';
let combo = 0;
let audio;
let bpm = 120;
let gameInterval;

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

function selectDifficulty(diff) {
  difficulty = diff;
}

function startGame() {
  document.querySelector(".play-field").style.display = "block";
  if (audio) audio.pause();
  const data = songs[selectedSong];
  bpm = data.bpm;
  audio = new Audio(data.src);
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
    note.style.height = "40px";
    document.getElementById(`lane-${lane}`).appendChild(note);

    let pos = -40;
    const speed = difficulty === 'easy' ? 4 : 6;
    const fall = setInterval(() => {
      pos += speed;
      note.style.top = pos + "px";

      if (pos >= window.innerHeight) {
        clearInterval(fall);
        note.remove();
        showJudgment("MISS");
        combo = 0;
        updateCombo();
      }
    }, 20);

    // 판정: 누르는 순간 즉시
    note.addEventListener("mousedown", () => handleNoteHit(note, fall));
    note.addEventListener("touchstart", () => handleNoteHit(note, fall), { passive: true });
  }, spawnInterval);
}

function handleNoteHit(note, fall) {
  if (!note.isHit) { // 중복 판정 방지
    note.isHit = true;
    clearInterval(fall);
    note.remove();
    showJudgment("PERFECT");
    combo++;
    updateCombo();
  }
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
