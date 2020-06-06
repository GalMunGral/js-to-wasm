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

function generateModule(node) {
  const body = node.body.flatMap((stmt) => generateStatement(stmt, []));
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

function generateStatement(node, locals) {
  switch (node.type) {
    case "ExpressionStatement":
      return generateExpressionStatement(node);
    case "FunctionDeclaration":
      return generateFunctionDeclaration(node);
    case "VariableDeclaration":
      return generateVariableDeclaration(node, locals);
    case "IfStatement":
      return generateIfStatement(node, locals);
    case "ReturnStatement":
      return generateReturnStatement(node);
    case "ExportNamedDeclaration":
      return generateExportDeclaration(node);
    default:
      return [];
  }
}

function generateExpressionStatement(node) {
  node = node.expression;
  if (node.type === "AssignmentExpression") {
    const name = node.left.name;
    return [...generateExpression(node.right), `(local.set $${name})`];
  } else {
    return generateExpression(node);
  }
}

function generateExpression(node) {
  switch (node.type) {
    case "NumericLiteral": {
      return [`(f32.const ${node.value})`];
    }
    case "Identifier": {
      return [`(local.get $${node.name})`];
    }
    case "BinaryExpression": {
      const left = generateExpression(node.left);
      const right = generateExpression(node.right);
      const operation = `(${binop[node.operator]})`;
      return [...left, ...right, operation];
    }
    case "UnaryExpression": {
      const operation = `(${unop[node.operator]})`;
      return [...generateExpression(node.argument), operation];
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
        const args = node.arguments.flatMap((arg) => generateExpression(arg));
        return [...args, `(${unop[fn] || binop[fn]})`];
      }
      const args = node.arguments.flatMap((arg) => generateExpression(arg));
      return [...args, `(call $${fn})`];
    }
    default:
      console.log(node);
      return [];
  }
}

function generateFunctionDeclaration(node) {
  const locals = [];
  const name = node.id.name;
  const params = node.params.map((p) => `(param $${p.name} f32)`);
  const body = generateBlockStatement(node.body, locals);
  return indent`
    (func $${name} ${params} (result f32)
      (local $__return__ f32) ${locals}
      ${body}
      (local.get $__return__)
    )
  `;
}

function generateBlockStatement(node, locals) {
  return node.body.flatMap((statement) => generateStatement(statement, locals));
}

function generateVariableDeclaration(node, locals) {
  const instructions = [];
  node.declarations.forEach((decl) => {
    const name = decl.id.name;
    locals.push(`(local $${name} f32)`);
    if (decl.init) {
      instructions.push(...generateExpression(decl.init));
      instructions.push(`(local.set $${name})`);
    }
  });
  return instructions;
}

function generateIfStatement(node, locals) {
  const test = generateExpression(node.test);
  const consequent = generateBlockStatement(node.consequent, locals);
  const alternate = generateBlockStatement(node.alternate, locals);
  return indent`
    ${test}
    (if
      (then
        ${consequent})
      (else
        ${alternate}))
  `;
}

function generateReturnStatement(node) {
  return [...generateExpression(node.argument), `(local.set $__return__)`];
}

function generateExportDeclaration(node) {
  if (node.declaration) {
    if (node.declaration.type === "FunctionDeclaration") {
      const name = node.declaration.id.name;
      exported.push(`(export "${name}" (func $${name}))`);
      return generateFunctionDeclaration(node.declaration);
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

module.exports = generateModule;
