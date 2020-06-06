const lexer = require("./lexer");

function top(stack) {
  return stack[stack.length - 1];
}

function shouldReduce(s) {
  return /^reduce/.test(s);
}

const transitions = {
  beforeStatement: {
    var: "afterVariableKeyword",
    function: "afterFunctionKeyword",
    if: "afterIfKeyword",
    return: "afterReturnKeyword",
    export: "afterExportKeyword",
    Identifier: "afterIdentifier",
    CallExpression: "afterExpression",
    AssignmentExpression: "afterExpression",
    ExpressionStatement: "beforeStatement",
    VariableDeclaration: "beforeStatement",
    FunctionDeclaration: "beforeStatement",
    IfStatement: "beforeStatement",
    ReturnStatement: "beforeStatement",
    ExportNamedDeclaration: "beforeStatement",
    "}": "reduceBlockStatement",
  },

  // Numeric Expression

  beforeOperand: {
    NumericLiteral: "afterAdditiveOperand",
    Identifier: "afterAdditiveOperand",
    UnaryExpression: "afterAdditiveOperand",
    BinaryExpression: "afterAdditiveOperand",
    CallExpression: "afterAdditiveOperand",
    AdditiveOperator: "afterUnaryOperator",
    "(": "beforeOperand",
  },
  afterUnaryOperator: {
    NumericLiteral: "reduceUnaryExpression",
    Identifier: "reduceUnaryExpression",
    UnaryExpression: "reduceUnaryExpression",
    BinaryExpression: "reduceUnaryExpression",
    "(": "beforeOperand",
  },
  afterAdditiveOperator: {
    NumericLiteral: "afterAdditiveOperand",
    Identifier: "afterAdditiveOperand",
    UnaryExpression: "afterAdditiveOperand",
    BinaryExpression: "afterAdditiveOperand",
    CallExpression: "afterAdditiveOperand",
    "(": "beforeOperand",
  },
  afterMultiplicativeOperator: {
    NumericLiteral: "afterMultiplicativeOperand",
    Identifier: "afterMultiplicativeOperand",
    UnaryExpression: "afterMultiplicativeOperand",
    BinaryExpression: "afterMultiplicativeOperand",
    CallExpression: "afterMultiplicativeOperand",
    "(": "beforeOperand",
  },
  afterAdditiveOperand: {
    AdditiveOperator: "afterAdditiveOperator",
    MultiplicativeOperator: "afterMultiplicativeOperator",
    "(": "beforeArgument",
    ")": "reduceTerms",
    ";": "reduceFullExpression",
    ",": "reduceFullExpression",
  },
  afterMultiplicativeOperand: {
    AdditiveOperator: "reduceTerm",
    MultiplicativeOperator: "reduceTerm",
    "(": "beforeArgument",
    ")": "reduceTerm",
    ";": "reduceTerm",
    ",": "reduceTerm",
  },
  beforeArgument: {
    NumericLiteral: "afterArgument",
    Identifier: "afterArgument",
    ")": "reduceCallExpression",
  },
  afterArgument: {
    ",": "beforeArgument",
    ")": "reduceCallExpression",
  },
  afterIdentifier: {
    "=": "beforeAssignmentRight",
    "(": "beforeArgument",
  },
  beforeAssignmentRight: {
    NumericLiteral: "afterAdditiveOperand",
    Identifier: "afterAdditiveOperand",
    UnaryExpression: "afterAdditiveOperand",
    BinaryExpression: "afterAdditiveOperand",
    CallExpression: "afterAdditiveOperand",
    AdditiveOperator: "afterUnaryOperator",
    "(": "beforeOperand",
    FullExpression: "reduceAssignmentExpression",
  },
  afterExpression: {
    ";": "reduceExpressionStatement",
  },

  // Variable Declaration

  afterVariableKeyword: {
    Identifier: "afterVariableName",
  },
  afterVariableName: {
    ";": "reduceVariableDeclaration",
    "=": "beforeInit",
  },
  beforeInit: {
    NumericLiteral: "afterAdditiveOperand",
    Identifier: "afterAdditiveOperand",
    UnaryExpression: "afterAdditiveOperand",
    BinaryExpression: "afterAdditiveOperand",
    CallExpression: "afterAdditiveOperand",
    AdditiveOperator: "afterUnaryOperator",
    "(": "beforeOperand",
    FullExpression: "reduceVariableDeclaration",
  },

  // Function Declaration

  afterFunctionKeyword: {
    Identifier: "afterFunctionName",
  },
  afterFunctionName: {
    "(": "beforeParam",
    params: "beforeBody",
  },
  beforeParam: {
    Identifier: "afterParam",
    ")": "reduceParams",
  },
  afterParam: {
    ",": "beforeParam",
    ")": "reduceParams",
  },
  beforeBody: {
    "{": "beforeStatement",
    BlockStatement: "reduceFunctionDeclaration",
  },

  // If Statement

  afterIfKeyword: {
    "(": "beforeTestOperand",
    BinaryExpression: "beforeConsequent",
  },
  beforeTestOperand: {
    NumericLiteral: "afterTestOperand",
    Identifier: "afterTestOperand",
  },
  afterTestOperand: {
    RelationalOperator: "beforeTestOperand",
    ")": "reduceTest",
  },
  beforeConsequent: {
    "{": "beforeStatement",
    BlockStatement: "afterConsequent",
  },
  afterConsequent: {
    else: "beforeAlternate",
  },
  beforeAlternate: {
    "{": "beforeStatement",
    BlockStatement: "reduceIfStatement",
  },

  // Return Statement

  afterReturnKeyword: {
    NumericLiteral: "afterAdditiveOperand",
    Identifier: "afterAdditiveOperand",
    UnaryExpression: "afterAdditiveOperand",
    BinaryExpression: "afterAdditiveOperand",
    CallExpression: "afterAdditiveOperand",
    AdditiveOperator: "afterUnaryOperator",
    "(": "beforeOperand",
    FullExpression: "reduceReturnStatement",
  },

  // Export Declaration
  afterExportKeyword: {
    "{": "beforeLocalName",
    function: "afterFunctionKeyword",
    ExportSpecifiers: "reduceExportDeclaration",
    FunctionDeclaration: "reduceExportDeclaration",
  },
  beforeLocalName: {
    Identifier: "afterLocalName",
    ExportSpecifier: "beforeLocalName",
    ";": "reduceExportSpecifiers",
  },
  afterLocalName: {
    as: "beforeExportedName",
    ",": "reduceExportSpecifier",
    "}": "reduceExportSpecifier",
  },
  beforeExportedName: {
    Identifier: "afterExportedName",
  },
  afterExportedName: {
    ",": "reduceExportSpecifier",
    "}": "reduceExportSpecifier",
  },
};

function parse(s) {
  const lex = lexer(s);
  const stack = [{ state: "beforeStatement" }];
  let { value: nextToken, done } = lex.next();

  while (!done) {
    const state = top(stack).state;
    const type = nextToken.type;
    let nextState = transitions[state][type];

    console.log(state, "->", nextState, nextToken, "\n");

    if (!shouldReduce(nextState)) {
      stack.push({ state: nextState, node: nextToken });
      ({ value: nextToken, done } = lex.next());
      continue;
    }

    let node = nextToken;
    while (shouldReduce(nextState)) {
      switch (nextState) {
        case "reduceTerm":
          node = reduceTerm(node);
          break;
        case "reduceTerms":
          node = reduceTerms(node);
          break;
        case "reduceUnaryExpression":
          node = reduceUnaryExpression(node);
          break;
        case "reduceFullExpression":
          node = reduceFullExpression(node);
          break;
        case "reduceCallExpression":
          node = reduceCallExpression(node);
          break;
        case "reduceAssignmentExpression":
          node = reduceAssignmentExpression(node);
          break;
        case "reduceExpressionStatement":
          node = reduceExpressionStatement(node);
          break;
        case "reduceVariableDeclaration":
          node = reduceVariableDeclaration(node);
          break;
        case "reduceParams":
          node = reduceParams(node);
          break;
        case "reduceFunctionDeclaration":
          node = reduceFunctionDeclaration(node);
          break;
        case "reduceTest":
          node = reduceTest(node);
          break;
        case "reduceIfStatement":
          node = reduceIfStatement(node);
          break;
        case "reduceReturnStatement":
          node = reduceReturnStatement(node);
          break;
        case "reduceBlockStatement":
          node = reduceBlockStatement(node);
          break;
        case "reduceExportSpecifier":
          node = reduceExportSpecifier(node);
          break;
        case "reduceExportSpecifiers":
          node = reduceExportSpecifiers(node);
          break;
        case "reduceExportDeclaration":
          node = reduceExportDeclaration(node);
          break;
      }

      const state = top(stack).state;
      const type = node.complete ? "FullExpression" : node.type;
      nextState = transitions[state][type];

      console.log("REDUCE:", state, "->", nextState, node, "\n");
    }
    stack.push({ state: nextState, node });
  }

  return {
    type: "Program",
    body: stack.filter((s) => s.node).map((s) => s.node),
  };

  // Reductions

  function reduceUnaryExpression(argument) {
    if (argument === nextToken) {
      ({ value: nextToken, done } = lex.next()); // Discard
    }
    const operator = stack.pop().node.value;
    return {
      type: "UnaryExpression",
      operator,
      argument,
    };
  }

  function reduceTerm() {
    const right = stack.pop().node;
    const operator = stack.pop().node.value;
    const left = stack.pop().node;
    return {
      type: "BinaryExpression",
      operator,
      left,
      right,
    };
  }

  function reduceTerms() {
    ({ value: nextToken, done } = lex.next()); // `)`
    const temp = []; // Reverse
    let node;
    while ((node = stack.pop().node) && node.type !== "(") {
      temp.push(node);
    }
    let last = temp.pop();
    while (temp.length) {
      const left = last;
      const operator = temp.pop().value;
      const right = temp.pop();
      last = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      };
    }
    return last;
  }

  function reduceFullExpression() {
    const temp = []; // Reverse
    let node;
    while (
      (node = top(stack).node) &&
      !(node.type === "return" || node.type === "=")
    ) {
      temp.push(stack.pop().node);
    }
    let last = temp.pop();
    while (temp.length) {
      const left = last;
      const operator = temp.pop().value;
      const right = temp.pop();
      last = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      };
    }
    last.complete = true;
    return last;
  }

  function reduceAssignmentExpression(right) {
    stack.pop(); // `=`
    const left = stack.pop().node;
    return { type: "AssignmentExpression", left, right };
  }

  function reduceCallExpression() {
    ({ value: nextToken, done } = lex.next()); // `)`
    const args = [];
    let node;
    while ((node = stack.pop().node) && node.type !== "(") {
      if (node.type === ",") continue;
      args.unshift(node);
    }
    const callee = stack.pop().node;
    return { type: "CallExpression", callee, arguments: args };
  }

  function reduceExpressionStatement() {
    ({ value: nextToken, done } = lex.next()); // `;`
    const expression = stack.pop().node;
    return {
      type: "ExpressionStatement",
      expression,
    };
  }

  function reduceVariableDeclaration(node) {
    let init;
    if (node.complete) {
      init = node;
      stack.pop(); // `=`
    }
    ({ value: nextToken, done } = lex.next()); // `;`
    const id = stack.pop().node;
    stack.pop(); // `var`
    return {
      type: "VariableDeclaration",
      declarations: [
        {
          type: "Declarator",
          id,
          init,
        },
      ],
    };
  }

  function reduceParams() {
    ({ value: nextToken, done } = lex.next()); // `)`
    const params = [];
    let node;
    while ((node = stack.pop().node) && node.type !== "(") {
      if (node.type === ",") continue;
      params.unshift(node);
    }
    return {
      type: "params",
      params,
    };
  }

  function reduceFunctionDeclaration(body) {
    const params = stack.pop().node.params;
    const id = stack.pop().node;
    stack.pop(); // `function`
    return { type: "FunctionDeclaration", id, params, body };
  }

  function reduceTest() {
    ({ value: nextToken, done } = lex.next()); // `)`
    const right = stack.pop().node;
    const operator = stack.pop().node.value;
    const left = stack.pop().node;
    stack.pop(); // `(`
    return {
      type: "BinaryExpression",
      operator,
      left,
      right,
    };
  }

  function reduceIfStatement(alternate) {
    stack.pop(); // `else`
    const consequent = stack.pop().node;
    const test = stack.pop().node;
    stack.pop(); // `if`
    return {
      type: "IfStatement",
      test,
      consequent,
      alternate,
    };
  }

  function reduceReturnStatement(argument) {
    ({ value: nextToken, done } = lex.next()); // `;`
    stack.pop(); // `return`
    return { type: "ReturnStatement", argument };
  }

  function reduceBlockStatement() {
    ({ value: nextToken, done } = lex.next());
    const body = [];
    let node;
    while ((node = stack.pop().node) && node.type !== "{") {
      body.unshift(node);
    }
    return { type: "BlockStatement", body };
  }

  function reduceExportSpecifier() {
    ({ value: nextToken, done } = lex.next()); // `,` or `}`
    const exported = stack.pop().node;
    if (top(stack).node.type === "as") {
      stack.pop();
      const local = stack.pop().node;
      return { type: "ExportSpecifier", local, exported };
    } else {
      return { type: "ExportSpecifier", local: exported, exported };
    }
  }

  function reduceExportSpecifiers() {
    ({ value: nextToken, done } = lex.next()); // `;`
    const specifiers = [];
    let node;
    while ((node = stack.pop().node) && node.type !== "{") {
      specifiers.unshift(node);
    }
    return { type: "ExportSpecifiers", specifiers };
  }

  function reduceExportDeclaration(node) {
    stack.pop(); // `export`
    if (node.type === "FunctionDeclaration") {
      return { type: "ExportNamedDeclaration", declaration: node };
    } else {
      return { type: "ExportNamedDeclaration", specifiers: node.specifiers };
    }
  }
}

module.exports = parse;
