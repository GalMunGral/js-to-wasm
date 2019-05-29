### Wat?
```wasm
(module
  (func $addfive (param i32) (result i32)
    get_local 0
    i32.const 5
    i32.add)
  (export "addFive" (func $addfive))
)
```

### Install `wat2wasm` Compiler
***Dependencies**: `clang` and `cmake`*
```
git clone --recursive https://github.com/WebAssembly/wabt
cd wabt && make
```
### Compile `.wat` File into `.wasm` File
```
<project root>/wabt/out/clang/Debug/wat2wasm <file.wat> -o <output.wasm>
```
