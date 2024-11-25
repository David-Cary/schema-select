import {
  type ConversionFactory,
  type SchemaEnforcer,
  type UntypedObject,
  type ValueConstraint,
  AnyValueEnforcer,
  ArrayEnforcer,
  BooleanEnforcer,
  NumberEnforcer,
  SteppedNumberEnforcer,
  ObjectEnforcer,
  StrictEqualityEnforcer,
  StringEnforcer,
  echoValue,
  isEquivalentTo
} from '../generic/coercion'
import { type ErrorLog } from '../generic/validation'
import {
  type KeywordEnforcerContext,
  type KeywordError,
  type KeywordRule,
  type KeywordRulesEnforcer,
  TypeKeywordRule,
  KeywordEnforcerFork,
  KeywordValueEnforcer,
  SequentialKeywordEnforcerFactory
} from '../generic/keywords'

/**
 * Generates rules for resolving potential values of the JSON schema type keyword.
 * @function
 * @param {string} keyword - type keyword
 * @param {string | undefined} valueProperty - value property to be passed onto each subrule
 * @returns {Record<string, TypeKeywordRule>}
 */
function createJSONSchemaTypeRules (
  keyword = 'type',
  valueProperty?: string
): Record<string, TypeKeywordRule> {
  return {
    any: new TypeKeywordRule(
      keyword,
      new AnyValueEnforcer()
    ),
    array: new TypeKeywordRule(
      keyword,
      new ArrayEnforcer(undefined, valueProperty)
    ),
    boolean: new TypeKeywordRule(
      keyword,
      new BooleanEnforcer(false, valueProperty)
    ),
    integer: new TypeKeywordRule(
      keyword,
      new SteppedNumberEnforcer(0, 1, valueProperty)
    ),
    null: new TypeKeywordRule(
      keyword,
      new StrictEqualityEnforcer(null)
    ),
    number: new TypeKeywordRule(
      keyword,
      new NumberEnforcer(0, valueProperty)
    ),
    object: new TypeKeywordRule(
      keyword,
      new ObjectEnforcer(undefined, valueProperty)
    ),
    string: new TypeKeywordRule(
      keyword,
      new StringEnforcer('', valueProperty)
    )
  }
}

/**
 * Handles the JSON schema type keyword.
 * @class
 * @implements KeywordRule
 */
export class JSONSchemaTypeRule implements KeywordRule {
  keyword: string
  typeRules: Record<string, TypeKeywordRule>

  constructor (
    keyword = 'type',
    typeRules = createJSONSchemaTypeRules(keyword)
  ) {
    this.keyword = keyword
    this.typeRules = typeRules
  }

  getEnforcerFor (
    schema: UntypedObject,
    context?: KeywordEnforcerContext
  ): ValueConstraint<any, ErrorLog<KeywordError>> | undefined {
    const typeValue = schema[this.keyword]
    if (typeof typeValue === 'string') {
      const typeRule = this.typeRules[typeValue]
      return typeRule?.getEnforcerFor(schema, context)
    }
    if (Array.isArray(typeValue)) {
      const typeNames: string[] = typeValue.filter((item) => typeof item === 'string')
      const targetRules = typeNames
        .map((typeName) => this.typeRules[typeName])
        .filter((rule) => rule != null)
      const typeEnforcers = targetRules
        .map((rule) => rule.getEnforcerFor(schema, context))
        .filter((enforcer) => enforcer != null)
      const fork = new KeywordEnforcerFork(typeEnforcers, echoValue)
      return fork
    }
  }
}

/**
 * Handles the JSON schema const keyword.
 * @class
 * @implements KeywordRule
 */
export class JSONSchemaConstRule implements KeywordRule {
  keyword: string

  constructor (
    keyword = 'const'
  ) {
    this.keyword = keyword
  }

  getEnforcerFor (
    schema: UntypedObject,
    context?: KeywordEnforcerContext
  ): ValueConstraint<any, ErrorLog<KeywordError>> | undefined {
    const value = schema[this.keyword]
    if (value !== undefined) {
      return new KeywordValueEnforcer(
        this.keyword,
        value,
        (target: any) => isEquivalentTo(target, value),
        (target: any) => structuredClone(value),
        150
      )
    }
  }
}

/**
 * Accepts any value, returning an empty error log on validation.
 * @class
 * @implements SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>>
 */
export class JSONSchemaAnyValueEnforcer implements SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>> {
  schema = true

  validate (value: any): ErrorLog<Partial<KeywordError>> {
    return { errors: [] }
  }

  coerce (value: any): any {
    return value
  }
}

/**
 * Doesn't accept any value, returning an error on validation.
 * @class
 * @implements SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>>
 */
export class JSONSchemaNoValueEnforcer implements SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>> {
  schema = false

  validate (value: any): ErrorLog<Partial<KeywordError>> {
    return {
      errors: [
        { target: value }
      ]
    }
  }
}

/**
 * Allows either a javascript object or boolean value.
 * @type
 */
export type FlagOrObject = boolean | UntypedObject

/**
 * Provides values for true and false branches.
 * @interface
 */
export interface BooleanFork<T> {
  true: T
  false: T
}

/**
 * Doesn't accept any value, returning an error on validation.
 * @class
 * @implements ConversionFactory<FlagOrObject, SchemaEnforcer<FlagOrObject, ErrorLog<Partial<KeywordError>>>, KeywordEnforcerContext>
 * @param {BooleanFork<SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>>>} booleanEnforcers - provides enforcers for a true or false schema
 * @param {SequentialKeywordEnforcerFactory} keywordHandler - produces enforcers using json schema keyword rules
 */
export class JSONSchemaEnforcerFactory
implements ConversionFactory<
FlagOrObject,
SchemaEnforcer<FlagOrObject, ErrorLog<Partial<KeywordError>>>,
KeywordEnforcerContext
> {
  booleanEnforcers: BooleanFork<SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>>> = {
    true: new JSONSchemaAnyValueEnforcer(),
    false: new JSONSchemaNoValueEnforcer()
  }

  keywordHandler = new SequentialKeywordEnforcerFactory(
    [
      new JSONSchemaTypeRule(),
      new JSONSchemaConstRule()
    ]
  )

  process (
    schema: FlagOrObject,
    context: KeywordEnforcerContext<FlagOrObject> = { enforcers: {} }
  ): KeywordRulesEnforcer | SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>> {
    if (typeof schema === 'boolean') {
      return schema ? this.booleanEnforcers.true : this.booleanEnforcers.false
    }
    return this.keywordHandler.process(schema, context)
  }
}
