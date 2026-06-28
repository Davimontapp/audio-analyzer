const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const listaMessaggi = document.getElementById('lista-messaggi');

// Adatta la risoluzione del canvas alla dimensione dello schermo
export function ridimensionaCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

export function aggiornaGrafica(datiSfondo, picchi) {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const larghezzaBarra = canvas.width / datiSfondo.length;
    
    // 1. DISEGNA LA NORMA (Attenuata e semi-trasparente)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.60)'; // Azzurro molto trasparente
    for (let i = 0; i < datiSfondo.length; i++) {
        // Calcola l'altezza in base al volume
        const altezzaBarra = (datiSfondo[i] / 255) * canvas.height;
        ctx.fillRect(i * larghezzaBarra, canvas.height - altezzaBarra, larghezzaBarra - 1, altezzaBarra);
    }
    
    // 2. ENFATIZZA I PICCHI FASTIDIOSI (Rosso acceso con effetto neon)
    picchi.forEach(picco => {
        const altezzaBarra = (picco.valore / 255) * canvas.height;
        
        // Effetto sfocatura/bagliore
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ef4444';
        ctx.fillStyle = '#f87171'; // Rosso chiaro/neon
        
        ctx.fillRect(picco.indice * larghezzaBarra, canvas.height - altezzaBarra, larghezzaBarra - 1, altezzaBarra);
        
        // Resetta l'effetto ombra per non rallentare il disegno successivo
        ctx.shadowBlur = 0;
    });

    // 3. AGGIORNA I MESSAGGI DI TESTO
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
