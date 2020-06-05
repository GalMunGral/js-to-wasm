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

export { solve as solveQuadratic };
