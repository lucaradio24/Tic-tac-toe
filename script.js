// UI
const cells = document.querySelectorAll(".cell"); // seleziona tutti i bottoni delle celle
const status = document.querySelector(".status"); // seleziona l'elemento per mostrare lo stato del gioco
const restartBtn = document.querySelector("#restart"); // seleziona il bottone restart
const modal = document.querySelector("#playerModal"); // seleziona la modale per inserire i nomi
const form = document.querySelector("#playerForm"); // seleziona il form dentro la modale
const nameX = document.querySelector("#nameX"); // input per il nome del giocatore X
const nameO = document.querySelector("#nameO"); // input per il nome del giocatore O

modal.showModal(); // apre la modale all'avvio della pagina

function render() {
  // aggiorna l'interfaccia grafica
  let state = GameController.getGameState(); // prende lo stato attuale del gioco
  cells.forEach(function (cell) {
    // per ogni cella della griglia
    const index = cell.dataset.index; // prende l'indice della cella
    cell.textContent = state.board[index]; // mostra il simbolo (X, O o vuoto)

    cell.disabled = state.board[index] !== "" || state.isOver; // disabilita se occupata o gioco finito
  });

  if (state.isOver && state.lastResult.status === "win") {
    // se il gioco è finito con vittoria
    status.textContent = `Ha vinto ${state.lastResult.winner} -> ${state.current.name}`; // mostra chi ha vinto
  } else if (state.isOver && state.lastResult.status === "draw") {
    // se il gioco è finito in pareggio
    status.textContent = "Pareggio"; // mostra pareggio
  } else {
    // se il gioco è ancora in corso
    status.textContent = `Tocca a ${state.current.name} (${state.current.mark}) `; // mostra di chi è il turno
  }
}

cells.forEach((cell) => {
  // cells è un array, per ogni elemento (cell) di questo array c'è un event listener
  cell.addEventListener("click", () => {
    const index = Number(cell.dataset.index); // quando c'è il click index legge il data-index del bottone
    GameController.makeMove(index); // qui passiamo questo index nella funzione
    render(); // disegniamo la griglia
  });
});

restartBtn.addEventListener("click", () => {
  // quando si clicca il bottone restart
  modal.showModal(); // riapre la modale per inserire i nomi
  GameController.init(p1, p2); // reinizializza il gioco
  render(); // ridisegna l'interfaccia
});

form.addEventListener("submit", (e) => {
  // quando si invia il form dei nomi
  e.preventDefault(); // impedisce il reload della pagina
  const nameXValue = nameX.value.trim(); // prende il nome di X e rimuove spazi
  const nameOValue = nameO.value.trim(); // prende il nome di O e rimuove spazi
  const p1 = createPlayer(nameXValue || "Player X", "X"); // crea giocatore X con nome o default
  const p2 = createPlayer(nameOValue || "Player O", "O"); // crea giocatore O con nome o default
  GameController.init(p1, p2); // inizializza il gioco con i giocatori creati
  modal.close(); // chiude la modale
  render(); // ridisegna l'interfaccia
});

// GAME LOGIC

const WIN_LINES = [
  // tutte le possibili linee vincenti
  [0, 1, 2], // riga superiore
  [3, 4, 5], // riga centrale
  [6, 7, 8], // riga inferiore
  [0, 4, 8], // diagonale principale
  [2, 4, 6], // diagonale secondaria
  [0, 3, 6], // prima colonna
  [1, 4, 7], // seconda colonna
  [2, 5, 8], // terza colonna
];

function getResult(board) {
  // controlla se il gioco è finito
  for (let line of WIN_LINES) {
    // cicla attraverso ogni linea vincente
    const [a, b, c] = line; // prende gli indici delle tre celle della linea
    if (board[a] != "") {
      // se la prima cella non è vuota
      if (board[a] === board[b] && board[a] === board[c]) {
        // se tutte e tre le celle hanno lo stesso simbolo
        return { status: "win", winner: board[a], line }; // ritorna vittoria con il simbolo vincente
      }
    }
  }
  if (board.includes("")) {
    // se ci sono ancora celle vuote
    return { status: "ongoing", winner: null, line: null }; // il gioco continua
  } else {
    return { status: "draw", winner: null, line: null }; // nessuna cella vuota e nessuna vittoria = pareggio
  }
}

// Creiamo una factory per produrre Gameboard, ma per nascondere le variabili e funzioni
// che non mi servono altrove usiamo le IIFE racchiudendo la factory in una parentesi () e poi chiamando subito la funzione al rigo 36 così ()
const Gameboard = (function () {
  const cells = [
    // creiamo un array in cui ci sono le celle
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];
  const getBoard = function () {
    // questa funzione mi restituisce una copia dell'array di celle
    return [...cells];
  };

  const placeMark = function (index, mark) {
    // piazza un simbolo nella cella specificata
    if (index < 0 || index > 8) {
      // controlla se l'indice è valido
      return false; // indice non valido
    } else {
      if (cells[index] != "") {
        // se la cella è già occupata
        return false; // mossa non valida
      } else {
        cells[index] = mark; // piazza il simbolo nella cella
        return true; // mossa riuscita
      }
    }
  };

  const resetBoard = function () {
    // pulisce tutte le celle della board
    for (let i = 0; i < cells.length; i++) {
      // cicla attraverso tutte le celle
      cells[i] = ""; // imposta ogni cella come vuota
    }
  };

  return { getBoard, placeMark, resetBoard }; // esporta queste funzioni tramite l'oggetto restituito dall'IIFE, rendendole disponibili all'esterno
})();

const GameController = (function () {
  let isOver = false; // flag che indica se il gioco è finito
  let lastResult; // memorizza l'ultimo risultato del gioco
  let currentPlayer; // il giocatore che deve fare la prossima mossa
  let movesCount = 0; // contatore delle mosse fatte
  let playerXRef; // riferimento al giocatore X
  let playerORef; // riferimento al giocatore O

  const init = function (pX, pO) {
    // inizializza il gioco con i due giocatori
    isOver = false; // il gioco non è ancora finito
    playerXRef = pX; // memorizza il giocatore X
    playerORef = pO; // memorizza il giocatore O
    currentPlayer = pX; // inizia sempre il giocatore X
    movesCount = 0; // azzera il contatore delle mosse
    Gameboard.resetBoard(); // pulisce la board
    modal.showModal(); // mostra la modale per inserire i nomi
  };

  const getCurrentPlayer = function () {
    // ritorna il giocatore che deve fare la prossima mossa
    return currentPlayer;
  };

  const makeMove = function (index) {
    // gestisce una mossa del giocatore
    if (isOver === true) return { ok: false, result: lastResult }; // se il gioco è finito, rifiuta la mossa

    const mark = currentPlayer.mark; // prende il simbolo del giocatore corrente (X o O)
    const ok = Gameboard.placeMark(index, mark); // prova a piazzare il simbolo nella cella
    if (ok === true) {
      // se la mossa è valida (cella libera)
      movesCount++; // incrementa il contatore delle mosse
      const board = Gameboard.getBoard(); // prende lo stato aggiornato della board
      const result = getResult(board); // controlla se il gioco è finito

      if (result.status === "ongoing") {
        // se il gioco continua
        currentPlayer = // cambia il giocatore corrente
          currentPlayer === playerXRef // usa l'operatore ternario per alternare i giocatori
            ? playerORef
            : playerXRef;
        return { ok: true, result }; // ritorna successo con il risultato
      } else {
        // se c'è stata una vittoria o un pareggio
        lastResult = result; // memorizza il risultato finale
        isOver = true; // imposta il flag di gioco finito
        return { ok: true, result }; // ritorna successo con il risultato finale
      }
    } else {
      // se la mossa non è valida
      return {
        ok: false,
        result: { status: "ongoing", winner: null, line: null },
      }; // ritorna errore
    }
  };

  const getGameState = function () {
    // ritorna lo stato completo del gioco
    const board = Gameboard.getBoard(); // prende l'array delle celle
    const current = getCurrentPlayer(); // prende il giocatore corrente
    return { board, current, movesCount, lastResult, isOver }; // ritorna un oggetto con tutte le informazioni
  };

  return { getCurrentPlayer, makeMove, init, getGameState }; // esporta le funzioni pubbliche del modulo
})();

function createPlayer(name, mark) {
  // factory per creare oggetti giocatore
  return { name, mark }; // ritorna un oggetto con nome e simbolo
}

GameController.init(p1, p2); // inizializza il gioco con i due giocatori

render();
console.log(GameController.getGameState()); // ottiene lo stato iniziale del gioco

// GameController.makeMove(0); // giocatore X mette il simbolo nella cella 0
// GameController.getGameState(); // controlla lo stato dopo la prima mossa
// GameController.makeMove(4); // giocatore O mette il simbolo nella cella 4
// GameController.makeMove(1); // giocatore X mette il simbolo nella cella 1
// GameController.makeMove(8); // giocatore O mette il simbolo nella cella 8
// GameController.makeMove(2); // giocatore X mette il simbolo nella cella 2 (riga vincente!)
// console.log(GameController.getGameState()); // stampa il risultato finale
