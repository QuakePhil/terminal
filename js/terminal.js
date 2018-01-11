function setCaret(el) {
  let atStart = false
  el.focus()
  let range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(atStart)
  let selection = window.getSelection()
  selection.removeAllRanges()
  selection.addRange(range)
}

// latest commandline, including prompt
function commandLine() {
  let selection = document.getSelection()
  let node = selection.anchorNode
  let text = node.textContent.slice(0, selection.focusOffset)
  return text  
}

// not quite working
function currentPosition() {
  var text = commandLine()
  
  var line = text.split('\n').length
  var column = text.split('\n').pop().length

  return {
    line: line,
    column: column
  }
}

function loadShell() {
  var term = document.body

  term.contentEditable = true

  term.oninput = e => {
    //console.log(e)
  }

  term.onclick = e => {
    setCaret(term)
    console.log('onclick focused')
  }

  term.onkeydown = e => {
    position = currentPosition()
    // console.log(position) // fixme

    // prevent tab, up arrow
    if (e.which === 9 || e.which === 38) e.preventDefault()
    // left arrow
    if (e.which == 37) {
      if (position.column <= 2) e.preventDefault()
    }
    // enter
    if (e.which === 13) {
      let term = e.target
      let out = execute()
      if (typeof(out) === 'string') {
        term.innerHTML += "<br/>" + out + "<br/>" + prompt()
      } else {
        console.log(out)
        term.innerHTML += "<br/>" + prompt()
      }
      e.preventDefault()
      setCaret(term)
    }
  }

  term.innerHTML = prompt()
  setCaret(term)
}