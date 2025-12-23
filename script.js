const video = document.getElementById('delayed');
const button = document.getElementById('start');

const DELAY_MS = 5000;
const FRAME_RATE = 30;

// We'll use a hidden video for the live feed and a canvas for the delayed display
let liveVideo = null;
let canvas = null;
let ctx = null;
let frameBuffer = [];
let running = false;

button.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    });

    button.disabled = true;
    button.textContent = 'Starting...';

    // Create hidden video element for live feed
    liveVideo = document.createElement('video');
    liveVideo.srcObject = stream;
    liveVideo.muted = true;
    liveVideo.playsInline = true;
    await liveVideo.play();

    // Create canvas for capturing frames
    canvas = document.createElement('canvas');
    canvas.width = liveVideo.videoWidth || 640;
    canvas.height = liveVideo.videoHeight || 480;
    ctx = canvas.getContext('2d');

    // Replace the video element with a canvas for display
    const displayCanvas = document.createElement('canvas');
    displayCanvas.width = canvas.width;
    displayCanvas.height = canvas.height;
    displayCanvas.id = 'delayed';
    // Copy video element's classes/styles
    displayCanvas.className = video.className;
    video.parentNode.replaceChild(displayCanvas, video);

    const displayCtx = displayCanvas.getContext('2d');

    running = true;
    button.textContent = `Buffering... (${DELAY_MS / 1000}s delay)`;

    // Main loop
    function captureAndDisplay() {
      if (!running) return;

      const now = performance.now();

      // Capture current frame
      ctx.drawImage(liveVideo, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      frameBuffer.push({ time: now, data: imageData });

      // Remove frames older than delay + 1 second buffer
      while (frameBuffer.length > 0 && frameBuffer[0].time < now - DELAY_MS - 1000) {
        frameBuffer.shift();
      }

      // Find frame closest to DELAY_MS ago
      const targetTime = now - DELAY_MS;
      let frameToShow = null;

      for (let i = frameBuffer.length - 1; i >= 0; i--) {
        if (frameBuffer[i].time <= targetTime) {
          frameToShow = frameBuffer[i];
          break;
        }
      }

      // Display the delayed frame (or show waiting message)
      if (frameToShow) {
        if (button.textContent !== 'LIVE (5s delay)') {
          button.textContent = 'LIVE (5s delay)';
        }
        displayCtx.putImageData(frameToShow.data, 0, 0);
      } else {
        // Still buffering - show countdown
        const buffered = frameBuffer.length > 0 ? (now - frameBuffer[0].time) / 1000 : 0;
        const remaining = Math.max(0, (DELAY_MS / 1000) - buffered).toFixed(1);
        button.textContent = `Buffering... ${remaining}s`;

        // Show black screen with text while buffering
        displayCtx.fillStyle = '#0a0a0a';
        displayCtx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);
        displayCtx.fillStyle = '#0ff';
        displayCtx.font = '24px Courier New';
        displayCtx.textAlign = 'center';
        displayCtx.fillText('Buffering...', displayCanvas.width / 2, displayCanvas.height / 2);
      }

      requestAnimationFrame(captureAndDisplay);
    }

    captureAndDisplay();

  } catch (err) {
    alert('Camera access denied or unavailable.');
    console.error(err);
    button.disabled = false;
    button.textContent = 'ENABLE CAMERA';
  }
};
