import {
  JSONSchemaEnforcerFactory,
  JSONSchemaOptionsFactory,
  JSONSchemaLabeler,
  JSONSchemaSplitter,
  SchemaOptionsFactory,
  ErrorLog,
  KeywordError,
  ANY_VALUE_JSON_SCHEMA
} from "../src/index"

describe("JSONSchemaEnforcerFactory", () => {
  const enforcerFactory = new JSONSchemaEnforcerFactory()
  describe("process", () => {
    test("should return autovalidating enforcer for true schema", () => {
      const enforcer = enforcerFactory.process(true)
      expect(enforcer.validate(1).errors.length).toEqual(0)
    })
    test("should return nonvalidating enforcer for false schema", () => {
      const enforcer = enforcerFactory.process(false)
      expect(enforcer.validate(1)).toEqual({
        errors: [{ target: 1 }]
      })
    })
    test("should return boolean enforcer for type keyword of boolean", () => {
      const enforcer = enforcerFactory.process({ type: 'boolean' })
      const error = enforcer.validate(1).errors[0]
      expect(error).toEqual(expect.objectContaining({
        keyword: 'type',
        value: 'boolean',
        target: 1
      }))
      expect(error.coerce?.(1)).toBe(true)
    })
  })
})

describe("JSONSchemaOptionsFactory", () => {
  const optionsFactory = new JSONSchemaOptionsFactory()
  describe("process", () => {
    test("should provide options for all standard types for a true schema", () => {
      const options = optionsFactory.process(true)
      const optionLabels = options.map(item => item.label)
      const typeLabels = ANY_VALUE_JSON_SCHEMA.oneOf.map(item => item.type)
      expect(optionLabels).toEqual(typeLabels)
    })
    test("should be able to generate enum subschemas", () => {
      const options = optionsFactory.process({ enum: ['a', 1] })
      expect(options[0].label).toEqual('a')
      expect(options[0].value.schema).toEqual({ const: 'a' })
      expect(options[0].value.coerce?.(null)).toEqual('a')
    })
  })
  describe("adding rules", () => {
    const enforcerFactory = optionsFactory.enforcerFactory as JSONSchemaEnforcerFactory
    enforcerFactory.keywordHandler.rules.push(
      {
        keyword: 'not',
        getEnforcerFor: (source: Record<string, any>) => {
          if ('not' in source) {
            const enforcer = enforcerFactory.process(source.not)
            return {
              schema: source,
              validate: (value) => {
                const result = enforcer.validate(value)
                return result.errors.length <= 0
                  ? {
                    errors: [
                      {
                        keyword: 'not',
                        value: source.not,
                        target: value
                      }
                    ]
                  }
                  : { errors: [] }
              }
            }
          }
        }
      }
    )
    const enforcer = enforcerFactory.process({ not: { type: 'number' } })
    expect(enforcer.validate(false).errors.length).toBe(0)
    expect(enforcer.validate(0).errors.length).toBe(1)
  })
})

describe("custom SchemaOptionsFactory", () => {
  const optionsFactory = new SchemaOptionsFactory(
    {
      process: (schema: any) => {
        return {
          schema,
          validate: (value: any) => Boolean(value)
        }
      }
    },
    new JSONSchemaLabeler(),
    new JSONSchemaSplitter()
  )
  describe("process", () => {
    test("should generate options", () => {
      const options = optionsFactory.process({ enum: [true, false] })
      const optionLabels = options.map(item => item.label)
      expect(optionLabels).toEqual(['true', 'false'])
    })
  })
})
