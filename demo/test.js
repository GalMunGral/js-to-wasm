export function determinant(a, b, c) {
  return b * b - 4 * a * c;
}

function solve(a, b, c) {
  var det;
  det = determinant(a, b, c);
  if (det <= 0) {
    __error__();
    return 0;
  } else {
    return (-b + __sqrt__(det)) / (2 * a);
  }
}

function factorial(n) {
  if (n < 2) {
    return 1;
  } else {
    var m = n - 1;
    return n * factorial(m);
  }
}

function fibonacci(n) {
  if (n < 2) {
    return n;
  } else {
    var l = n - 2;
    var m = n - 1;
    return fibonacci(l) + fibonacci(m);
  }
}

export { solve as solveQuadratic, factorial, fibonacci };
