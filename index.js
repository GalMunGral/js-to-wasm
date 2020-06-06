const fs = require("fs");
const path = require("path");
const parse = require("./src/parser");
const generate = require("./src/emitter");

const filename = process.argv[2];
const basename = path.basename(filename, ".js");
const pathname = path.dirname(filename);

const src = fs.readFileSync(filename, { encoding: "utf8" });
const ast = parse(src);
const wat = generate(ast);

fs.writeFileSync(`${pathname}/${basename}.wat`, wat);
fs.writeFileSync(
  `${pathname}/${basename}.ast.json`,
  JSON.stringify(ast, null, 2)
);
