let eventoInstallazione;

export function inizializzaPWA() {
    // 1. Rileva se l'app è installabile e mostra il popup
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        eventoInstallazione = e;
        
        // Se non è già installata, mostra il popup dopo 3 secondi
        if (!window.matchMedia('(display-mode: standalone)').matches) {
            setTimeout(() => {
                const popup = document.getElementById('popup-install');
                if (popup) popup.style.display = 'block';
            }, 3000);
        }
    });

    // Gestione tasto "Installa"
    document.getElementById('btn-install-accetta').addEventListener('click', async () => {
        if (!eventoInstallazione) return;
        eventoInstallazione.prompt();
        const { outcome } = await eventoInstallazione.userChoice;
        console.log(`Risultato installazione: ${outcome}`);
        eventoInstallazione = null;
        nascondiPopup();
    });

    // Gestione tasto "Annulla"
    document.getElementById('btn-install-rifiuta').addEventListener('click', nascondiPopup);
}

function nascondiPopup() {
    const popup = document.getElementById('popup-install');
    if (popup) popup.style.display = 'none';
}

// Gestisce la notifica di aggiornamento del codice
export function gestisciAggiornamento(reg) {
    if (reg.waiting) {
        avvisaNuovaVersione(reg.waiting);
    }

    reg.addEventListener('updatefound', () => {
        const nuovoSW = reg.installing;
        nuovoSW.addEventListener('statechange', () => {
            if (nuovoSW.state === 'installed' && navigator.serviceWorker.controller) {
                avvisaNuovaVersione(nuovoSW);
            }
        });
    });
}

function avvisaNuovaVersione(worker) {
    const conferma = confirm("È disponibile una nuova versione dell'app. Aggiornare ora?");
    if (conferma) {
        worker.postMessage({ type: 'SKIP_WAITING' });
    }
}