const audioCtx = new AudioContext();
const gainNode = audioCtx.createGain();
gainNode.connect(audioCtx.destination);
gainNode.gain.value = 0.1;

export function playSound(frequency: number) {
  const oscillator = audioCtx.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  // oscillator.connect(gainNode);

  const noteTime = 0.25;

  // add envelope for decaying
  const envelope = audioCtx.createGain();
  envelope.gain.setValueAtTime(1, audioCtx.currentTime);
  envelope.gain.exponentialRampToValueAtTime(
    0.01,
    audioCtx.currentTime + noteTime,
  );
  oscillator.connect(envelope);
  envelope.connect(gainNode);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + noteTime);
}

export const aMajorNotes = [220.5, 138.5, 164.5].map((h) => h * 2);
