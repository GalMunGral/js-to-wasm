WebAssembly.instantiateStreaming(fetch('add5.wasm'), {})
  .then(result => {
    console.log(result)
    const f = result.instance.exports.addFive;
    console.log(f(1));
  })