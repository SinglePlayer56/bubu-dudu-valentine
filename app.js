const images = {
  question: [
    "assets/question-1.jpg",
    "assets/question-2.gif",
    "assets/question-3.gif",
  ],
  celebrate: ["assets/yes-1.jpg", "assets/yes-2.jpg"],
};

const state = {
  questionIndex: 0,
  celebrateIndex: 0,
};

const loader = document.getElementById("loader");
const app = document.getElementById("app");
const heroImage = document.getElementById("heroImage");
const celebrateImage = document.getElementById("celebrateImage");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const backBtn = document.getElementById("backBtn");
const screenQuestion = document.getElementById("screenQuestion");
const screenYes = document.getElementById("screenYes");
const soundToggle = document.getElementById("soundToggle");
const continueBtn = document.getElementById("continueBtn");
const bgAudio = document.getElementById("bgAudio");
const soundIcon = soundToggle.querySelector(".sound__icon");

bgAudio.volume = 0.35;

const allImages = [...images.question, ...images.celebrate];

function preloadImages(list) {
  return Promise.all(
    list.map(
      (src) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(src);
          img.onerror = reject;
          img.src = src;
        })
    )
  );
}

function setImage(el, list, index) {
  const nextIndex = index % list.length;
  el.src = list[nextIndex];
  el.alt = "";
  return nextIndex;
}

function rotateQuestionImage() {
  state.questionIndex = (state.questionIndex + 1) % images.question.length;
  setImage(heroImage, images.question, state.questionIndex);
}

function rotateCelebrateImage() {
  state.celebrateIndex = (state.celebrateIndex + 1) % images.celebrate.length;
  setImage(celebrateImage, images.celebrate, state.celebrateIndex);
}

function showScreen(screen) {
  screenQuestion.classList.toggle("screen--active", screen === "question");
  screenYes.classList.toggle("screen--active", screen === "yes");
}

function moveNoButton(event) {
  const container = document.getElementById("actions");
  const bounds = container.getBoundingClientRect();
  const btnBounds = noBtn.getBoundingClientRect();
  const yesBounds = yesBtn.getBoundingClientRect();
  const cursor = event
    ? { x: event.clientX, y: event.clientY }
    : { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };

  const radius = Math.min(200, bounds.width / 2);
  const minDistance = 40;
  const minCursorDistance = 110;

  const yesRect = {
    left: yesBounds.left - bounds.left - 12,
    top: yesBounds.top - bounds.top - 12,
    right: yesBounds.right - bounds.left + 12,
    bottom: yesBounds.bottom - bounds.top + 12,
  };

  let left = 0;
  let top = 0;
  let bestScore = -Infinity;

  const yesCenter = {
    x: (yesBounds.left + yesBounds.right) / 2,
    y: (yesBounds.top + yesBounds.bottom) / 2,
  };

  for (let i = 0; i < 26; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = minDistance + Math.random() * radius;
    const x = bounds.left + bounds.width / 2 + Math.cos(angle) * distance;
    const y = bounds.top + bounds.height / 2 + Math.sin(angle) * distance;

    const candidateLeft = Math.min(
      Math.max(x - bounds.left - btnBounds.width / 2, 0),
      bounds.width - btnBounds.width
    );
    const candidateTop = Math.min(
      Math.max(y - bounds.top - btnBounds.height / 2, 0),
      bounds.height - btnBounds.height
    );

    const noRect = {
      left: candidateLeft,
      top: candidateTop,
      right: candidateLeft + btnBounds.width,
      bottom: candidateTop + btnBounds.height,
    };

    const overlap =
      noRect.left < yesRect.right &&
      noRect.right > yesRect.left &&
      noRect.top < yesRect.bottom &&
      noRect.bottom > yesRect.top;

    if (overlap) continue;

    const noCenter = {
      x: bounds.left + candidateLeft + btnBounds.width / 2,
      y: bounds.top + candidateTop + btnBounds.height / 2,
    };
    const cursorDistance = Math.hypot(
      noCenter.x - cursor.x,
      noCenter.y - cursor.y
    );
    const yesDistance = Math.hypot(
      noCenter.x - yesCenter.x,
      noCenter.y - yesCenter.y
    );

    const cursorScore =
      cursorDistance < minCursorDistance ? -1000 : cursorDistance;
    const score = cursorScore + yesDistance * 0.4;

    if (score > bestScore) {
      bestScore = score;
      left = candidateLeft;
      top = candidateTop;
    }
  }

  noBtn.style.position = "absolute";
  noBtn.style.left = `${left}px`;
  noBtn.style.top = `${top}px`;
  rotateQuestionImage();
}

function setupNoButton() {
  const hasPointer = window.matchMedia("(pointer: fine)").matches;
  if (hasPointer) {
    noBtn.addEventListener("mouseenter", moveNoButton);
    noBtn.addEventListener("mousemove", moveNoButton);
    noBtn.addEventListener("pointerdown", moveNoButton);
  } else {
    noBtn.addEventListener("pointerdown", moveNoButton);
  }
}

function setSoundState(isPlaying) {
  soundIcon.textContent = isPlaying ? "volume_up" : "volume_off";
  soundToggle.classList.toggle("is-playing", isPlaying);
  soundToggle.setAttribute(
    "aria-label",
    isPlaying ? "Выключить музыку" : "Включить музыку"
  );
}

soundToggle.addEventListener("click", async () => {
  if (bgAudio.paused) {
    try {
      await bgAudio.play();
      setSoundState(true);
    } catch (err) {
      console.warn("Не удалось запустить аудио", err);
    }
  } else {
    bgAudio.pause();
    setSoundState(false);
  }
});

continueBtn.addEventListener("click", async () => {
  try {
    await bgAudio.play();
    setSoundState(true);
  } catch (err) {
    setSoundState(false);
  }

  loader.classList.add("is-hidden");
  window.setTimeout(() => {
    loader.style.display = "none";
  }, 420);
  app.hidden = false;
  setupNoButton();
});

yesBtn.addEventListener("click", () => {
  rotateCelebrateImage();
  showScreen("yes");
});

backBtn.addEventListener("click", () => {
  showScreen("question");
});

preloadImages(allImages)
  .then(() => {
    setSoundState(false);
    setImage(heroImage, images.question, state.questionIndex);
    setImage(celebrateImage, images.celebrate, state.celebrateIndex);
    continueBtn.disabled = false;
  })
  .catch(() => {
    setSoundState(false);
    continueBtn.disabled = false;
  });
