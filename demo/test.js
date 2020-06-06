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
    return n;
  } else {
    var m = n - 1;
    return factorial(m) * n;
  }
}

function fib(n) {
  if (n < 2) {
    return n;
  } else {
    var a = n - 1;
    var b = n - 2;
    return fib(a) + fib(b);
  }
}

export { solve as solveQuadratic, factorial, fib };
