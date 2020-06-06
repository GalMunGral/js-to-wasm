window.onload = function () {
  const aInput = document.getElementById("a-input");
  const bInput = document.getElementById("b-input");
  const cInput = document.getElementById("c-input");
  const aDisplay = document.getElementById("a-display");
  const bDisplay = document.getElementById("b-display");
  const cDisplay = document.getElementById("c-display");
  const xDisplay = document.querySelectorAll(".x-display");
  const resultDisplay = document.getElementById("result-display");
  const errorDisplay = document.getElementById("error-display");
  const fibonacciDisplay = this.document.getElementById("fibonacci");
  const factorialDisplay = this.document.getElementById("factorial");

  const memory = new WebAssembly.Memory({ initial: 1 });
  WebAssembly.instantiateStreaming(fetch("test.wasm"), {
    js: {
      mem: memory,
      log: (start, length) => {
        const bytes = new Uint8Array(memory.buffer, start, length);
        const string = new TextDecoder("utf8").decode(bytes);
        errorDisplay.textContent = string;
      },
    },
  }).then((result) => {
    const { solveQuadratic, fibonacci, factorial } = result.instance.exports;
    const fibonacciArr = [];
    const factorialArr = [];
    for (let i = 0; i < 25; i++) factorialArr.push(factorial(i));
    for (let i = 0; i < 25; i++) fibonacciArr.push(fibonacci(i));
    fibonacciDisplay.textContent = fibonacciArr.join(", ");
    factorialDisplay.textContent = factorialArr.join(", ");

    function update() {
      errorDisplay.textContent = "";
      const a = +aInput.value || 0;
      const b = +bInput.value || 0;
      const c = +cInput.value || 0;
      const x = solveQuadratic(a, b, c);
      const result = a * x ** 2 + b * x + c;

      aDisplay.textContent = a;
      bDisplay.textContent = b;
      cDisplay.textContent = c;
      xDisplay.forEach((span) => (span.textContent = x.toFixed(60)));
      resultDisplay.textContent = result.toFixed(60);
    }
    aInput.oninput = bInput.oninput = cInput.oninput = update;
    update();
  });
};
