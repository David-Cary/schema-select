import {
  type ConversionFactory,
  type SchemaEnforcer,
  type UntypedObject,
  type ValueConstraint,
  type ValueConstraintRule,
  mergeCoerceSteps
} from './coercion'
import {
  type Convert,
  type ErrorLog,
  ErrorLogValidationParser,
  mergeValidateSteps
} from './validation'

/**
 * Handles errors associated with a keyword / schema property.
 * @interface
 * @template From, To
 * @property {string} keyword - target schema property
 * @property {any} value - value that failed validation
 * @property {any} target - target schema value
 * @property {number | undefined} priority - relative importance of the target error
 * @property {Convert<From, To> | undefined} coerce - provideds a callback to fix the validation error
 */
export interface KeywordError<From = any, To = From> {
  keyword: string
  value: any
  target: any
  priority?: number
  coerce?: Convert<From, To>
}

/**
 * Converts value check and coercion to a validator that returns a keyword error log.
 * @class
 * @template From, To
 * @implements ValueConstraint<From, ErrorLog<KeywordError>, To>
 * @property {string} keyword - target schema property
 * @property {any} value - schema value for the target property
 * @property {Convert<From, boolean>} check - evaluates if the target value is valid
 * @property {Convert<From, To> | undefined} coerce - provideds a callback to fix failed validation
 * @property {number} priority - relative importance of the target error
 */
export class KeywordValueEnforcer<From = any, To = From>
implements ValueConstraint<From, ErrorLog<KeywordError>, To> {
  keyword: string
  value: any
  check: Convert<From, boolean>
  coerce?: Convert<From, To>
  priority: number

  constructor (
    keyword: string,
    value: any,
    check: Convert<From, boolean>,
    coerce?: Convert<From, To>,
    priority = 0
  ) {
    this.keyword = keyword
    this.value = value
    this.check = check
    this.coerce = coerce
    this.priority = priority
  }

  validate (target: From): ErrorLog<KeywordError> {
    return this.check(target)
      ? { errors: [] }
      : {
          errors: [
            {
              keyword: this.keyword,
              value: this.value,
              target,
              priority: this.priority,
              coerce: this.coerce
            }
          ]
        }
  }
}

/**
 * Adds support for error priority checking to error log validation parsing.
 * @class
 * @extends ErrorLogValidationParser<Partial<KeywordError>>
 */
export class KeywordErrorLogValidationParser
  extends ErrorLogValidationParser<Partial<KeywordError>> {
  rateValidity (value: ErrorLog<Partial<KeywordError>>): number {
    if (value.errors.length > 0) {
      let maxErrorPriority = 0
      for (const error of value.errors) {
        if (error.priority != null && error.priority > maxErrorPriority) {
          maxErrorPriority = error.priority
        }
      }
      return -maxErrorPriority
    }
    return 1
  }
}

/**
 * Aplies the first matching constraint within the provided set.
 * @class
 * @template From, To
 * @implements ValueConstraint<any, boolean, ValueType>
 * @property {Array<ValueConstraint<From, ErrorLog<KeywordError>, To>>} branches - constraints to be used
 * @property {Convert<From, To>} defaultCoerce - coercion to apply no branches apply
 */
export class KeywordEnforcerFork<From = any, To = From>
implements ValueConstraint<From, ErrorLog<KeywordError>, To> {
  branches: Array<ValueConstraint<From, ErrorLog<KeywordError>, To>>
  defaultCoerce: Convert<From, To>

  constructor (
    branches: Array<ValueConstraint<From, ErrorLog<KeywordError>, To>>,
    defaultCoerce: Convert<From, To>
  ) {
    this.branches = branches
    this.defaultCoerce = defaultCoerce
  }

  coerce (
    value: From
  ): To {
    const validation = this.validate(value)
    const error = validation.errors[0]
    return error?.coerce != null
      ? error.coerce(value)
      : this.defaultCoerce(value)
  }

  /**
   * Gets the highest priority error in the provided set.
   * @function
   * @param {KeywordError[]} errors - errors to be evaluated
   * @returns {KeywordError | undefined}
   */
  getHighestPriorityError (
    errors: KeywordError[]
  ): KeywordError | undefined {
    let match: KeywordError | undefined
    const highestPriority = Number.NEGATIVE_INFINITY
    for (const error of errors) {
      const priority = error.priority ?? 0
      if (match == null || priority > highestPriority) {
        match = error
      }
    }
    return match
  }

  validate (target: From): ErrorLog<KeywordError> {
    let result: ErrorLog<KeywordError> | undefined
    let lowestPriority = Number.POSITIVE_INFINITY
    for (const branch of this.branches) {
      const validation = branch.validate(target)
      if (validation.errors.length < 1) {
        return validation
      }
      const priority = this.getHighestPriorityError(validation.errors)?.priority ?? 0
      if (result == null || priority < lowestPriority) {
        result = validation
        lowestPriority = priority
      }
    }
    return result ?? { errors: [] }
  }
}

/**
 * Wrapper for a mapping of constraints by associated keywords.
 * @interface
 * @template From, To
 * @property {Record<string, ValueConstraint<From, ErrorLog<KeywordError>, To>>} enforcers - constraint map
 */
export interface KeywordEnforcerContext<From = any, To = From> {
  enforcers: Record<string, ValueConstraint<From, ErrorLog<KeywordError>, To>>
}

/**
 * Generates a constraint if the target schema matches the provided keyword.
 * @interface
 * @template From, To
 * @property {string} keyword - associated schema property
 * @extends ValueConstraintRule<UntypedObject, KeywordEnforcerContext<From, To>, From, ErrorLog<KeywordError>, To>
 */
export interface KeywordRule<From = any, To = From> extends ValueConstraintRule<
UntypedObject,
KeywordEnforcerContext<From, To>,
From,
ErrorLog<KeywordError>,
To
> {
  keyword: string
  getEnforcerFor: (
    source: UntypedObject,
    context?: KeywordEnforcerContext<From, To>
  ) => ValueConstraint<From, ErrorLog<KeywordError>, To> | undefined
}

/**
 * Provides a schema enforcer for keywords with subenforcers attached.
 * @type
 */
export type KeywordRulesEnforcer<From = any, To = From> = SchemaEnforcer<
UntypedObject,
ErrorLog<KeywordError>,
To
> & KeywordEnforcerContext<From, To>

/**
 * Supports chaining multiple keyword rules into a single rule set.
 * @class
 * @template From, To
 * @implements ConversionFactory<UntypedObject, SchemaEnforcer<UntypedObject, ErrorLog<KeywordError>, To>, KeywordEnforcerContext<From, To>>
 * @param {Array<KeywordRule<From, To>>} rules - list of rules to be checked
 * @param {ErrorLogValidationParser} validationParser - provides handling for error logs
 */
export class SequentialKeywordEnforcerFactory<From = any, To = From>
implements ConversionFactory<
UntypedObject,
SchemaEnforcer<UntypedObject, ErrorLog<KeywordError>, To>,
KeywordEnforcerContext<From, To>
> {
  rules: Array<KeywordRule<From, To>>
  validationParser = new ErrorLogValidationParser()

  constructor (
    rules: Array<KeywordRule<From, To>> = []
  ) {
    this.rules = rules
  }

  process (
    schema: UntypedObject,
    context: KeywordEnforcerContext<From, To> = { enforcers: {} }
  ): KeywordRulesEnforcer<From, To> {
    const enforcers: Record<string, ValueConstraint<From, ErrorLog<KeywordError>, To>> = {}
    const validateQueue: Array<Convert<any, ErrorLog<KeywordError>>> = []
    const coerceQueue: Convert[] = []
    for (const rule of this.rules) {
      const ruleEnforcer = rule.getEnforcerFor(schema, context)
      if (ruleEnforcer != null) {
        validateQueue.push((value: From) => ruleEnforcer.validate(value))
        if (ruleEnforcer.coerce != null) {
          const coerce = ruleEnforcer.coerce
          coerceQueue.push((value: From) => coerce(value))
        }
        enforcers[rule.keyword] = ruleEnforcer
      }
    }
    const enforcer: KeywordRulesEnforcer<From, To> = {
      schema,
      validate: mergeValidateSteps(validateQueue, this.validationParser),
      enforcers
    }
    if (coerceQueue.length > 0) {
      enforcer.coerce = mergeCoerceSteps(coerceQueue)
    }
    return enforcer
  }
}

/**
 * Supports chaining multiple keyword rules into a single rule set.
 * @class
 * @template ValueType
 * @extends KeywordValueEnforcer<any, ValueType>
 * @param {Convert<any, ValueType>} coerceType - converts value to the target type
 * @param {KeywordRulesEnforcer<ValueType> | undefined} rulesEnforcer - applies additional constraints to the target value
 */
export class TypeKeywordEnforcer<ValueType = any> extends KeywordValueEnforcer<any, ValueType> {
  coerceType: Convert<any, ValueType>
  rulesEnforcer?: KeywordRulesEnforcer<ValueType>

  constructor (
    keyword: string,
    value: any,
    check: Convert<any, boolean>,
    coerceType: Convert<any, ValueType>,
    rulesEnforcer?: KeywordRulesEnforcer<ValueType>,
    priority = 0
  ) {
    super(keyword, value, check, undefined, priority)
    this.coerceType = coerceType
    this.coerce = (value: any) => {
      const typedValue = this.coerceType(value)
      return this.rulesEnforcer?.coerce != null
        ? this.rulesEnforcer.coerce(typedValue)
        : typedValue
    }
  }

  validate (target: any): ErrorLog<KeywordError> {
    const typeCheck = super.validate(target)
    if (this.rulesEnforcer != null && typeCheck.errors.length < 1) {
      const rulesCheck = this.rulesEnforcer.validate(target as ValueType)
      return rulesCheck
    }
    return typeCheck
  }
}

/**
 * Supports chaining multiple keyword rules into a single rule set.
 * @class
 * @template ValueType
 * @implements KeywordRule
 * @param {string} keyword - type keyword for the target schema
 * @param {Required<ValueConstraint<any, boolean, ValueType>>} typeEnforcer - handles type validation and coercion
 * @param {SequentialKeywordEnforcerFactory<ValueType> | undefined} typedKeywords - provides subconstraints for the keyword
 */
export class TypeKeywordRule<ValueType = any> implements KeywordRule {
  keyword: string
  typeEnforcer: Required<ValueConstraint<any, boolean, ValueType>>
  typedKeywords?: SequentialKeywordEnforcerFactory<ValueType>

  constructor (
    keyword: string,
    typeEnforcer: Required<ValueConstraint<any, boolean, ValueType>>,
    typedKeywords?: SequentialKeywordEnforcerFactory<ValueType>
  ) {
    this.keyword = keyword
    this.typeEnforcer = typeEnforcer
    this.typedKeywords = typedKeywords
  }

  getEnforcerFor (
    schema: UntypedObject,
    context: KeywordEnforcerContext<ValueType> = { enforcers: {} }
  ): KeywordValueEnforcer | undefined {
    const typedEnforcer = this.typedKeywords?.process(schema, context)
    const enforcer = new TypeKeywordEnforcer(
      this.keyword,
      schema[this.keyword],
      (value) => this.typeEnforcer.validate(value),
      (value) => this.typeEnforcer.coerce(value),
      typedEnforcer,
      100
    )
    return enforcer
  }
}
