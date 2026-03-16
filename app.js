/**
 * ======================================================================
 * 🧠 FIDDLE CORE ENGINE - v2.0 (Professionnel)
 * ======================================================================
 * Gère la configuration, la synchronisation Brevo et l'affichage dynamique.
 */

const CONFIG_CLIENTS = {
    // CONFIGURATION VILLA SAINT ANTOINE
    "villa_saint_antoine": {
        nom: "Villa Saint Antoine",
        couleur: "#c5a059", // Or élégant
        seuilPoints: 10,
        recompense: "10 points = 1 Cocktail Signature 🍸",
        formInscription: "https://9d65705b.sibforms.com/serve/MUIFAPNZrGyP3i0xNF-FdppNziEkhvnAiLtRY8uUfol3hxIyq6VHE11ofNd5fjQp_Iq7tjv6nklXAhjOPj_Le1u6Wxz_U2NCQLtoBMgkuGrjRNvCwMzFg7KcWEyXIcW-JPoDtL2QizWiwcOJl5-G96lbhakbnyeJT1cxI_8ZV4SVOfBt8CDOHTGIi-KdJSAAPTHMADTN5Gyt8PgqdA=="
    },

    // CONFIGURATION BISTROT
    "bistrot": {
        nom: "Le Bistrot Paris",
        couleur: "#e63946", // Rouge moderne
        seuilPoints: 5,
        recompense: "5 points = 1 Dessert au choix offert 🍰",
        formInscription: "https://9d65705b.sibforms.com/serve/MUIFANfE1Ud8qt..."
    }
};

// TES LIENS GOOGLE SCRIPTS (Intégrés une fois pour toutes)
const API_POINTS = "https://script.google.com/macros/s/AKfycbxeUjqD3jLYvVgO4OxKraB_hX6fMcmzMrdYT75bkSAUDbBG6Ols852ea_iUiTiJn8HdOA/exec";
const API_VALIDATION = "https://script.google.com/macros/s/AKfycbxEynrpjUiRF8Yc9h3MVH8NFtlCPbs_gSlfKxA9b8EjdwBOStPaxkrvZRJ3vjmFZkDZ-w/exec";

const App = {
    // Récupère les infos de l'URL
    getParams: function() {
        const urlParams = new URLSearchParams(window.location.search);
        let restoID = urlParams.get('resto') || "bistrot"; 
        return {
            restoID: restoID,
            data: CONFIG_CLIENTS[restoID] || CONFIG_CLIENTS["bistrot"],
            email: urlParams.get('email'),
            prenom: urlParams.get('prenom')
        };
    },

    // Applique le look & feel
    appliquerDesign: function() {
        const p = this.getParams();
        document.documentElement.style.setProperty('--primary', p.data.couleur);
        document.title = `${p.data.nom} - Fidélité`;
        document.querySelectorAll('.nom-resto').forEach(el => el.innerText = p.data.nom);
    },

    /**
     * LOGIQUE DE LA CARTE (Côté Client)
     */
    initCarte: function() {
        this.appliquerDesign();
        const p = this.getParams();

        if (!p.email) {
            document.body.innerHTML = "<div style='color:white;text-align:center;margin-top:50px;'>Lien invalide.</div>";
            return;
        }

        if (p.prenom) document.getElementById('user-prenom').innerText = p.prenom;

        // QR Code
        new QRCode(document.getElementById("qrcode"), { 
            text: p.email, 
            width: 140, height: 140, 
            colorDark: "#000000", colorLight: "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        // Appel API Points
        fetch(`${API_POINTS}?email=${encodeURIComponent(p.email)}&resto=${p.restoID}&v=${Date.now()}`)
            .then(r => r.json())
            .then(res => {
                const pts = parseInt(res.points) || 0;
                document.getElementById('user-points').innerText = pts;
                
                // Barre de progression
                const pourcentage = Math.min((pts / p.data.seuilPoints) * 100, 100);
                document.getElementById('barre').style.width = pourcentage + "%";
                
                // Texte dynamique
                const info = document.getElementById('phrase-info');
                if (pts >= p.data.seuilPoints) {
                    info.innerHTML = "🎉 <span style='color:var(--primary)'>Cadeau prêt à être utilisé !</span>";
                } else {
                    info.innerHTML = `Plus que <strong>${p.data.seuilPoints - pts} points</strong> avant votre cadeau.`;
                }
            })
            .catch(err => console.error("Erreur points:", err));
    },

    /**
     * LOGIQUE DU SCANNER (Côté Serveur)
     */
    initScanner: function() {
        this.appliquerDesign();
        const p = this.getParams();
        const scannerView = document.getElementById("scanner-view");
        const loaderView = document.getElementById("loader-view");
        const resultView = document.getElementById("result-view");

        // Initialisation du scanner
        let html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 15, qrbox: { width: 250, height: 250 } };

        const startScanner = () => {
            html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
                // 1. On stoppe et on affiche le chargement
                html5QrCode.stop();
                scannerView.style.display = "none";
                loaderView.style.display = "flex";

                // 2. Envoi à l'API de validation
                fetch(`${API_VALIDATION}?email=${encodeURIComponent(decodedText.trim())}&resto=${p.restoID}`)
                    .then(r => r.json())
                    .then(res => {
                        loaderView.style.display = "none";
                        resultView.style.display = "flex";
                        
                        if (res.success) {
                            document.body.style.backgroundColor = "#10b981";
                            document.getElementById("res-icon").innerText = "✅";
                            document.getElementById("res-text").innerHTML = `POINT AJOUTÉ !<br><small>Nouveau total : ${res.nouveauScore}</small>`;
                            // Reload automatique après 3s pour scanner le client suivant
                            setTimeout(() => window.location.reload(), 3000);
                        } else {
                            throw new Error();
                        }
                    })
                    .catch(() => {
                        document.body.style.backgroundColor = "#ef4444";
                        document.getElementById("res-icon").innerText = "❌";
                        document.getElementById("res-text").innerText = "Erreur : Client inconnu";
                        document.getElementById("btn-retry").style.display = "block";
                    });
            });
        };

        startScanner();
    }
};
