// UI
const cells = document.querySelectorAll('.cell')
const status = document.querySelector('.status')
const restartBtn = document.querySelector('#restart')
const modal = document.querySelector('#playerModal')
const form = document.querySelector('#playerForm')
const nameX = document.querySelector('#nameX')
const nameO = document.querySelector('#nameO')

modal.showModal()

function render(){
    let state = GameController.getGameState();
    cells.forEach(function (cell){
        const index = cell.dataset.index;
        cell.textContent = state.board[index];
        
        cell.disabled = state.board[index] !=='' || state.isOver
        })
        
        if(state.isOver && state.lastResult.status === 'win'){
           status.textContent = `Ha vinto ${state.lastResult.winner} -> ${state.current.name}` 
        } else if (state.isOver && state.lastResult.status === 'draw'){
            status.textContent = 'Pareggio'
        } else {
            status.textContent = `Tocca a ${state.current.name} (${state.current.mark}) `
        }
    }

cells.forEach( cell => {     // cells è un array, per ogni elemento (cell) di questo array c'è un event listener
    cell.addEventListener('click', () =>{
        const index = Number(cell.dataset.index);  // quando c'è il click index legge il data-index del bottone
        GameController.makeMove(index); // qui passiamo questo index nella funzione
        render() // disegniamo la griglia
    })
})

restartBtn.addEventListener('click', () => {
    modal.showModal()
    GameController.init(p1, p2);
    render();
})

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameXValue = nameX.value.trim() // per togliere gli spazi iniziali finali
    const nameOValue = nameO.value.trim()
    const p1 = createPlayer(nameXValue || 'Player X', 'X');
    const p2 = createPlayer(nameOValue || 'Player O', 'O');
    GameController.init(p1, p2);
    modal.close();
    render()
})

// GAME LOGIC

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5], // righe orizzontali
  [6, 7, 8],
  [0, 4, 8], // ultima riga e diagonale principale
  [2, 4, 6],
  [0, 3, 6], // diagonale secondaria e prima colonna
  [1, 4, 7],
  [2, 5, 8],
]; // colonne centrale e destra

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
    "", "", "",
    "", "", "",
    "", "", "",
  ];
  const getBoard = function () {
    // questa funzione mi restituisce una copia dell'array di celle
    return [...cells];
  };

  const placeMark = function (index, mark) {
    // index è la posizione delle celle (da 0 a 8) e mark è il simbolo
    if (index < 0 || index > 8) {
      return false;
    } else {
      if (cells[index] != "") {
        return false;
      } else {
        cells[index] = mark;
        return true;
      }
    }
  };

  const resetBoard = function () {
    for (let i = 0; i < cells.length; i++) {
      // i è il numero della cella
      cells[i] = ""; // sostituisci il singolo elemento dell'array (quindi [i]) con ''
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
    modal.showModal()
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
        currentPlayer =
          currentPlayer === playerXRef // cambia il giocatore corrente
            ? playerORef
            : playerXRef; // usa l'operatore ternario per alternare i giocatori
        return { ok: true, result }; // ritorna successo con il risultato
      } else {
        // win/draw              // se c'è stata una vittoria o un pareggio
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



render()
console.log(GameController.getGameState()); // ottiene lo stato iniziale del gioco

// GameController.makeMove(0); // giocatore X mette il simbolo nella cella 0
// GameController.getGameState(); // controlla lo stato dopo la prima mossa
// GameController.makeMove(4); // giocatore O mette il simbolo nella cella 4
// GameController.makeMove(1); // giocatore X mette il simbolo nella cella 1
// GameController.makeMove(8); // giocatore O mette il simbolo nella cella 8
// GameController.makeMove(2); // giocatore X mette il simbolo nella cella 2 (riga vincente!)
// console.log(GameController.getGameState()); // stampa il risultato finale
