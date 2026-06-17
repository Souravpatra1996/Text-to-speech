const textInput = document.querySelector("#text-input");
const voiceSelect = document.querySelector("#voice-select");
const rateInput = document.querySelector("#rate");
const pitchInput = document.querySelector("#pitch");
const rateValue = document.querySelector("#rate-value");
const pitchValue = document.querySelector("#pitch-value");
const speakButton = document.querySelector("#speak-button");
const pauseButton = document.querySelector("#pause-button");
const resumeButton = document.querySelector("#resume-button");
const stopButton = document.querySelector("#stop-button");
const statusText = document.querySelector("#status");

const synth = window.speechSynthesis;
let voices = [];
let activeUtterance = null;

function setStatus(message) {
  statusText.textContent = message;
}

function updateSliderLabels() {
  rateValue.textContent = Number(rateInput.value).toFixed(1);
  pitchValue.textContent = Number(pitchInput.value).toFixed(1);
}

function updateButtons() {
  const supported = "speechSynthesis" in window;
  const speaking = supported && synth.speaking;
  const paused = supported && synth.paused;

  speakButton.disabled = !supported;
  pauseButton.disabled = !speaking || paused;
  resumeButton.disabled = !paused;
  stopButton.disabled = !speaking && !paused;
}

function formatVoiceName(voice) {
  const language = voice.lang ? ` (${voice.lang})` : "";
  return `${voice.name}${language}`;
}

function populateVoices() {
  voices = synth.getVoices();
  const selectedVoice = voiceSelect.value;

  voiceSelect.innerHTML = "";

  voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = formatVoiceName(voice);
    voiceSelect.append(option);
  });

  if (voices.length === 0) {
    const option = document.createElement("option");
    option.textContent = "No voices available";
    voiceSelect.append(option);
    voiceSelect.disabled = true;
    setStatus("No browser voices are available.");
    return;
  }

  voiceSelect.disabled = false;

  if (selectedVoice && voices[Number(selectedVoice)]) {
    voiceSelect.value = selectedVoice;
  } else {
    const defaultIndex = voices.findIndex((voice) => voice.default);
    voiceSelect.value = String(defaultIndex >= 0 ? defaultIndex : 0);
  }
}

function stopSpeech() {
  if (synth.speaking || synth.paused) {
    synth.cancel();
  }

  activeUtterance = null;
  setStatus("Stopped");
  updateButtons();
}

function speakText() {
  const text = textInput.value.trim();

  if (!text) {
    setStatus("Add some text first.");
    textInput.focus();
    return;
  }

  synth.cancel();

  activeUtterance = new SpeechSynthesisUtterance(text);
  activeUtterance.rate = Number(rateInput.value);
  activeUtterance.pitch = Number(pitchInput.value);

  const selectedVoice = voices[Number(voiceSelect.value)];
  if (selectedVoice) {
    activeUtterance.voice = selectedVoice;
  }

  activeUtterance.onstart = () => {
    setStatus("Speaking...");
    updateButtons();
  };

  activeUtterance.onpause = () => {
    setStatus("Paused");
    updateButtons();
  };

  activeUtterance.onresume = () => {
    setStatus("Speaking...");
    updateButtons();
  };

  activeUtterance.onend = () => {
    activeUtterance = null;
    setStatus("Finished");
    updateButtons();
  };

  activeUtterance.onerror = () => {
    activeUtterance = null;
    setStatus("Something went wrong while speaking.");
    updateButtons();
  };

  synth.speak(activeUtterance);
  setStatus("Preparing voice...");
  updateButtons();
}

if (!("speechSynthesis" in window)) {
  setStatus("Your browser does not support text to speech.");
  updateButtons();
} else {
  populateVoices();
  updateSliderLabels();
  updateButtons();

  synth.addEventListener("voiceschanged", populateVoices);

  speakButton.addEventListener("click", speakText);
  pauseButton.addEventListener("click", () => {
    if (synth.speaking && !synth.paused) {
      synth.pause();
    }
    updateButtons();
  });
  resumeButton.addEventListener("click", () => {
    if (synth.paused) {
      synth.resume();
    }
    updateButtons();
  });
  stopButton.addEventListener("click", stopSpeech);

  rateInput.addEventListener("input", updateSliderLabels);
  pitchInput.addEventListener("input", updateSliderLabels);
  textInput.addEventListener("input", () => {
    if (activeUtterance) {
      setStatus("Text changed. Press Speak to restart with the new text.");
    }
  });
}
