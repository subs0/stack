const { exec, args } = require("./utils")

const msg = `"typecasting..."`

const types = ({ st }) => {
  exec(`tsc --project src/${st}/tsconfig.build.json`, { stdio: [0, 1, 2] })
}
console.log(msg)
types(args(msg))

// CLI use
// node scripts\types st=spool
