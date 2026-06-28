const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const listaMessaggi = document.getElementById('lista-messaggi');

// Variabili per la fluidità del grafico
let altezzePrecedenti = [];
let picchiMassimi = []; // Memorizza il valore del picco, il tempo di inizio e l'indice della barra

// Impostazioni di fluidità (Puoi modificarle per calibrare l'effetto)
const VELOCITA_DISCESA = 0.85; // Più è vicino a 1, più la discesa delle barre azzurre è lenta
const TEMPO_MEMORIA_PICCO = 2000; // Tempo in millisecondi (2000ms = 2 secondi) per cui il picco rosso resta visibile

export function ridimensionaCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

export function aggiornaGrafica(datiSfondo, picchi) {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const larghezzaBarra = canvas.width / datiSfondo.length;
    const tempoAttuale = Date.now();

    // Inizializza gli array di memoria se è la prima volta che gira
    if (altezzePrecedenti.length !== datiSfondo.length) {
        altezzePrecedenti = new Float32Array(datiSfondo.length);
        picchiMassimi = Array.from({ length: datiSfondo.length }, () => ({ valore: 0, scadenza: 0 }));
    }

    // Costruisce un Set degli indici dei picchi problematici attivi
    const indiciPicchi = new Set(picchi.map(p => p.indice));
    const ciSonoPicchi = picchi.length > 0;

    // 1. DISEGNA LO SPETTRO DI SFONDO
    for (let i = 0; i < datiSfondo.length; i++) {
        const altezzaTarget = (datiSfondo[i] / 255) * canvas.height;

        // Fase discendente rallentata
        if (altezzaTarget < altezzePrecedenti[i]) {
            altezzePrecedenti[i] = altezzePrecedenti[i] * VELOCITA_DISCESA;
            if (altezzePrecedenti[i] < 1) altezzePrecedenti[i] = 0;
        } else {
            altezzePrecedenti[i] = altezzaTarget;
        }

        // Se ci sono picchi problematici, le barre NON-picco vengono attenuate al 50% di opacità
        // Se non ci sono picchi, tutto lo spettro è mostrato a piena intensità
        if (ciSonoPicchi && !indiciPicchi.has(i)) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.06)'; // Attenuato al 50%
        } else {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.12)'; // Piena intensità
        }

        ctx.fillRect(i * larghezzaBarra, canvas.height - altezzePrecedenti[i], larghezzaBarra - 1, altezzePrecedenti[i]);
    }

    // 2. AGGIORNA LA MEMORIA DEI PICCHI LARSEN/RIMBOMBI
    picchi.forEach(picco => {
        const altezzaPicco = (picco.valore / 255) * canvas.height;

        if (altezzaPicco > picchiMassimi[picco.indice].valore || tempoAttuale > picchiMassimi[picco.indice].scadenza) {
            picchiMassimi[picco.indice].valore = altezzaPicco;
            picchiMassimi[picco.indice].scadenza = tempoAttuale + TEMPO_MEMORIA_PICCO;
        }
    });

    // 3. DISEGNA I PICCHI TRATTENUTI (Rosso acceso con effetto neon)
    for (let i = 0; i < picchiMassimi.length; i++) {
        if (tempoAttuale < picchiMassimi[i].scadenza && picchiMassimi[i].valore > 0) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ef4444';
            ctx.fillStyle = '#f87171'; // Rosso chiaro/neon

            ctx.fillRect(i * larghezzaBarra, canvas.height - picchiMassimi[i].valore, larghezzaBarra - 1, picchiMassimi[i].valore);

            ctx.shadowBlur = 0;
        } else {
            picchiMassimi[i].valore = 0;
        }
    }

    // 4. AGGIORNA I MESSAGGI DI TESTO
    aggiornaTestoMessaggi(picchi);
}

function aggiornaTestoMessaggi(picchi) {
    if (picchi.length === 0) {
        listaMessaggi.innerHTML = '<li style="color: #475569; text-align: center; margin-top: 20px;">Nessuna frequenza fastidiosa rilevata. Tutto nella norma.</li>';
        return;
    }

    listaMessaggi.innerHTML = '';
    picchi.forEach(picco => {
        const li = document.createElement('li');
        li.className = 'msg-alert';
        li.innerHTML = `⚠️ <b>Rilevato rimbombo/Larsen a ${picco.hz} Hz</b><br>Suggerimento: attenua questa frequenza di circa <b>-${picco.dbDaTogliere} dB</b> sul mixer/equalizzatore.`;
        listaMessaggi.appendChild(li);
    });
}
