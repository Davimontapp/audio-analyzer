import { inizializzaPWA, gestisciAggiornamento } from './pwa-manager.js';
import { attivaAudio, analizzaFrequenze } from './audio.js';
import { ridimensionaCanvas, aggiornaGrafica } from './ui.js';

let inAscolto = false;
const btnAudio = document.getElementById('btn-audio');
const selettoreMaxFreq = document.getElementById('max-freq');

// Inizializza le funzioni PWA (Installazione)
inizializzaPWA();

// Registra il Service Worker per l'uso offline e aggiornamenti
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(reg => {
            gestisciAggiornamento(reg);
            
            // Richiedi la versione al Service Worker quando è attivo
            if (navigator.serviceWorker.controller) {
                richiediVersionePWA();
            } else {
                // Se è la primissima installazione, attendi che prenda il controllo
                navigator.serviceWorker.addEventListener('controllerchange', richiediVersionePWA);
            }
        })
        .catch(err => console.error("Errore Service Worker:", err));
}

// Funzione per chiedere la versione al Service Worker e scriverla nell'HTML
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

// Gestione ridimensionamento dello schermo del telefono
window.addEventListener('resize', ridimensionaCanvas);
ridimensionaCanvas();

// Gestione del click sul pulsante principale
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

function loopApplicazione() {
    if (!inAscolto) return;
    
    const limiteSegnalazioni = parseInt(selettoreMaxFreq.value);
    const risultati = analizzaFrequenze(limiteSegnalazioni);
    aggiornaGrafica(risultati.datiSfondo, risultati.picchi);
    
    requestAnimationFrame(loopApplicazione);
}import { inizializzaPWA, gestisciAggiornamento } from './pwa-manager.js';
import { attivaAudio, analizzaFrequenze } from './audio.js';
import { ridimensionaCanvas, aggiornaGrafica } from './ui.js';

let inAscolto = false;
const btnAudio = document.getElementById('btn-audio');
const selettoreMaxFreq = document.getElementById('max-freq');

// Inizializza le funzioni PWA (Installazione)
inizializzaPWA();

// Registra il Service Worker per l'uso offline e aggiornamenti
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(reg => gestisciAggiornamento(reg))
        .catch(err => console.error("Errore Service Worker:", err));

    // Ricarica la pagina se il codice è stato aggiornato ed è pronto
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}

// Gestione ridimensionamento dello schermo del telefono
window.addEventListener('resize', ridimensionaCanvas);
ridimensionaCanvas();

// Gestione del click sul pulsante principale
btnAudio.addEventListener('click', async () => {
    if (inAscolto) return; // Evita doppi click
    
    try {
        btnAudio.innerText = "In ascolto...";
        btnAudio.style.background = "linear-gradient(135deg, #22c55e, #15803d)"; // Verde
        
        await attivaAudio();
        inAscolto = true;
        
        // Avvia il ciclo continuo di analisi
        loopApplicazione();
        
    } catch (error) {
        alert("Impossibile accedere al microfono. Controlla i permessi del browser.");
        btnAudio.innerText = "Avvia Microfono";
        btnAudio.style.background = "linear-gradient(135deg, #0ea5e9, #2563eb)";
        console.error(error);
    }
});

// Il ciclo continuo (gira a 60 frame al secondo)
function loopApplicazione() {
    if (!inAscolto) return;
    
    // Leggi quante frequenze l'utente vuole visualizzare dal menu a tendina
    const limiteSegnalazioni = parseInt(selettoreMaxFreq.value);
    
    // Elabora i dati audio con l'algoritmo
    const risultati = analizzaFrequenze(limiteSegnalazioni);
    
    // Disegna i risultati sullo schermo
    aggiornaGrafica(risultati.datiSfondo, risultati.picchi);
    
    // Richiedi il frame successivo
    requestAnimationFrame(loopApplicazione);
}
