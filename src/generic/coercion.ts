import { type Convert } from './validation'

/**
 * Stand in for untyped javascript objects.
 * @type
 */
export type UntypedObject = Record<string, any>

/**
 * Combines multiple coercion functions into a single function, pass the results through each in order.
 * @function
 * @template ValueType
 * @param {Array<Convert<ValueType>>} steps - callbacks to be merged
 * @returns {Convert<ValueType>}
 */
export function mergeCoerceSteps<ValueType = any> (
  steps: Array<Convert<ValueType>>
): Convert<ValueType> {
  return (value: ValueType) => {
    let converted = value
    for (const coerce of steps) {
      converted = coerce(converted)
    }
    return converted
  }
}

/**
 * Provides validation and potential coercion handing.
 * @interface
 * @template SourceType, ValidationType, ValueType
 */
export interface ValueConstraint<
  SourceType = any,
  ValidationType = boolean,
  ValueType = SourceType
> {
  /**
   * Check if the target value follows this constraint.
   * @function
   * @param {SourceType} source - value to be validated
   * @returns {ValidationType}
   */
  validate: Convert<SourceType, ValidationType>
  /**
   * Returns a version of the provided value that adheres to this constraint.
   * @function
   * @param {SourceType} source - value to be converted
   * @returns {ValueType}
   */
  coerce?: Convert<SourceType, ValueType>
}

/**
 * Attaches a schema to it's corresponding validation and coercion callbacks.
 * @interface
 * @template SchemaType, ValidationType, ValueType
 * @property {SchemaType} schema - schema used to construct the constraint
 */
export interface SchemaEnforcer<
  SchemaType = any,
  ValidationType = boolean,
  ValueType = any
> extends ValueConstraint<any, ValidationType, ValueType> {
  schema: SchemaType
}

/**
 * Provides validation and potential coercion handing.
 * @interface
 * @template SourceType, OutputType, ContextType
 */
export interface ConversionFactory<
  SourceType = any,
  OutputType = SourceType,
  ContextType = any
> {
  /**
   * Returns a version of the provided value that adheres to this constraint.
   * @function
   * @param {SourceType} source - value to be converted
   * @param {ContextType} context - data and options to be used in the conversion process
   * @returns {OutputType}
   */
  process: (source: SourceType, context?: ContextType) => OutputType
}

/**
 * Generates constaints for schemas that meet certain criteria.
 * @interface
 * @template SchemaType, ContextType, InputType, ValidationType, OutputType
 */
export interface ValueConstraintRule<
  SchemaType = any,
  ContextType = any,
  InputType = any,
  ValidationType = boolean,
  OutputType = InputType
> {
  /**
   * Returns a constraint if the schema meets the rule's criteria.
   * @function
   * @param {SchemaType} source - value to be converted
   * @param {ContextType} context - data and options to be used in the conversion process
   * @returns {ValueConstraint<InputType, ValidationType, OutputType> | undefined}
   */
  getEnforcerFor: (
    schema: SchemaType,
    context?: ContextType
  ) => ValueConstraint<InputType, ValidationType, OutputType> | undefined
}

/**
 * Wraps returning the provided value in a function
 * @function
 * @template T
 * @param {T} value - value to be returned
 * @returns {T}
 */
export function echoValue<T = any> (
  value: T
): T {
  return value
}

/**
 * Provides validation and coercion to a specific javascript type.
 * @class
 * @template ValueType
 * @implements ValueConstraint<any, boolean, ValueType>
 */
export class ValueTypeEnforcer<ValueType = any> implements ValueConstraint<any, boolean, ValueType> {
  readonly typeName: string
  defaultValue?: ValueType
  valueProperty?: string

  constructor (
    typeName: string,
    defaultValue?: ValueType,
    valueProperty?: string
  ) {
    this.typeName = typeName
    this.defaultValue = defaultValue
    this.valueProperty = valueProperty
  }

  validate (value: any): boolean {
    return (typeof value) as string === this.typeName
  }

  /**
   * Tries to extract a value as specified by the enforcer's property name.
   * @function
   * @param {any} value - value to be evaluated
   * @returns {any}
   */
  unwrap (value: any): any {
    return (
      this.valueProperty != null &&
        typeof value === 'object' &&
        value != null &&
        this.valueProperty in value
    )
      ? value[this.valueProperty]
      : value
  }
}

/**
 * Checks for and converts to an array.
 * @class
 * @extends ValueTypeEnforcer<any[]>
 */
export class ArrayEnforcer extends ValueTypeEnforcer<any[]> {
  constructor (
    defaultValue?: any[],
    valueProperty?: string
  ) {
    super('array', defaultValue, valueProperty)
  }

  validate (value: any): boolean {
    return Array.isArray(value)
  }

  coerce (value: any): any[] {
    const unwrapped = this.unwrap(value)
    switch (typeof unwrapped) {
      case 'string': {
        try {
          const parsed = JSON.parse(unwrapped)
          if (Array.isArray(parsed)) return parsed
        } catch (error) {}
        break
      }
      case 'object': {
        if (unwrapped == null) break
        if (Array.isArray(unwrapped)) {
          return unwrapped
        } else {
          const values: any[] = []
          for (const key in unwrapped) {
            const index = Number(key)
            if (!isNaN(index)) {
              values[index] = unwrapped[key]
            }
          }
          return values
        }
      }
    }
    if (this.defaultValue != null && unwrapped == null) {
      return structuredClone(this.defaultValue)
    }
    return [unwrapped]
  }
}

/**
 * Checks for and converts to a boolean.
 * @class
 * @extends ValueTypeEnforcer<boolean>
 */
export class BooleanEnforcer extends ValueTypeEnforcer<boolean> {
  constructor (
    defaultValue?: boolean,
    valueProperty?: string
  ) {
    super('boolean', defaultValue, valueProperty)
  }

  coerce (value: any): boolean {
    const unwrapped = this.unwrap(value)
    if (unwrapped == null && this.defaultValue != null) {
      return this.defaultValue
    }
    return Boolean(unwrapped)
  }
}

/**
 * Checks for and converts to a number.
 * @class
 * @extends ValueTypeEnforcer<number>
 */
export class NumberEnforcer extends ValueTypeEnforcer<number> {
  constructor (
    defaultValue?: number,
    valueProperty?: string
  ) {
    super('number', defaultValue, valueProperty)
  }

  coerce (value: any): number {
    const unwrapped = this.unwrap(value)
    const num = Number(unwrapped)
    if (isNaN(num)) {
      return this.defaultValue ?? 0
    }
    return num
  }
}

/**
 * Applies multiplier constriants to a NumberEnforcer.
 * @class
 * @extends NumberEnforcer
 */
export class SteppedNumberEnforcer extends NumberEnforcer {
  step: number

  constructor (
    defaultValue?: number,
    step = 1,
    valueProperty?: string
  ) {
    super(defaultValue, valueProperty)
    this.step = step
  }

  validate (value: any): boolean {
    if (typeof value === 'number') {
      return this.step === 0 || value % this.step === 0
    }
    return false
  }

  coerce (value: any): number {
    const num = super.coerce(value)
    return this.step !== 0
      ? Math.round(num / this.step) * this.step
      : num
  }
}

/**
 * Checks for and converts to an object.
 * @class
 * @extends ValueTypeEnforcer<Record<string, any>>
 */
export class ObjectEnforcer extends ValueTypeEnforcer<Record<string, any>> {
  constructor (
    defaultValue?: Record<string, any>,
    valueProperty?: string
  ) {
    super('object', defaultValue, valueProperty)
  }

  validate (value: any): boolean {
    return typeof value === 'object' && value != null && !Array.isArray(value)
  }

  coerce (value: any): Record<string, any> {
    switch (typeof value) {
      case 'string': {
        try {
          const parsed = JSON.parse(value)
          if (this.validate(parsed)) return parsed
        } catch (error) {}
        break
      }
      case 'object': {
        if (value == null) break
        if (Array.isArray(value)) {
          const values: Record<string, any> = {}
          for (let i = 0; i < value.length; i++) {
            const indexedValue = value[i]
            if (indexedValue !== undefined) {
              const key = String(i)
              values[key] = indexedValue
            }
          }
          return values
        } else {
          return value
        }
      }
    }
    if (this.defaultValue != null) {
      return structuredClone(this.defaultValue)
    }
    return this.valueProperty != null
      ? { [this.valueProperty]: value }
      : {}
  }
}

/**
 * Checks for and converts to a string.
 * @class
 * @extends ValueTypeEnforcer<string>
 */
export class StringEnforcer extends ValueTypeEnforcer<string> {
  constructor (
    defaultValue?: string,
    valueProperty?: string
  ) {
    super('string', defaultValue, valueProperty)
  }

  coerce (value: any): string {
    const unwrapped = this.unwrap(value)
    if (typeof unwrapped === 'string') return unwrapped
    if (unwrapped == null && this.defaultValue != null) {
      return this.defaultValue
    }
    try {
      return JSON.stringify(unwrapped)
    } catch (error) {
      return String(unwrapped)
    }
  }
}

export function isEquivalentTo (a: any, b: any): boolean {
  if (typeof a === 'object' && a != null && typeof b === 'object' && b != null) {
    const checkedKeys: any[] = []
    for (const key in a) {
      if (!isEquivalentTo(a[key], b[key])) {
        return false
      }
      checkedKeys.push(key)
    }
    for (const key in b) {
      if (checkedKeys.includes(key)) continue
      if (!isEquivalentTo(a[key], b[key])) {
        return false
      }
      checkedKeys.push(key)
    }
  }
  return a === b
}

/**
 * Checks if an value is strictly equal to the target value.
 * @class
 * @template ValueType
 * @implements ValueConstraint<any, boolean, ValueType>
 */
export class StrictEqualityEnforcer<ValueType = any> implements ValueConstraint<any, boolean, ValueType> {
  value: ValueType

  constructor (
    value: ValueType
  ) {
    this.value = value
  }

  validate (value: any): boolean {
    return value === this.value
  }

  coerce (value: any): ValueType {
    return this.value
  }
}

/**
 * Dummy enforcer that accepts any value and applied no changes on coercion.
 * @class
 * @implements ValueConstraint<any, boolean, any>
 */
export class AnyValueEnforcer implements ValueConstraint<any, boolean, any> {
  validate (value: any): boolean {
    return true
  }

  coerce (value: any): any {
    return value
  }
}
