const playBtn = document.querySelector('.play-btn');
const pauseBtn = document.querySelector('.pause-btn');
const audio = document.getElementById('audio-player');
const body = document.body;
const loader = document.querySelector('.loader');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

let audioContext;
let analyser;
let dataArray;
let bufferLength;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = 150;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

playBtn.addEventListener('click', () => {
    loader.style.display = 'block';

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audio);

        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 256;

        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        drawVisualizer();
    }

    audio.load(); // Ensures the audio is ready to play
    audio.addEventListener('canplay', () => {
        loader.style.display = 'none';
        audio.play().then(() => {
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-block';
            body.classList.add('playing');
        }).catch((error) => {
            console.error('Error attempting to play audio:', error);
        });
    }, { once: true });
});

pauseBtn.addEventListener('click', () => {
    audio.pause();
    playBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
    body.classList.remove('playing');
});

function drawVisualizer() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    analyser.getByteFrequencyData(dataArray);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        const red = (barHeight + 100) * 2;
        const green = i / bufferLength * 255;
        const blue = 255;

        ctx.fillStyle = `rgb(${red},${green},${blue})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
    }

    requestAnimationFrame(drawVisualizer);
}
