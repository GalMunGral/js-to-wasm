(module
  (func $addfive (param i32) (result i32)
    get_local 0
    i32.const 5
    i32.add)
  (export "addFive" (func $addfive))
)
