# PowerShell script to start HRMS dev server with crypto polyfill for Node.js < 19
$env:NODE_OPTIONS = "--require ./polyfill.js"
npx nest start --watch
