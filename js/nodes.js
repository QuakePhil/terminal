var cwd = '/www'

var prompt = function() { return cwd + " $&nbsp;" }

// "&gt;&nbsp;" becomes "> " for purposes of .length etc
function decodeHtml(html) {
  let text = document.createElement("textarea")
  text.innerHTML = html
  return text.value
}

var paths = ['/bin','/usr/local/bin']

function resolvePath(dir) {
  if (dir === '.') {
    dir = cwd
  } else if (dir === '..') {
    dir = cwd.split('/').reverse()[1]
  }
  dir = dir.replace(/\/?$/, '/') // ensure dir ends on a slash
  return dir
}

var nodes = {
  "/bin/cd": { // todo: make cd work with relative paths
    description: 'Change working directory',
    method: function(args) {
      if (typeof args[1] === 'undefined') {
        return nodes["/bin/pwd"].method()
      }
      let dir = resolvePath(args[1])

      for (let node in nodes) {
        if (node.startsWith(dir)) {
          cwd = dir === '/' ? '/' : dir.slice(0, -1)
          return true
        }
      }
      return false
    },
  },
  "/bin/pwd": {
    description: 'Print working directory',
    method: function() {
      return cwd
    },
  },
  "/bin/path": {
    description: 'Search path',
    method: function() {
      return paths.join(':')
    },
  },
  "/bin/ls": {
    description: 'List website contents',
    nodesIn: function(dirs) {
      let foundNodes = {}
      for (let node in nodes) { // object
        for (let dir in dirs) { // array
          if (node.startsWith(dirs[dir])) {
            foundNodes[node] = nodes[node]
          }
        }
      }
      return foundNodes
    },
    method: function(args) {
      let foundNodes = []
      let dir = args[1] ? args[1] : cwd
      dir = resolvePath(dir)
      console.log(dir)
      for (let node in this.nodesIn([dir])) {
        let pathBeginsWith = node.substring(dir.length).split('/')[0] // ls(/x/y) /x/y/z becomes /x/y/
        console.log(node, pathBeginsWith)
        foundNodes.push(pathBeginsWith)
      }
      if (foundNodes.length === 0) {
        return 'ls: ' + dir + ': No such directory'
      }
      return foundNodes.filter(
      function(value, index, self) {
        return self.indexOf(value) === index // filter unique values
      }).sort().join('<br/>')
    },
  },
  "/bin/cat": {
    description: 'Concatenate and print files',
    readFile: function(path) {
      if (path[0] !== '/') {
        path = cwd + '/' + path
      }
      if (typeof nodes[path] === 'undefined') {
        return 'cat: ' + path + ': No such file or directory'
      } else if (typeof nodes[path] !== 'string') {
        return 'cat: ' + path + ': Could not open for reading'
      } else {
        this.easterEgg(path)
        return nodes[path]
      }
    },
    easterEgg: function(path) {
      if (path === '/www/hello.txt' && typeof nodes["/www/readme.txt"] === 'undefined') {
        nodes["/www/readme.txt"] = 'Not much here for now 8('
      }
    },
    method: function(args) {
      if (typeof args[1] === 'undefined') {
        return 'Stdin not accessible'
      }

      let out = ''
      let delimiter = ''
      for (let i = 1; i < args.length; ++i) {
        out += delimiter + this.readFile(args[i])
        delimiter = '<br/>'
      }
      return out
    },
  },
  "/bin/find": {
    description: 'Walk website hierarchy',
    method: function(args) {
      let foundNodes = []
      let dir = args[1] ? args[1] : cwd
      dir = resolvePath(dir)
      for (let node in nodes["/bin/ls"].nodesIn([dir])) {
        foundNodes.push(node)
      }
      if (foundNodes.length === 0) {
        return 'find: ' + dir + ': No such directory'
      }
      return foundNodes.sort().join('<br/>')
    },
  },
  "/usr/local/bin/help": {
    description: 'List some helpful commands',
    method: function() {
      return 'Try using \"ls\" to look around'
    },
  },
  "/www/hello.txt": 'I spend a lot of time at a command line, now you get to experience what that feels like while browsing my website :)<br/>While this command line resembles *nix, it is quite limited.  Also, some commands do unexpected magic, for example there\'s a new file in /www, take a look...'
}

var hint = 'Try using \"ls\" to look around'

function execute() {
  let availableCommands = nodes["/bin/ls"].nodesIn(paths.concat(cwd))

  let currentCommandArgs = commandLine().substring(decodeHtml(prompt()).length).split(' ')
  let currentCommand = currentCommandArgs[0]
  console.log(currentCommandArgs)
  let foundCommand = false
  for (let command in availableCommands) {
    if ((currentCommand[0] === '/' && command === currentCommand) // absolute path
      || (command.split('/').reverse()[0] === currentCommand)) {
        foundCommand = command
        break
      }
    }
  if (foundCommand === false) {
    let ret = 'Unknown command: "'+ currentCommand + '"<br/>' + hint
    hint = ''
    return ret
  } else {
    if (typeof nodes[foundCommand].method !== "undefined") {
      return nodes[foundCommand].method(currentCommandArgs)
    } else {
      return 'Executible flag not set'
    }
  }
}
