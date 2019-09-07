const concurrently = require('concurrently');

const args = process.argv.slice(2).join(' ')

concurrently(
  [
    { command: 'npm run watch-server', name: 'ts-server' },
    { command: 'npm run watch-web' + args, name: 'ts-web' },
    { command: 'npm run serve' + args, name: 'serve-web' }
  ],
  {
    killOthers: ['failure', 'success']
  }
)