let audioContext;
let analizzatore;
let datiFrequenza;
let storicoFrequenze = [];
const LUNGHEZZA_STORICO = 15; // Quanti frame ricordare per fare la media della "norma"

export async function attivaAudio() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    
    // Crea il contesto audio nativo del browser
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sorgente = audioContext.createMediaStreamSource(stream);
    
    analizzatore = audioContext.createAnalyser();
    analizzatore.fftSize = 512; // Risoluzione dello spettro (256 barre)
    
    sorgente.connect(analizzatore);
    
    const lunghezzaBuffer = analizzatore.frequencyBinCount;
    datiFrequenza = new Uint8Array(lunghezzaBuffer);
    
    return { analizzatore, datiFrequenza };
}

export function analizzaFrequenze(limiteSegnalazioni) {
    if (!analizzatore) return { datiSfondo: [], picchi: [] };

    analizzatore.getByteFrequencyData(datiFrequenza);
    
    // Salva nello storico per calcolare la "norma" ambientale
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

    // Trova le frequenze che superano di molto la norma
    for (let i = 4; i < datiFrequenza.length - 4; i++) { // Escludiamo i bassissimi sub-bassi rumorosi
        let valoreAttuale = datiFrequenza[i];
        let valoreMedio = spettroMedio[i];

        // Se la frequenza attuale è sopra una soglia minima e supera la sua media del 40%
        if (valoreAttuale > 70 && valoreAttuale > valoreMedio * 1.4) {
            // Formula per calcolare gli Hz esatti dall'indice della barra
            let hz = Math.round(i * (frequenzaCampionamento / analizzatore.fftSize));
            
            // Calcolo approssimativo della riduzione in Decibel (dB) necessaria
            let differenzaInDB = Math.round((valoreAttuale - valoreMedio) * 0.15);
            
            if (differenzaInDB > 2) {
                picchiTrovati.push({ indice: i, hz: hz, dbDaTogliere: differenzaInDB, valore: valoreAttuale });
            }
        }
    }

    // Ordina i picchi dal più fastidioso al meno fastidioso e taglia al limite scelto dall'utente
    let picchiSelezionati = picchiTrovati
        .sort((a, b) => b.valore - a.valore)
        .slice(0, limiteSegnalazioni);

    return {
        datiSfondo: datiFrequenza,
        picchi: picchiSelezionati
    };
}