(module
  (func $addincr (param i32) (param i32) (result i32)
    get_local 0
    get_local 1
    i32.add
    i32.const 1
    i32.add)
  (export "addincr" (func $addincr))
)
