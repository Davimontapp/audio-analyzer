import { inizializzaPWA, gestisciAggiornamento } from './pwa-manager.js';
import { attivaAudio, analizzaFrequenze, aggiornaSoglia, aggiornaFftSize } from './audio.js';
import { ridimensionaCanvas, aggiornaGrafica } from './ui.js';

let inAscolto = false;
const btnAudio = document.getElementById('btn-audio');

// ── SETTINGS ──
const btnSettings      = document.getElementById('btn-settings');
const settingsPanel    = document.getElementById('settings-panel');
const btnCloseSettings = document.getElementById('btn-close-settings');
const selettoreMaxFreq = document.getElementById('max-freq');
const rangeBande       = document.getElementById('range-bande');
const valBande         = document.getElementById('val-bande');
const rangeSensibilita = document.getElementById('range-sensibilita');
const valSensibilita   = document.getElementById('val-sensibilita');

// Apri/chiudi pannello impostazioni
btnSettings.addEventListener('click', () => {
    settingsPanel.classList.add('open');
    btnSettings.classList.add('active');
});
btnCloseSettings.addEventListener('click', chiudiSettings);
settingsPanel.addEventListener('click', (e) => {
    if (e.target === settingsPanel) chiudiSettings();
});
function chiudiSettings() {
    settingsPanel.classList.remove('open');
    btnSettings.classList.remove('active');
}

// Aggiorna label e notifica audio.js quando cambiano i range
rangeBande.addEventListener('input', () => {
    valBande.textContent = rangeBande.value;
    aggiornaFftSize(parseInt(rangeBande.value) * 2); // fftSize = bande * 2
});
rangeSensibilita.addEventListener('input', () => {
    valSensibilita.textContent = rangeSensibilita.value;
    aggiornaSoglia(parseInt(rangeSensibilita.value));
});

// ── PWA ──
inizializzaPWA();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(reg => {
            gestisciAggiornamento(reg);
            if (navigator.serviceWorker.controller) {
                richiediVersionePWA();
            } else {
                navigator.serviceWorker.addEventListener('controllerchange', richiediVersionePWA);
            }
        })
        .catch(err => console.error("Errore Service Worker:", err));
}

function richiediVersionePWA() {
    if (!navigator.serviceWorker.controller) return;
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
        if (event.data && event.data.version) {
            document.getElementById('app-version').innerText = event.data.version;
        }
    };
    navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
    );
}

// ── RESIZE ──
window.addEventListener('resize', ridimensionaCanvas);
ridimensionaCanvas();

// ── AVVIA MICROFONO ──
btnAudio.addEventListener('click', async () => {
    if (inAscolto) return;
    try {
        btnAudio.innerText = "In ascolto...";
        btnAudio.style.background = "linear-gradient(135deg, #22c55e, #15803d)";
        await attivaAudio();
        inAscolto = true;
        loopApplicazione();
    } catch (error) {
        alert("Impossibile accedere al microfono. Controlla i permessi del browser.");
        btnAudio.innerText = "Avvia Microfono";
        btnAudio.style.background = "linear-gradient(135deg, #0ea5e9, #2563eb)";
        console.error(error);
    }
});

// ── LOOP PRINCIPALE ──
function loopApplicazione() {
    if (!inAscolto) return;
    const limiteSegnalazioni = parseInt(selettoreMaxFreq.value);
    const risultati = analizzaFrequenze(limiteSegnalazioni);
    aggiornaGrafica(risultati.datiSfondo, risultati.picchi);
    requestAnimationFrame(loopApplicazione);
}
