let audioContext;
let analizzatore;
let datiFrequenza;
let storicoFrequenze = [];
const LUNGHEZZA_STORICO = 15;

// Impostazioni configurabili dall'utente
let sogliaMinimaRilevazione = 70;  // modificabile dalle impostazioni
let fftSizeAttuale = 128;           // 64 bande * 2

export async function attivaAudio() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sorgente = audioContext.createMediaStreamSource(stream);

    analizzatore = audioContext.createAnalyser();
    analizzatore.fftSize = fftSizeAttuale;

    sorgente.connect(analizzatore);

    const lunghezzaBuffer = analizzatore.frequencyBinCount;
    datiFrequenza = new Uint8Array(lunghezzaBuffer);
}

// Chiamata dalle impostazioni per cambiare la soglia di sensibilità
export function aggiornaSoglia(nuovaSoglia) {
    sogliaMinimaRilevazione = nuovaSoglia;
}

// Chiamata dalle impostazioni per cambiare il numero di bande
export function aggiornaFftSize(nuovaFftSize) {
    fftSizeAttuale = nuovaFftSize;
    if (analizzatore) {
        analizzatore.fftSize = fftSizeAttuale;
        datiFrequenza = new Uint8Array(analizzatore.frequencyBinCount);
        storicoFrequenze = []; // Resetta lo storico perché è cambiata la dimensione
    }
}

export function analizzaFrequenze(limiteSegnalazioni) {
    if (!analizzatore) return { datiSfondo: [], picchi: [] };

    analizzatore.getByteFrequencyData(datiFrequenza);

    storicoFrequenze.push(new Uint8Array(datiFrequenza));
    if (storicoFrequenze.length > LUNGHEZZA_STORICO) storicoFrequenze.shift();

    // Calcola lo spettro medio di sfondo (la norma)
    let spettroMedio = new Float32Array(datiFrequenza.length);
    for (let i = 0; i < datiFrequenza.length; i++) {
        let somma = 0;
        for (let j = 0; j < storicoFrequenze.length; j++) {
            somma += storicoFrequenze[j][i];
        }
        spettroMedio[i] = somma / storicoFrequenze.length;
    }

    let picchiTrovati = [];
    const frequenzaCampionamento = audioContext.sampleRate;

    for (let i = 4; i < datiFrequenza.length - 4; i++) {
        let valoreAttuale = datiFrequenza[i];
        let valoreMedio = spettroMedio[i];

        if (valoreAttuale > sogliaMinimaRilevazione && valoreAttuale > valoreMedio * 1.4) {
            let hz = Math.round(i * (frequenzaCampionamento / analizzatore.fftSize));
            let differenzaInDB = Math.round((valoreAttuale - valoreMedio) * 0.15);

            if (differenzaInDB > 2) {
                picchiTrovati.push({ indice: i, hz: hz, dbDaTogliere: differenzaInDB, valore: valoreAttuale });
            }
        }
    }

    let picchiSelezionati = picchiTrovati
        .sort((a, b) => b.valore - a.valore)
        .slice(0, limiteSegnalazioni);

    return {
        datiSfondo: datiFrequenza,
        picchi: picchiSelezionati
    };
}
