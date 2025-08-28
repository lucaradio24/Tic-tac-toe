// Creiamo una factory per produrre Gameboard, ma per nascondere le variabili e funzioni
// che non mi servono altrove usiamo le IIFE racchiudendo la factory in una parentesi () e poi chiamando subito la funzione al rigo 36 così ()

const Gameboard = (function() {
 const cells = [                // creiamo un array in cui ci sono le celle                                    
    '', '', '', 
    '', '', '',
    '', '', ''
 ]
 const getBoard = function(){  // questa funzione mi restituisce l'array di celle
    return [...cells]
 };

 const placeMark = function(index, mark){ // index è la posizione delle celle (da 0 a 8) e mark è il simbolo
    if (index < 0 || index > 8) {
        return false
    } else {
        if (cells[index] != '') {
            return 
        } else {
            cells[index] = mark
            return true
        }
    }
 };

 const resetBoard = function(){ 
    for (let i = 0; i < cells.length; i++){   // i è il numero della cella
        cells[i] = '';   // sostituisci il singolo elemento dell'array (quindi [i]) con ''
    }
 }

 return {getBoard, placeMark, resetBoard} // esporta queste funzioni nel global scope 
 
})
();

Gameboard.placeMark(0, "X");
console.log(Gameboard.getBoard());
Gameboard.resetBoard();
console.log(Gameboard.getBoard());