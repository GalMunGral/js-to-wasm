const fs = require("fs");
const path = require("path");
const babylon = require("babylon");

const exported = [];

const unop = {
  "-": "f32.neg",
  __sqrt__: "f32.sqrt",
};

const binop = {
  "+": "f32.add",
  "-": "f32.sub",
  "*": "f32.mul",
  "/": "f32.div",
  "==": "f32.eq",
  "!=": "f32.ne",
  "<": "f32.lt",
  ">": "f32.gt",
  "<=": "f32.le",
  ">=": "f32.ge",
};

const filename = process.argv[2];
const basename = path.basename(filename, ".js");
const input = fs.readFileSync(filename, { encoding: "utf8" });
const ast = babylon.parse(input, { sourceType: "module" });
fs.writeFileSync(`./${basename}.wat`, compileModule(ast.program));

function isSpace(s) {
  return /^\s*$/.test(s);
}

function indent(strs, ...exprs) {
  let separator = " ";
  let segments = [];
  for (let i = 0; i < strs.length; i++) {
    const match = strs[i].match(/\n\s*$/);
    separator = match ? match[0] : " ";
    segments.push(strs[i]);
    if (i == strs.length - 1) break;
    if (Array.isArray(exprs[i])) {
      segments.push(exprs[i].flatMap((e) => e.split("\n")).join(separator));
    } else {
      segments.push(exprs[i]);
    }
  }
  const lines = segments.join("").split("\n");
  let indent = Number.MAX_VALUE;
  if (isSpace(lines[0])) lines.shift();
  if (isSpace(lines[lines.length - 1])) lines.pop();
  lines.forEach((line) => {
    const leadingSpaces = line.match(/^\s*/)[0];
    indent = Math.min(indent, leadingSpaces.length);
  });
  return lines.map((line) => line.slice(indent)).join("\n");
}

function compileModule(node) {
  const body = node.body.flatMap((stmt) => compileStatement(stmt, []));
  return indent`
    (module
      (import "js" "log" (func $log (param i32) (param i32)))
      (import "js" "mem" (memory 1))
      (data (i32.const 0) "ERROR")
      ${body}
      ${exported}
    )
  `;
}

function compileStatement(node, locals) {
  switch (node.type) {
    case "ExpressionStatement":
      return compileExpressionStatement(node);
    case "FunctionDeclaration":
      return compileFunctionDeclaration(node);
    case "VariableDeclaration":
      return compileVariableDeclaration(node, locals);
    case "IfStatement":
      return compileIfStatement(node, locals);
    case "ReturnStatement":
      return compileReturnStatement(node);
    case "ExportNamedDeclaration":
      return compileExportDeclaration(node);
    default:
      return [];
  }
}

function compileExpressionStatement(node) {
  node = node.expression;
  if (node.type === "AssignmentExpression") {
    const name = node.left.name;
    return [...compileExpression(node.right), `(local.set $${name})`];
  } else {
    return compileExpression(node);
  }
}

function compileExpression(node) {
  switch (node.type) {
    case "NumericLiteral": {
      return [`(f32.const ${node.value})`];
    }
    case "Identifier": {
      return [`(local.get $${node.name})`];
    }
    case "BinaryExpression": {
      const left = compileExpression(node.left);
      const right = compileExpression(node.right);
      const operation = `(${binop[node.operator]})`;
      return [...left, ...right, operation];
    }
    case "UnaryExpression": {
      const operation = `(${unop[node.operator]})`;
      return [...compileExpression(node.argument), operation];
    }
    case "CallExpression": {
      const fn = node.callee.name;
      if (fn === "__error__") {
        return indent`
        (i32.const 0)
        (i32.const 5)
        (call $log)
        `;
      }
      if (/^__\w+__$/.test(fn)) {
        const args = node.arguments.flatMap((arg) => compileExpression(arg));
        return [...args, `(${unop[fn] || binop[fn]})`];
      }
      const args = node.arguments.flatMap((arg) => compileExpression(arg));
      return [...args, `(call $${fn})`];
    }
    default:
      console.log(node);
      return [];
  }
}

function compileFunctionDeclaration(node) {
  const locals = [];
  const name = node.id.name;
  const params = node.params.map((p) => `(param $${p.name} f32)`);
  const body = compileBlockStatement(node.body, locals);
  return indent`
    (func $${name} ${params} (result f32)
      (local $__return__ f32) ${locals}
      ${body}
      (local.get $__return__)
    )
  `;
}

function compileBlockStatement(node, locals) {
  return node.body.flatMap((statement) => compileStatement(statement, locals));
}

function compileVariableDeclaration(node, locals) {
  const instructions = [];
  node.declarations.forEach((decl) => {
    const name = decl.id.name;
    locals.push(`(local $${name} f32)`);
    if (decl.init) {
      instructions.push(...compileExpression(decl.init));
      instructions.push(`(local.set $${name})`);
    }
  });
  return instructions;
}

function compileIfStatement(node, locals) {
  const test = compileExpression(node.test);
  const consequent = compileBlockStatement(node.consequent, locals);
  const alternate = compileBlockStatement(node.alternate, locals);
  return indent`
    ${test}
    (if
      (then
        ${consequent})
      (else
        ${alternate}))
  `;
}

function compileReturnStatement(node) {
  return [...compileExpression(node.argument), `(local.set $__return__)`];
}

function compileExportDeclaration(node) {
  if (node.declaration) {
    if (node.declaration.type === "FunctionDeclaration") {
      const name = node.declaration.id.name;
      exported.push(`(export "${name}" (func $${name}))`);
      return compileFunctionDeclaration(node.declaration);
    }
  } else {
    node.specifiers.forEach((spec) => {
      const localName = spec.local.name;
      const exportedName = spec.exported.name;
      exported.push(`(export "${exportedName}" (func $${localName}))`);
    });
  }
  return [];
}
