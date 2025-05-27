const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');
const downloadLink = document.getElementById('download');
const strip = document.getElementById('strip');
const stripColorInput = document.getElementById('stripColor');

// Update strip background color live
stripColorInput.addEventListener('input', (e) => {
  document.body.style.setProperty('--strip-bg-color', e.target.value);
});

// Setup countdown and retake button
const countdown = document.createElement('div');
countdown.id = 'countdown';
countdown.style.fontSize = '2rem';
countdown.style.margin = '1rem 0';
countdown.style.fontWeight = 'bold';
countdown.style.color = '#333';
video.parentNode.insertBefore(countdown, captureBtn);

const retakeBtn = document.createElement('button');
retakeBtn.textContent = 'Retake';
retakeBtn.style.display = 'none';
video.parentNode.insertBefore(retakeBtn, downloadLink);

// Start camera
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    console.error("Camera error:", err);
  });

function showCountdown(seconds) {
  return new Promise((resolve) => {
    let remaining = seconds;
    countdown.textContent = remaining;
    const interval = setInterval(() => {
      remaining--;
      countdown.textContent = remaining > 0 ? remaining : '';
      if (remaining <= 0) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });
}

// Capture 3 photos with 3-second countdown before each
captureBtn.addEventListener('click', async () => {
  captureBtn.disabled = true;
  retakeBtn.style.display = 'none';
  strip.innerHTML = '';

  for (let i = 0; i < 3; i++) {
    await showCountdown(3);

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const imgData = canvas.toDataURL('image/png');

    const img = document.createElement('img');
    img.src = imgData;
    img.classList.add('photo');
    strip.appendChild(img);
  }

  countdown.textContent = '';
  retakeBtn.style.display = 'inline-block';
  captureBtn.disabled = false;
});

retakeBtn.addEventListener('click', () => {
  strip.innerHTML = '';
  retakeBtn.style.display = 'none';
});

// Download combined strip with 20px padding background color
downloadLink.addEventListener('click', (e) => {
  e.preventDefault();

  const photos = Array.from(strip.querySelectorAll('img.photo'));
  if (photos.length === 0) return;

  const bgColor = stripColorInput.value || '#ffffff';

  const padding = 50;

  const width = photos[0].naturalWidth;
  const height = photos.reduce((sum, img) => sum + img.naturalHeight, 0);

  const combinedCanvas = document.createElement('canvas');
  combinedCanvas.width = width + padding * 2;
  combinedCanvas.height = height + padding * 2;
  const ctx = combinedCanvas.getContext('2d');

  // Fill background with selected color (including padding area)
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

  let yOffset = padding;
  for (const img of photos) {
    ctx.drawImage(img, padding, yOffset, width, img.naturalHeight);
    yOffset += img.naturalHeight;
  }

  const combinedDataURL = combinedCanvas.toDataURL('image/png');

  const a = document.createElement('a');
  a.href = combinedDataURL;
  a.download = 'photo-strip.png';
  a.click();
});
