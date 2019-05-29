### `.wat` is this? A function that adds two `i32` integers, then increment by `1`.
```wasm
(module
  (func $addincr (param i32) (param i32) (result i32)
    get_local 0
    get_local 1
    i32.add
    i32.const 1
    i32.add)
  (export "addincr" (func $addincr))
)
```

### Download & build `wat2wasm` compiler
```bash
sudo apt install cmake
sudo apt install clang
git clone --recursive https://github.com/WebAssembly/wabt
cd wabt && make # This might take some time 
```
### Compile `.wat` file into `.wasm`
```bash
<project root>/wabt/out/clang/Debug/wat2wasm <input>.wat -o <output>.wasm
```
