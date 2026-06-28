const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const listaMessaggi = document.getElementById('lista-messaggi');

// Variabili per la fluidità del grafico
let altezzePrecedenti = [];
let picchiMassimi = []; // Memorizza il valore del picco, il tempo di inizio e l'indice della barra

// Impostazioni di fluidità (Puoi modificarle per calibrare l'effetto)
const VELOCITA_DISCESA = 0.85; // Più è vicino a 1, più la discesa delle barre azzurre è lenta (es. 0.95 rallenta tantissimo)
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
    
    // 1. DISEGNA LA NORMA (Con fase discendente rallentata)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)'; // Azzurro molto trasparente
    
    for (let i = 0; i < datiSfondo.length; i++) {
        const altezzaTarget = (datiSfondo[i] / 255) * canvas.height;
        
        // Se l'altezza attuale è inferiore a quella precedente, la facciamo scendere lentamente
        if (altezzaTarget < altezzePrecedenti[i]) {
            altezzePrecedenti[i] = altezzePrecedenti[i] * VELOCITA_DISCESA;
            // Evita che rimangano micro-linee infinite sul fondo
            if (altezzePrecedenti[i] < 1) altezzePrecedenti[i] = 0;
        } else {
            // Se sta salendo, sale istantaneamente in tempo reale
            altezzePrecedenti[i] = altezzaTarget;
        }

        ctx.fillRect(i * larghezzaBarra, canvas.height - altezzePrecedenti[i], larghezzaBarra - 1, altezzePrecedenti[i]);
    }
    
    // 2. AGGIORNA LA MEMORIA DEI PICCHI LARSEN/RIMBOMBI
    picchi.forEach(picco => {
        const altezzaPicco = (picco.valore / 255) * canvas.height;
        
        // Se il nuovo picco rilevato è più alto di quello memorizzato, o se quello vecchio è scaduto
        if (altezzaPicco > picchiMassimi[picco.indice].valore || tempoAttuale > picchiMassimi[picco.indice].scadenza) {
            picchiMassimi[picco.indice].valore = altezzaPicco;
            picchiMassimi[picco.indice].scadenza = tempoAttuale + TEMPO_MEMORIA_PICCO;
        }
    });

    // 3. DISEGNA I PICCHI TRATTENUTI (Rosso acceso con effetto neon)
    for (let i = 0; i < picchiMassimi.length; i++) {
        // Disegna il picco rosso solo se non è ancora scaduto il tempo dei 2 secondi
        if (tempoAttuale < picchiMassimi[i].scadenza && picchiMassimi[i].valore > 0) {
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ef4444';
            ctx.fillStyle = '#f87171'; // Rosso chiaro/neon
            
            // Disegnamo una barra intera o una "linea di picco" in cima
            // Per enfatizzarla meglio, disegnamo tutta la colonna fino a quell'altezza
            ctx.fillRect(i * larghezzaBarra, canvas.height - picchiMassimi[i].valore, larghezzaBarra - 1, picchiMassimi[i].valore);
            
            ctx.shadowBlur = 0; // Resetta l'effetto
        } else {
            // Se è scaduto, azzera il valore per i calcoli futuri
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
