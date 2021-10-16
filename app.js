document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('.grid')
  const container = document.querySelector('.container')
  const flagsLeft = document.querySelector('#flags-left')
  const result = document.querySelector('#result')

  const ua = navigator.userAgent.toLowerCase();
  const isSP = /iphone|ipod|ipad|android/.test(ua);
  const eventStart = isSP ? 'touchstart' : 'mousedown';
  const eventEnd = isSP ? 'touchend' : 'mouseup';
  const eventLeave = isSP ? 'touchmove' : 'mouseleave';

  // Sounds
  const gameClearSound = new Audio('sounds/game_clear.mp3');
  const gameOverSound = new Audio('sounds/game_over.mp3');

  ////
  // board_width, board_height, panda are defined in panda.js
  ////
  let width = board_width;
  let height = board_height;
  let board_size = board_width * board_height;
  let panda_array = panda;
  let panda_pts = panda_points;

  let bombAmount = 147
  let flags = 0
  let squares = []
  let isGameOver = false

  let count = 0;
  let timer;
  
  let elapsedTime=0;
  function elapsedTime_countup(){
    document.getElementById("elapsedTime").innerHTML = elapsedTime.toFixed(1) + "秒";
    elapsedTime += 0.1;
  }
  var elapsedTime_timer;

  //create Board
  function createBoard() {
    flagsLeft.innerHTML = bombAmount

    //get shuffled game array with random bombs
    const bombsArray = Array(bombAmount).fill('bomb')
    // const emptyArray = Array(width*width - bombAmount).fill('valid')
    const emptyArray = Array(board_size - bombAmount - panda_pts).fill('valid')
    const gameArray = emptyArray.concat(bombsArray)
    const semi_shuffledArray = gameArray.sort(() => Math.random() - 0.5)

    const shuffledArray = Array(board_size - panda_pts).fill('valid');
    let j = 0;
    for (let i = 0; i < board_size; i++){
      if (panda_array[i] == 0) {
        shuffledArray[i] = semi_shuffledArray[j];
        j++;
      }
    }
    
    // let is_touch = 0;
    // for(let i = 0; i < width*width; i++) {

    for(let i = 0; i < board_size; i++) {
      const square = document.createElement('div')
      square.setAttribute('id', i)
      square.classList.add(shuffledArray[i])


      if (panda_array[i] == 1) {
        square.classList.add('panda')
      }
      grid.appendChild(square)
      squares.push(square)

      let clickCount = 0;
      square.addEventListener("click", function (e) {
        e.preventDefault();
        
        let timer
        if (!clickCount) {
          ++clickCount;

          if (!square.classList.contains('flag' || 'checked')) {
            timer = setTimeout(function () {
                // single click
                click(square)
                clickCount = 0;
            }, 200);
          }

        } else {
          // double click (click interval is 200ms or less)
          clearTimeout(timer)
          addFlag(square)
          clickCount = 0;
        }
      },  { passive: false }
      );

      // ctrl and left click
      square.oncontextmenu = function(e) {
        e.preventDefault()
        addFlag(square)
      }
    }

    // TODO (marich1224): extend codes to non-square (rectangle) game board

    //add numbers
    for (let i = 0; i < squares.length; i++) {
      let total = 0
      const isLeftEdge = (i % width === 0)
      const isRightEdge = (i % width === width -1)
      const isUpperEdge = (i < width)
      const isLowerEdge = (i >= squares.length - width)

      if (squares[i].classList.contains('valid')) {
        if (!isUpperEdge && !isLeftEdge && squares[i - 1 - width].classList.contains('bomb')) total++
        if (!isUpperEdge && squares[i - width].classList.contains('bomb')) total++
        if (!isUpperEdge && !isRightEdge && squares[i + 1 - width].classList.contains('bomb')) total++

        if (!isLeftEdge && squares[i - 1].classList.contains('bomb')) total++
        if (!isRightEdge && squares[i + 1].classList.contains('bomb')) total++

        if (!isLowerEdge && !isLeftEdge && squares[i - 1 + width].classList.contains('bomb')) total++
        if (!isLowerEdge && squares[i + width].classList.contains('bomb')) total++
        if (!isLowerEdge && !isRightEdge && squares[i + 1 + width].classList.contains('bomb')) total++
        squares[i].setAttribute('data', total)
      }
    }
  }
  createBoard()

  //add Flag with right click
  function addFlag(square) {
    // const valid = document.querySelector('.valid')
    block_height = 40 - 15;
    block_width = 40 - 15;
    if (isGameOver) return
    if (!square.classList.contains('checked') && !square.classList.contains('panda') && (flags < bombAmount)) {
      if (!square.classList.contains('flag')) {
        square.classList.add('flag')
        // square.innerHTML = ' 🚩'
        // alert(`${valid.style.height}`)

        square.innerHTML = `<img src="figs/yellowflag.png" width=100% height=100%>`

        flags ++
        flagsLeft.innerHTML = bombAmount - flags
        checkForWin()
      } else {
        square.classList.remove('flag')
        square.innerHTML = ''
        flags --
        flagsLeft.innerHTML = bombAmount - flags
      }
    }
  }

  //click on square actions
  function click(square) {
    let currentId = square.id
    if (isGameOver) return
    if (!square.classList.contains('panda')) {
      if (square.classList.contains('checked') || square.classList.contains('flag')) return
      if (square.classList.contains('bomb')) {
        gameOver(square)
      } else {
        if (elapsedTime == 0)
        {
          elapsedTime_countup();
          elapsedTime_timer = setInterval(elapsedTime_countup, 100);
        }
        let total = square.getAttribute('data')
        if (total != 0) {
          square.classList.add('checked')
          if (total == 1) square.classList.add('one')
          if (total == 2) square.classList.add('two')
          if (total == 3) square.classList.add('three')
          if (total == 4) square.classList.add('four')
          square.innerHTML = total
          return
        }
        checkSquare(square, currentId)
      }
      square.classList.add('checked')
    }
    return
  }


  // TODO (marich1224): extend codes to non-square (rectangle) game board

  //check neighboring squares once square is clicked
  function checkSquare(square, currentId) {
    const isLeftEdge = (currentId % width === 0)
    const isRightEdge = (currentId % width === width -1)
    const isUpperEdge = (currentId < width)
    const isLowerEdge = (currentId >= squares.length - width)

    setTimeout(() => {
      if (!isUpperEdge && !isLeftEdge) {
        const newId = squares[parseInt(currentId) -width -1].id
        const newSquare = document.getElementById(newId)
        click(newSquare)
      }
      if (!isUpperEdge) {
        const newId = squares[parseInt(currentId -width)].id
        const newSquare = document.getElementById(newId)
        click(newSquare)
      }
      if (!isUpperEdge && !isRightEdge) {
        const newId = squares[parseInt(currentId -width +1)].id
        const newSquare = document.getElementById(newId)
        click(newSquare)
      }
      if (!isLeftEdge) {
        const newId = squares[parseInt(currentId) -1].id
        const newSquare = document.getElementById(newId)
        click(newSquare)
      }
      if (!isRightEdge) {
        const newId = squares[parseInt(currentId) +1].id
        const newSquare = document.getElementById(newId)
        click(newSquare)
      }
      if (!isLowerEdge && !isLeftEdge) {
        const newId = squares[parseInt(currentId) +width -1].id
        const newSquare = document.getElementById(newId)
        click(newSquare)
      }
      if (!isLowerEdge) {
        const newId = squares[parseInt(currentId) +width].id
        const newSquare = document.getElementById(newId)
        click(newSquare)
      }
      if (!isLowerEdge && !isRightEdge) {
        const newId = squares[parseInt(currentId) +width +1].id
        const newSquare = document.getElementById(newId)
        click(newSquare)
      }
    }, 10)
  }

  //game over
  function gameOver(square) {
    if(document.gameConfig.enableSounds.checked) {
      gameOverSound.play()
    }

    result.innerHTML = 'GAME OVER<BR>(*>△<)<ナーンナーンっっ'
    clearInterval(elapsedTime_timer);
    isGameOver = true

    //show ALL the bombs
    squares.forEach(square => {
      if (square.classList.contains('bomb')) {
        square.innerHTML = '💣'
        square.classList.remove('bomb')
        square.classList.add('checked')
      }
    })
  }

  //check for win
  function checkForWin() {
    ///simplified win argument
    let matches = 0
    for (let i = 0; i < squares.length; i++) {
      // if (squares[i].classList.contains('flag') && squares[i].classList.contains('bomb')) {
      if ((squares[i].classList.contains('flag') || squares[i].classList.contains('valid')) && squares[i].classList.contains('bomb')) {
        matches ++
      }
      if (matches === bombAmount) {
        if(document.gameConfig.enableSounds.checked) {
          gameClearSound.play()
        }
        clearInterval(elapsedTime_timer);
        result.innerHTML = 'YOU WIN!'
        isGameOver = true
      }
    }
  }
})
