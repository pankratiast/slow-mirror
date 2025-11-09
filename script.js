const video = document.getElementById('delayed');
const button = document.getElementById('start');
let stream = null;
let recorder = null;
let chunks = [];

const DELAY_MS = 5000;

button.onclick = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    button.disabled = true;
    button.textContent = 'Recording...';

    // Start recording the live feed
    recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.start(100); // Capture every 100ms

    // After 5 seconds, start playback loop
    setTimeout(startPlayback, DELAY_MS);
  } catch (err) {
    alert('Camera access denied or unavailable.');
    console.error(err);
  }
};

function startPlayback() {
  const superBuffer = new Blob(chunks, { type: 'video/webm' });
  video.src = URL.createObjectURL(superBuffer);
  video.play();

  // Keep updating the delayed video
  video.onended = () => {
    if (chunks.length > 0) {
      chunks.shift(); // Remove oldest chunk
      const newBlob = new Blob(chunks, { type: 'video/webm' });
      video.src = URL.createObjectURL(newBlob);
      video.play();
    }
  };

  // Continue capturing new chunks
  recorder.ondataavailable = (e) => {
    chunks.push(e.data);
  };
}