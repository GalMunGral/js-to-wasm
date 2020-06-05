### Install `wat2wasm`
```bash
sudo apt install cmake
sudo apt install clang
git clone --recursive https://github.com/WebAssembly/wabt
cd wabt && make
```
### Example
#### Input: JavaScript module
```js
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
```

#### Ouput: WebAssembly Text Format (WAT)
```wat
(module
  (import "js" "log" (func $log (param i32) (param i32)))
  (import "js" "mem" (memory 1))
  (data (i32.const 0) "ERROR")
  (func $determinant (param $a f32) (param $b f32) (param $c f32) (result f32)
    (local $__return__ f32) 
    (local.get $b)
    (local.get $b)
    (f32.mul)
    (f32.const 4)
    (local.get $a)
    (f32.mul)
    (local.get $c)
    (f32.mul)
    (f32.sub)
    (local.set $__return__)
    (local.get $__return__)
  )
  (func $solve (param $a f32) (param $b f32) (param $c f32) (result f32)
    (local $__return__ f32) (local $det f32)
    (local.get $a)
    (local.get $b)
    (local.get $c)
    (call $determinant)
    (local.set $det)
    (local.get $det)
    (f32.const 0)
    (f32.le)
    (if
      (then
        (i32.const 0)
        (i32.const 5)
        (call $log)
        (f32.const 0)
        (local.set $__return__))
      (else
        (local.get $b)
        (f32.neg)
        (local.get $det)
        (f32.sqrt)
        (f32.add)
        (f32.const 2)
        (local.get $a)
        (f32.mul)
        (f32.div)
        (local.set $__return__)))
    (local.get $__return__)
  )
  (export "determinant" (func $determinant))
  (export "solveQuadratic" (func $solve))
)
```
