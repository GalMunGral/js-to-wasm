module.exports = function* lexer(s) {
  s = s.trim();
  const lexerRegex = /(?<token>\d+|[a-zA-Z_]+|[+\-*/]|<=|>=|[=<>(){},;]|==)\s*/y;
  while ((match = lexerRegex.exec(s))) {
    const {
      groups: { token },
    } = match;
    switch (token) {
      case "+":
      case "-":
        yield { type: "AdditiveOperator", value: token };
        break;
      case "*":
      case "/":
        yield { type: "MultiplicativeOperator", value: token };
        break;
      case "<":
      case ">":
      case "<=":
      case ">=":
      case "==":
        yield { type: "RelationalOperator", value: token };
        break;
      case "=":
        yield { type: "=" };
        break;
      case "(":
        yield { type: "(" };
        break;
      case ")":
        yield { type: ")" };
        break;
      case "{":
        yield { type: "{" };
        break;
      case "}":
        yield { type: "}" };
        break;
      case ";":
        yield { type: ";" };
        break;
      case ",":
        yield { type: "," };
        break;
      case "function":
        yield { type: "function" };
        break;
      case "var":
        yield { type: "var" };
        break;
      case "if":
        yield { type: "if" };
        break;
      case "else":
        yield { type: "else" };
        break;
      case "return":
        yield { type: "return" };
        break;
      case "export":
        yield { type: "export" };
        break;
      case "as":
        yield { type: "as" };
        break;
      default:
        const n = Number(token);
        if (Number.isNaN(n)) {
          yield { type: "Identifier", name: token };
        } else {
          yield { type: "NumericLiteral", value: n };
        }
    }
  }
  return;
};
