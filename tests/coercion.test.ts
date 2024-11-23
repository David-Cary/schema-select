import {
  ArrayEnforcer,
  BooleanEnforcer,
  NumberEnforcer,
  SteppedNumberEnforcer,
  ObjectEnforcer,
  StringEnforcer,
  StrictEqualityEnforcer
} from "../src/index"

describe("ArrayEnforcer", () => {
  const enforcer = new ArrayEnforcer()
  const defaultedEnforcer = new ArrayEnforcer([null], '_value')
  describe("validate", () => {
    test("should exclude objects and nulls", () => {
      expect(enforcer.validate(null)).toEqual(false)
      expect(enforcer.validate({})).toEqual(false)
      expect(enforcer.validate([])).toEqual(true)
    })
  })
  describe("coerce", () => {
    test("should use JSON parse on strings", () => {
      expect(enforcer.coerce('[1]')).toEqual([1])
    })
    test("should extract array values", () => {
      expect(enforcer.coerce({ '0': 'a', '2': 'c' })).toEqual(['a', undefined, 'c'])
    })
    test("should unwrap value if there's a value property specified", () => {
      expect(defaultedEnforcer.coerce({_value: ["z"]})).toEqual(['z'])
    })
    test("should apply default value for nullish values", () => {
      expect(defaultedEnforcer.coerce(undefined)).toEqual([null])
    })
    test("should wrap all other values", () => {
      expect(enforcer.coerce('z')).toEqual(['z'])
    })
  })
})

describe("BooleanEnforcer", () => {
  const enforcer = new BooleanEnforcer(true, '_value')
  describe("validate", () => {
    test("should check typeof value", () => {
      expect(enforcer.validate(1)).toEqual(false)
      expect(enforcer.validate(false)).toEqual(true)
    })
  })
  describe("coerce", () => {
    test("should apply default value on null value", () => {
      expect(enforcer.coerce(undefined)).toEqual(true)
    })
    test("should apply typecasting to other values", () => {
      expect(enforcer.coerce(0)).toEqual(false)
    })
    test("should unwrap using value property", () => {
      expect(enforcer.coerce({ _value: false })).toEqual(false)
    })
  })
})

describe("NumberEnforcer", () => {
  const enforcer = new NumberEnforcer(-1, '_value')
  describe("validate", () => {
    test("should check typeof value", () => {
      expect(enforcer.validate('a')).toEqual(false)
      expect(enforcer.validate(1)).toEqual(true)
    })
  })
  describe("coerce", () => {
    test("should apply default value on null value", () => {
      expect(enforcer.coerce(undefined)).toEqual(-1)
    })
    test("should apply typecasting to other values", () => {
      expect(enforcer.coerce('0')).toEqual(0)
    })
    test("should unwrap using value property", () => {
      expect(enforcer.coerce({ _value: 1 })).toEqual(1)
    })
  })
})

describe("SteppedNumberEnforcer", () => {
  const enforcer = new SteppedNumberEnforcer(-1)
  describe("validate", () => {
    test("should check typeof value", () => {
      expect(enforcer.validate('a')).toEqual(false)
      expect(enforcer.validate(1)).toEqual(true)
    })
    test("should check if value is multiple of step", () => {
      expect(enforcer.validate(1.1)).toEqual(false)
    })
  })
  describe("coerce", () => {
    test("should apply default value on null value", () => {
      expect(enforcer.coerce(undefined)).toEqual(-1)
    })
    test("should apply typecasting to other values", () => {
      expect(enforcer.coerce('0')).toEqual(0)
    })
    test("should round to nearest multiple", () => {
      expect(enforcer.coerce(0.8)).toEqual(1)
    })
  })
})

describe("ObjectEnforcer", () => {
  const enforcer = new ObjectEnforcer()
  const defaultedEnforcer = new ObjectEnforcer({ defaulted: true })
  const wrappingEnforcer = new ObjectEnforcer(undefined, '_value')
  describe("validate", () => {
    test("should exclude arrays and nulls", () => {
      expect(enforcer.validate(null)).toEqual(false)
      expect(enforcer.validate([])).toEqual(false)
      expect(enforcer.validate({})).toEqual(true)
    })
  })
  describe("coerce", () => {
    test("should use JSON parse on strings", () => {
      expect(enforcer.coerce('{"x": 1}')).toEqual({x: 1})
    })
    test("should map defined array values", () => {
      expect(enforcer.coerce(['a', undefined, 'c'])).toEqual({ '0': 'a', '2': 'c' })
    })
    test("should wrap value if there's a value property specified", () => {
      expect(wrappingEnforcer.coerce('z')).toEqual({ _value: 'z' })
    })
    test("should apply default if no special handling applies", () => {
      expect(defaultedEnforcer.coerce(undefined)).toEqual({ defaulted: true })
    })
    test("should return empty object if there's no default or value property", () => {
      expect(enforcer.coerce('z')).toEqual({})
    })
  })
})

describe("StringEnforcer", () => {
  const enforcer = new StringEnforcer('', '_value')
  describe("validate", () => {
    test("should check typeof value", () => {
      expect(enforcer.validate(1)).toEqual(false)
      expect(enforcer.validate('1')).toEqual(true)
    })
  })
  describe("coerce", () => {
    test("should apply default value on null value", () => {
      expect(enforcer.coerce(undefined)).toEqual('')
    })
    test("should return undefined string if there's no default value", () => {
      const nonDefaulted = new StringEnforcer()
      expect(nonDefaulted.coerce(undefined)).toEqual('undefined')
    })
    test("should apply typecasting to other values", () => {
      expect(enforcer.coerce(0)).toEqual('0')
    })
    test("should unwrap using value property", () => {
      expect(enforcer.coerce({ _value: 'a' })).toEqual('a')
    })
  })
})

describe("StrictEqualityEnforcer", () => {
  const nullEnforcer = new StrictEqualityEnforcer(null)
  const coord = { x: 0, y: 1 }
  const coordEnforcer = new StrictEqualityEnforcer(coord)
  describe("validate", () => {
    test("should allow null check", () => {
      expect(nullEnforcer.validate(undefined)).toEqual(false)
      expect(nullEnforcer.validate(null)).toEqual(true)
    })
    test("should check for exact match", () => {
      expect(coordEnforcer.validate({ x: 0, y: 1 })).toEqual(false)
      expect(coordEnforcer.validate(coord)).toEqual(true)
    })
  })
  describe("coerce", () => {
    test("should allow null coercion", () => {
      expect(nullEnforcer.coerce(undefined)).toEqual(null)
    })
  })
})
