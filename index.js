const TelegramBot = require("node-telegram-bot-api").default;
const cron = require("node-cron");
const fs = require("fs");

const TOKEN = "8558074489:AAF-trowEuAAat4ifYPFm_b9bVjKA5kkhW0";
const chatId = -1003980529867;

const bot = new TelegramBot(TOKEN, {
    polling: false
});

const FILE_STATO = "./stato.json";
const FILE_MEMBRI = "./membri.json";
const FILE_STATISTICHE = "./statistiche.json";

let berealAttivo = false;
let tempoInizio = null;
let hannoRisposto = [];


// ======================
// FILE
// ======================

function leggiFile(file) {

    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "{}");
    }

    return JSON.parse(
        fs.readFileSync(file)
    );

}


function salvaFile(file, dati) {

    fs.writeFileSync(
        file,
        JSON.stringify(dati, null, 2)
    );

}


function oggi() {

    return new Date()
        .toISOString()
        .split("T")[0];

}



// ======================
// INVIO BEREAL
// ======================

function mandaFoto(forzata = false, terminale = false) {

    let stato = leggiFile(FILE_STATO);

    // Controllo normale: viene bypassato dal terminale
    if (!forzata && !terminale && stato.ultimoInvio === oggi()) {

        console.log("Notifica già inviata oggi");
        return;

    }

    bot.sendMessage(
        chatId,
        "🚨 BEREAL ALERT 🚨\n\n📸 È ora della foto!\nAvete 2 minuti."
    );

    berealAttivo = true;
    tempoInizio = Date.now();
    hannoRisposto = [];

    // Solo gli invii automatici aggiornano lo stato giornaliero
    if (!terminale) {

        stato.ultimoInvio = oggi();
        stato.orarioScelto = null;

        salvaFile(
            FILE_STATO,
            stato
        );

    }

    setTimeout(() => {

        fineBeReal();

    }, 120000);

}
// ======================
// FINE BEREAL
// ======================

function fineBeReal() {


    if (!berealAttivo)
        return;



    berealAttivo = false;



    let membri = leggiFile(FILE_MEMBRI);



    let testo =
    "📊 RISULTATO BEREAL\n\n";



    testo += "✅ Hanno risposto:\n";



    if (hannoRisposto.length === 0) {

        testo += "Nessuno 😢\n";

    } else {

        hannoRisposto.forEach(nome => {

            testo += `- ${nome}\n`;

        });

    }



    testo += "\n❌ Non hanno risposto:\n";



    Object.values(membri).forEach(nome => {


        if (!hannoRisposto.includes(nome)) {

            testo += `- ${nome}\n`;

        }

    });



    bot.sendMessage(
        chatId,
        testo
    );


}



// ======================
// FOTO
// ======================

bot.on("photo", (msg) => {


    if (!berealAttivo)
        return;



    const id = msg.from.id;
    const nome = msg.from.first_name;



    if (hannoRisposto.includes(nome))
        return;



    hannoRisposto.push(nome);



    let statistiche = leggiFile(FILE_STATISTICHE);



    if (!statistiche[id]) {

        statistiche[id] = {

            nome: nome,
            inviate: 0,
            puntuali: 0

        };

    }



    statistiche[id].inviate++;



    if (Date.now() - tempoInizio <= 120000) {

        statistiche[id].puntuali++;

    }



    salvaFile(
        FILE_STATISTICHE,
        statistiche
    );


});




// ======================
// REGISTRAZIONE
// ======================

bot.onText(/\/registra/, (msg)=>{


    const id = msg.from.id;
    const nome = msg.from.first_name;



    let membri = leggiFile(FILE_MEMBRI);



    if (!membri[id]) {

        membri[id] = nome;

        salvaFile(
            FILE_MEMBRI,
            membri
        );

    }



    let statistiche = leggiFile(FILE_STATISTICHE);



    if (!statistiche[id]) {

        statistiche[id] = {

            nome: nome,
            inviate: 0,
            puntuali: 0

        };


        salvaFile(
            FILE_STATISTICHE,
            statistiche
        );

    }



    bot.sendMessage(
        msg.chat.id,
        `✅ ${nome} registrato al BeReal`
    );


});




// ======================
// FORZA BEREAL
// ======================

bot.onText(/\/forzabereal/, (msg) => {


    if (msg.chat.id !== chatId) {
        return;
    }



    let stato = leggiFile(FILE_STATO);



    if (stato.forzatoOggi === oggi()) {


        bot.sendMessage(
            msg.chat.id,
            "⚠️ BeReal già forzato oggi"
        );


        return;

    }



    stato.forzatoOggi = oggi();



    salvaFile(
        FILE_STATO,
        stato
    );



    mandaFoto(true);



    bot.sendMessage(
        msg.chat.id,
        "⚡ BeReal forzato manualmente"
    );


});
// ======================
// CLASSIFICA
// ======================

bot.onText(/\/classifica/, (msg)=>{


    let statistiche = leggiFile(FILE_STATISTICHE);



    let lista = Object.values(statistiche);



    lista.sort(
        (a,b)=> b.puntuali - a.puntuali
    );



    let testo =
    "🏆 CLASSIFICA BEREAL\n\n";



    lista.forEach((utente,i)=>{


        let percentuale = 0;



        if (utente.inviate > 0) {

            percentuale = Math.round(
                (utente.puntuali / utente.inviate) * 100
            );

        }



        testo +=
        `${i+1}) ${utente.nome}\n` +
        `📸 Foto: ${utente.inviate}\n` +
        `⏱️ In tempo: ${utente.puntuali}\n` +
        `📊 ${percentuale}%\n\n`;


    });



    bot.sendMessage(
        msg.chat.id,
        testo
    );


});




// ======================
// ORARIO CASUALE
// ======================

function scegliOrario() {


    return {

        ora: Math.floor(Math.random()*9)+9,

        minuti: Math.floor(Math.random()*60)

    };


}




function programmaNotifica() {


    let stato = leggiFile(FILE_STATO);



    if (stato.ultimoInvio === oggi()) {

        console.log("Notifica già inviata oggi");
        return;

    }



    if (!stato.orarioScelto) {


        stato.orarioScelto = scegliOrario();



        salvaFile(
            FILE_STATO,
            stato
        );

    }



    const o = stato.orarioScelto;



    const adesso = new Date();



    const minutiAttuali =
    adesso.getHours()*60 +
    adesso.getMinutes();



    const minutiTarget =
    o.ora*60 +
    o.minuti;



    if (minutiAttuali >= minutiTarget) {


        console.log(
            "Orario passato, invio recuperato"
        );


        mandaFoto();


        return;

    }



    cron.schedule(

        `${o.minuti} ${o.ora} * * *`,

        mandaFoto

    );



    console.log(
        `Notifica prevista alle ${o.ora}:${String(o.minuti).padStart(2,"0")}`
    );


}





// ======================
// AVVIO
// ======================

console.log(
    "Bot avviato. Attendo connessione Telegram..."
);



// ======================
// INVIO DA TERMINALE
// ======================
// Bypassa il limite giornaliero
// ma mantiene timer e resoconto

if (process.argv.includes("--send")) {


    bot.startPolling();



    setTimeout(() => {


        mandaFoto(true, true);



        let stato = leggiFile(FILE_STATO);



        stato.ultimoInvioManuale = oggi();



        salvaFile(
            FILE_STATO,
            stato
        );



        console.log(
            "⚡ BeReal inviato manualmente da terminale"
        );


    }, 2000);



    return;

}





setTimeout(()=>{


    bot.startPolling();



    console.log(
        "Polling Telegram avviato."
    );



    programmaNotifica();



},60000);