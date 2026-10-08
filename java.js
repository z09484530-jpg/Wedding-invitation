const weddingDate = new Date("2027-08-22T15:00:00");
const invitationOverlay = document.querySelector("#invitation-overlay");
const envelopeScreen = document.querySelector("#envelope-screen");
const invitationLetter = document.querySelector("#invitation-letter");
const heartGarden = document.querySelector("#heart-garden");
const openEnvelopeButton = document.querySelector("#open-envelope");
const continueButton = document.querySelector("#continue-to-site");
const musicToggle = document.querySelector("#music-toggle");
const musicLabel = musicToggle?.querySelector(".music-label");

let audioContext;
let musicGain;
let musicTimer;
let musicStep = 0;
let musicPlaying = false;
if (heartGarden && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const heartColors = ["#ff8db7", "#e7a5ff", "#ffd27d", "#fff0f5", "#d88aff"];
  const hearts = document.createDocumentFragment();
  for (let index = 0; index < 50; index += 1) {
    const heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.textContent = index % 3 === 0 ? "♡" : "♥";
    heart.style.setProperty("--heart-left", `${Math.random() * 100}%`);
    heart.style.setProperty("--heart-color", heartColors[index % heartColors.length]);
    heart.style.setProperty("--heart-size", `${12 + Math.random() * 19}px`);
    heart.style.setProperty("--heart-duration", `${12 + Math.random() * 17}s`);
    heart.style.setProperty("--heart-delay", `${-Math.random() * 28}s`);
    heart.style.setProperty("--heart-drift", `${Math.random() * 180 - 90}px`);
    heart.style.setProperty("--heart-opacity", `${0.32 + Math.random() * 0.48}`);
    hearts.append(heart);
  }
  heartGarden.append(hearts);
}

const chordProgression = [
  [261.63, 329.63, 392],
  [220, 261.63, 329.63],
  [174.61, 220, 261.63],
  [196, 246.94, 293.66]
];

function playNote(frequency, startTime, duration, volume, type = "sine") {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(musicGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

function playMusicStep() {
  if (!audioContext || !musicGain || audioContext.state !== "running") return;

  const now = audioContext.currentTime;
  const chordIndex = Math.floor(musicStep / 4) % chordProgression.length;
  const chord = chordProgression[chordIndex];
  const beat = musicStep % 4;

  if (beat === 0) {
    chord.forEach((frequency) => playNote(frequency / 2, now, 2.8, 0.055));
  }
  playNote(chord[(beat + chordIndex) % chord.length] * 2, now, 0.62, 0.13, "triangle");
  musicStep += 1;
}

function startMusic() {
  if (!window.AudioContext) {
    if (musicLabel) musicLabel.textContent = "Бул браузерде музыка иштебейт";
    return;
  }

  if (!audioContext) {
    audioContext = new window.AudioContext();
    musicGain = audioContext.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(audioContext.destination);
  }

  audioContext.resume().then(() => {
    if (musicPlaying) return;
    musicPlaying = true;
    musicGain.gain.cancelScheduledValues(audioContext.currentTime);
    musicGain.gain.setValueAtTime(musicGain.gain.value, audioContext.currentTime);
    musicGain.gain.linearRampToValueAtTime(0.22, audioContext.currentTime + 0.8);
    musicStep = 0;
    playMusicStep();
    musicTimer = window.setInterval(playMusicStep, 700);
    musicToggle?.setAttribute("aria-pressed", "true");
    musicToggle?.setAttribute("aria-label", "Музыканы өчүрүү");
    if (musicLabel) musicLabel.textContent = "Музыканы өчүрүү";
  }).catch((error) => {
    if (musicLabel) musicLabel.textContent = "Музыканы күйгүзүү";
    console.error("Музыканы ойнотуу ишке ашкан жок:", error);
  });
}

function stopMusic() {
  if (!audioContext || !musicPlaying) return;
  musicPlaying = false;
  window.clearInterval(musicTimer);
  musicGain.gain.cancelScheduledValues(audioContext.currentTime);
  musicGain.gain.setValueAtTime(musicGain.gain.value, audioContext.currentTime);
  musicGain.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 0.25);
  musicToggle?.setAttribute("aria-pressed", "false");
  musicToggle?.setAttribute("aria-label", "Музыканы күйгүзүү");
  if (musicLabel) musicLabel.textContent = "Музыканы күйгүзүү";
}

musicToggle?.addEventListener("click", () => {
  if (musicPlaying) stopMusic();
  else startMusic();
});

if (invitationOverlay) document.body.classList.add("invitation-locked");

openEnvelopeButton?.addEventListener("click", () => {
  startMusic();
  openEnvelopeButton.classList.add("is-open");
  openEnvelopeButton.disabled = true;
  window.setTimeout(() => {
    if (envelopeScreen) envelopeScreen.hidden = true;
    invitationOverlay?.classList.add("has-letter");
    if (invitationLetter) invitationLetter.hidden = false;
    if (invitationOverlay) invitationOverlay.scrollTop = 0;
  }, 500);
});

continueButton?.addEventListener("click", () => {
  if (invitationOverlay) invitationOverlay.hidden = true;
  document.body.classList.remove("invitation-locked");
  document.querySelector("#home")?.scrollIntoView({ behavior: "smooth" });
});

const countdownFields = {
  days: document.querySelector('[data-time="days"]'),
  hours: document.querySelector('[data-time="hours"]'),
  minutes: document.querySelector('[data-time="minutes"]'),
  seconds: document.querySelector('[data-time="seconds"]')
};

function updateCountdown() {
  const remaining = Math.max(0, weddingDate.getTime() - Date.now());
  const seconds = Math.floor(remaining / 1000);
  const values = {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60
  };

  Object.entries(countdownFields).forEach(([unit, element]) => {
    if (element) element.textContent = String(values[unit]).padStart(unit === "days" ? 3 : 2, "0");
  });
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

const rsvpForm = document.querySelector("#rsvp-form");
const formMessage = document.querySelector("#form-message");
const guestNameInput = document.querySelector("#guest-name");
const letterGuestGreeting = document.querySelector("#letter-guest-greeting");
const invitationMarquee = document.querySelector("#invitation-marquee");
const whatsappNumber = "996774062344";

function getInvitationText(guestName = "") {
  const greeting = guestName ? `Кымбаттуу ${guestName}` : "Кымбаттуу коногубуз";
  return `${greeting}, Айбек менен Айдана сиздерди 22-август, 2027-жылы саат 15:00дө Ош шаарындагы ресторанда өтө турган үйлөнүү тоюна чакырат. Сизди күтөбүз!`;
}

function updateInvitationMarquee() {
  const guestName = guestNameInput?.value.trim() || "";
  if (letterGuestGreeting) {
    letterGuestGreeting.textContent = guestName || "коногубуз";
    letterGuestGreeting.classList.remove("name-updated");
    void letterGuestGreeting.offsetWidth;
    letterGuestGreeting.classList.add("name-updated");
  }
  if (!invitationMarquee) return;
  const invitation = getInvitationText(guestName);
  invitationMarquee.querySelectorAll(":scope > span").forEach((item) => {
    item.firstChild.textContent = `${invitation} `;
  });
}

guestNameInput?.addEventListener("input", updateInvitationMarquee);

document.querySelectorAll(".speak-invitation").forEach((button) => {
  button.addEventListener("click", () => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      if (formMessage) formMessage.textContent = "Бул браузер үн менен окууну колдобойт.";
      return;
    }

    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(getInvitationText(guestNameInput?.value.trim() || ""));
    speech.lang = "ky-KG";
    window.speechSynthesis.speak(speech);
  });
});

rsvpForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!rsvpForm.reportValidity()) return;

  const formData = new FormData(rsvpForm);
  const response = {
    name: String(formData.get("name")).trim(),
    phone: String(formData.get("phone")).trim(),
    attendance: String(formData.get("attendance"))
  };
  const attendanceMessage = response.attendance === "yes"
    ? "Жубайым экөөбүз барабыз"
    : "Бара албайбыз";
  const whatsappMessage = [
    "Саламатсызбы! Тойго чакыруу боюнча жооп:",
    `Аты-жөнү: ${response.name}`,
    `Байланыш номери: ${response.phone}`,
    `Жооп: ${attendanceMessage}`
  ].join("\n");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  try {
    const responses = JSON.parse(localStorage.getItem("wedding-rsvp") || "[]");
    responses.push({ name: response.name, attendance: response.attendance });
    localStorage.setItem("wedding-rsvp", JSON.stringify(responses));
  } catch (error) {
    console.error("RSVP жоопту сактоо ишке ашкан жок:", error);
  }

  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  if (formMessage) formMessage.textContent = `Рахмат, ${response.name}! Жообуңуз WhatsApp аркылуу жөнөтүүгө даяр. Ачылган WhatsApp'та жөнөтүүнү ырастаңыз.`;
  rsvpForm.reset();
  updateInvitationMarquee();
});