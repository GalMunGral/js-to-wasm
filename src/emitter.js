const exported = [];

const unop = {
  "-": "f64.neg",
  __sqrt__: "f64.sqrt",
};

const binop = {
  "+": "f64.add",
  "-": "f64.sub",
  "*": "f64.mul",
  "/": "f64.div",
  "==": "f64.eq",
  "!=": "f64.ne",
  "<": "f64.lt",
  ">": "f64.gt",
  "<=": "f64.le",
  ">=": "f64.ge",
};

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

function emitModule(node) {
  const body = node.body.flatMap((stmt) => emitStatement(stmt, []));
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

function emitStatement(node, locals) {
  switch (node.type) {
    case "ExpressionStatement":
      return emitExpressionStatement(node);
    case "FunctionDeclaration":
      return emitFunctionDeclaration(node);
    case "VariableDeclaration":
      return emitVariableDeclaration(node, locals);
    case "IfStatement":
      return emitIfStatement(node, locals);
    case "ReturnStatement":
      return emitReturnStatement(node);
    case "ExportNamedDeclaration":
      return emitExportDeclaration(node);
    default:
      return [];
  }
}

function emitExpressionStatement(node) {
  node = node.expression;
  if (node.type === "AssignmentExpression") {
    const name = node.left.name;
    return [...emitExpression(node.right), `(local.set $${name})`];
  } else {
    return emitExpression(node);
  }
}

function emitExpression(node) {
  switch (node.type) {
    case "NumericLiteral": {
      return [`(f64.const ${node.value})`];
    }
    case "Identifier": {
      return [`(local.get $${node.name})`];
    }
    case "BinaryExpression": {
      const left = emitExpression(node.left);
      const right = emitExpression(node.right);
      const operation = `(${binop[node.operator]})`;
      return [...left, ...right, operation];
    }
    case "UnaryExpression": {
      const operation = `(${unop[node.operator]})`;
      return [...emitExpression(node.argument), operation];
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
        const args = node.arguments.flatMap((arg) => emitExpression(arg));
        return [...args, `(${unop[fn] || binop[fn]})`];
      }
      const args = node.arguments.flatMap((arg) => emitExpression(arg));
      return [...args, `(call $${fn})`];
    }
    default:
      console.log(node);
      return [];
  }
}

function emitFunctionDeclaration(node) {
  const locals = [];
  const name = node.id.name;
  const params = node.params.map((p) => `(param $${p.name} f64)`);
  const body = emitBlockStatement(node.body, locals);
  return indent`
    (func $${name} ${params} (result f64)
      (local $__return__ f64) ${locals}
      ${body}
      (local.get $__return__)
    )
  `;
}

function emitBlockStatement(node, locals) {
  return node.body.flatMap((statement) => emitStatement(statement, locals));
}

function emitVariableDeclaration(node, locals) {
  const instructions = [];
  node.declarations.forEach((decl) => {
    const name = decl.id.name;
    locals.push(`(local $${name} f64)`);
    if (decl.init) {
      instructions.push(...emitExpression(decl.init));
      instructions.push(`(local.set $${name})`);
    }
  });
  return instructions;
}

function emitIfStatement(node, locals) {
  const test = emitExpression(node.test);
  const consequent = emitBlockStatement(node.consequent, locals);
  const alternate = emitBlockStatement(node.alternate, locals);
  return indent`
    ${test}
    (if
      (then
        ${consequent})
      (else
        ${alternate}))
  `;
}

function emitReturnStatement(node) {
  return [...emitExpression(node.argument), `(local.set $__return__)`];
}

function emitExportDeclaration(node) {
  if (node.declaration) {
    if (node.declaration.type === "FunctionDeclaration") {
      const name = node.declaration.id.name;
      exported.push(`(export "${name}" (func $${name}))`);
      return emitFunctionDeclaration(node.declaration);
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

module.exports = emitModule;
