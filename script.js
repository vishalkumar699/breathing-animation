// === DOM References ===
const primary   = document.querySelector('.breathing-shape-primary');
const secondary = document.querySelector('.breathing-shape-secondary');
const startBtn  = document.getElementById('startButton');
const stopBtn   = document.getElementById('stopButton');
const msg       = document.querySelector('.message');
const timerDisp = document.querySelector('.timer-display');
const patternSel= document.getElementById('patternSelect');
const vibeSel   = document.getElementById('vibeSelect');
const body = document.body; // Get a reference to the body element


// === State ===
let isBreathing   = false;
let timerInterval = null;
let elapsedSec    = 0;

// === Sleep Helper ===
const sleep = ms => new Promise(res => setTimeout(res, ms));


// === Breathing Patterns (durations in ms) ===
const patterns = {
    equal: { steps: ['Inhale','Exhale'],           durations: [4000,4000] },
    box:   { steps: ['Inhale','Hold','Exhale','Hold'], durations: [4000,4000,4000,4000] }
};

// === Vibe Styles (CSS variables) ===
const vibes = {
    ethereal: {
        name: 'Ethereal',
        '--primary-color': 'rgba(173,216,230,0.6)',
        '--secondary-color':'rgba(144,238,144,0.6)',
        '--accent-color': 'rgba(255,250,205,0.8)',
        '--background-gradient-start':'#e0e9f0',
        '--background-gradient-end':'#c0d0e0',
        '--text-color-dark':'#333a47',
        '--text-color-light': 'var(--text-color-dark)',
        '--text-color-accent': 'var(--text-color-dark)',
        '--button-bg-color':'var(--secondary-color)',
        '--button-text-color':'var(--text-color-dark)',
        '--button-hover-bg-color':'var(--accent-color)',
        '--button-shadow-color': 'rgba(0, 0, 0, 0.1)'
    },
    calm: {
        name: 'Calm (Dark)',
        '--primary-color':'#4a4e69',
        '--secondary-color':'#918eab',
        '--accent-color':'#b5e8d5',
        '--background-gradient-start':'#232633',
        '--background-gradient-end':'#3a3f54',
        '--text-color-light':'#e0e0e0',
        '--text-color-dark': 'var(--text-color-light)',
        '--text-color-accent': 'var(--accent-color)',
        '--button-bg-color':'#918eab',
        '--button-text-color':'#e0e0e0',
        '--button-hover-bg-color':'#a29ebc',
        '--button-shadow-color': 'rgba(74, 78, 105, 0.6)'
    },
    focused: {
        name: 'Focused (Dark)',
        '--primary-color':'#536fa1',
        '--secondary-color':'#81a2d0',
        '--accent-color':'#a2d2ff',
        '--background-gradient-start':'#303640',
        '--background-gradient-end':'#4c566a',
        '--text-color-light':'#e5e9f0',
        '--text-color-dark': 'var(--text-color-light)',
        '--text-color-accent': 'var(--accent-color)',
        '--button-bg-color':'#81a2d0',
        '--button-text-color':'#e5e9f0',
        '--button-hover-bg-color':'#a2d2ff',
        '--button-shadow-color': 'rgba(83, 111, 161, 0.6)'
    },
    energetic: {
        name: 'Energetic (Dark)',
        '--primary-color':'rgba(240, 138, 93, 0.7)',
        '--secondary-color':'rgba(243, 178, 161, 0.7)',
        '--accent-color':'#ffdd95',
        '--background-gradient-start':'#403028', // Dark start color
        '--background-gradient-end':'#5a4b40', // Dark end color
        '--text-color-light':'#fff5e1',
        '--text-color-dark': 'var(--text-color-light)',
        '--text-color-accent': '#fff5e1',
        '--button-bg-color':'var(--secondary-color)',
        '--button-text-color':'var(--text-color-light)',
        '--button-hover-bg-color':'var(--accent-color)',
        '--button-shadow-color': 'rgba(240, 138, 93, 0.4)'
    }
};


let currentPattern = patterns[patternSel.value];
let currentVibe = vibes['ethereal']; // Default to ethereal

// Function to apply the selected vibe's CSS variables
function applyVibe(key) {
    const root = document.documentElement;
    const selectedVibe = vibes[key];
    if (selectedVibe) {
        for (const [property, value] of Object.entries(selectedVibe)) {
            if (property !== 'name') {
                root.style.setProperty(property, value);
            }
        }
        // Update currentVibe state variable
        currentVibe = selectedVibe;

        // --- Explicitly set body background after variables are updated ---
        // This should force the browser to use the new gradient variable values.
        const bgStart = selectedVibe['--background-gradient-start'];
        const bgEnd = selectedVibe['--background-gradient-end'];
        if (body && bgStart && bgEnd) {
            body.style.background = `linear-gradient(135deg, ${bgStart} 0%, ${bgEnd} 100%)`;
        }

        // Optional: Explicitly trigger reflow/repaint on container as well
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            void appContainer.offsetWidth;
        }
    }
}

// === Timer Functions ===
function startTimer() {
    elapsedSec = 0;
    if(timerDisp) timerDisp.textContent = '00:00';
    timerInterval = setInterval(() => {
        elapsedSec++;
        const m = String(Math.floor(elapsedSec/60)).padStart(2,'0');
        const s = String(elapsedSec%60).padStart(2,'0');
        if(timerDisp) timerDisp.textContent = `${m}:${s}`;
    }, 1000);
}
function stopTimer() {
    clearInterval(timerInterval);
}

// === Core Breathing Loop ===
async function breatheLoop() {
    const { steps, durations } = patterns[ patternSel.value ];
    let idx = 0;

    while(isBreathing) {
        const step = steps[idx];
        // Get duration, applying speed multiplier from current vibe
        const dur  = durations[idx] / (currentVibe['--animation-speed-multiplier'] || 1);


        if(msg) msg.textContent = step;

        if (primary && secondary) {
            // Determine ease function - maybe linear for exhale feels better?
            const ease = (step === 'Exhale') ? 'linear' : 'ease-in-out';

            // Apply transition duration and ease function
            primary.style.transition   = `transform ${dur}ms ${ease}`;
            secondary.style.transition = `transform ${dur}ms ${ease}`;


            if (step === 'Inhale') {
                primary.style.transform   = 'scale(1.6)';
                secondary.style.transform = 'scale(1.5)';
            }
            else if (step === 'Exhale') {
                primary.style.transform   = 'scale(1)';
                secondary.style.transform = 'scale(1)';
            }
            else { // Hold
                // Instantly set transition duration to 0 for hold phases
                primary.style.transition   = 'transform 0ms';
                secondary.style.transition = 'transform 0ms';
            }
        }


        // wait full duration (small sleeps so stopBreathing responds)
        const start = Date.now();
        while(isBreathing && Date.now() - start < dur) {
            await sleep(50); // Sleep in small increments
        }
        if (!isBreathing) break; // Exit loop if stopBreathing was called

        idx = (idx+1) % steps.length;
    }
    // Ensure shapes are reset to initial state if loop breaks
    if (!isBreathing && primary && secondary) {
        primary.style.transition   = 'transform 0.5s ease-out'; // Smooth transition back
        secondary.style.transition = 'transform 0.5s ease-out';
        primary.style.transform   = 'scale(1)';
        secondary.style.transform = 'scale(1)';
    }
}

// === Handlers ===
async function startBreathing() {
    if (isBreathing) return;
    isBreathing = true;
    if(startBtn) startBtn.disabled = true;
    if(stopBtn) stopBtn.disabled  = false;
    if(msg) msg.textContent   = '';
    startTimer();

    // Ensure shapes start at initial scale with a transition for the first step
    if (primary && secondary) {
        primary.style.transition   = 'transform 0.5s ease-out'; // Use a transition duration
        secondary.style.transition = 'transform 0.5s ease-out'; // Use a transition duration
        primary.style.transform = 'scale(1)';
        secondary.style.transform = 'scale(1)';
        // Optional: Wait briefly for the initial scale transition to complete before starting the loop
        // await sleep(500);
    }

    await breatheLoop(); // Start the breathing loop
}

function stopBreathing() {
    if (!isBreathing) return;
    isBreathing = false; // Set the flag to stop the loop
    stopTimer();
    if(msg) msg.textContent = 'Tap Start';
    if(timerDisp) timerDisp.textContent = '00:00';

    // reset shapes smoothly after stopping
    if (primary && secondary) {
        primary.style.transition   = 'transform 0.5s ease-out'; // Smooth transition back
        secondary.style.transition = 'transform 0.5s ease-out';
        primary.style.transform   = 'scale(1)';
        secondary.style.transform = 'scale(1)';
    }

    // reset buttons
    if(startBtn) startBtn.disabled = false;
    if(stopBtn) stopBtn.disabled  = true;
}

// === Init ===
// Add checks for elements before adding event listeners
if(vibeSel) vibeSel.addEventListener('change', e => {
    applyVibe(e.target.value);
    // Stop and restart if breathing to apply new vibe speed/colors
    if (isBreathing) {
        stopBreathing();
        // Optionally restart automatically: startBreathing();
    }
    // Update initial message when vibe changes
    if (msg && vibes && vibeSel && patterns && patternSel && patterns[patternSel.value]) {
        const currentVibeKey = vibeSel.value;
        const currentPatternKey = patternSel.value;
        if (vibes[currentVibeKey] && patterns[currentPatternKey]) {
            msg.textContent = `Ready for ${vibes[currentVibeKey].name || currentVibeKey} ${patterns[currentPatternKey].steps[0]}`;
        }
    }
});

if(patternSel) patternSel.addEventListener('change', e => {
    currentPattern = patterns [e.target.value];
    // Stop and restart if breathing to apply new pattern timing
    if (isBreathing) {
        stopBreathing();
        // Optionally restart automatically: startBreathing();
    }
    // Update initial message when pattern changes
    if (msg && vibes && vibeSel && patterns && patterns[patternSel.value]) {
        const currentVibeKey = vibeSel.value;
        const currentPatternKey = patternSel.value;
        if (vibes[currentVibeKey] && patterns[currentPatternKey]) {
            msg.textContent = `Ready for ${vibes[currentVibeKey].name || currentVibeKey} ${patterns[currentPatternKey].steps[0]}`;
        }
    }
});


if(startBtn) startBtn.addEventListener('click', startBreathing);
if(stopBtn) stopBtn.addEventListener('click',  stopBreathing);

// initialize vibe + button states on load
if(vibeSel) applyVibe(vibeSel.value); // Apply default vibe
if(stopBtn) stopBtn.disabled = true;

// Set initial pattern variable
if(patternSel) currentPattern = patterns[patternSel.value];


// Set initial message on load
if (msg && vibes && vibeSel && patterns && patternSel && patterns[patternSel.value]) {
    const currentVibeKey = vibeSel.value;
    const currentPatternKey = patternSel.value;
    if (vibes[currentVibeKey] && patterns[currentPatternKey]) {
        msg.textContent = `Ready for ${vibes[currentVibeKey].name || currentVibeKey} ${patterns[currentPatternKey].steps[0]}`;
    } else {
        msg.textContent = 'Start Breathing';
    }
} else if (msg) {
    msg.textContent = 'Start Breathing';
}


// Ensure shapes are in initial state on load
if (primary && secondary) {
    primary.style.transform = 'scale(1)';
    secondary.style.transform = 'scale(1)';
}