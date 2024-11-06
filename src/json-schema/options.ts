import type { ConversionFactory, SchemaEnforcer, UntypedObject } from '../generic/coercion'
import { type ErrorLog } from '../generic/validation'
import { type KeywordError } from '../generic/keywords'
import { SchemaOptionsFactory, KeyedSchemaLabeler } from '../generic/options'
import { type BooleanFork, type FlagOrObject, JSONSchemaEnforcerFactory } from './coercion'

/**
 * Standard list of JSON schema label properties in descending order of precedence.
 * @constant
 */
export const JSON_SCHEMA_LABEL_PROPERTIES: string[] = [
  'title',
  '$id',
  '$ref',
  'description',
  '$comment',
  'const',
  'format',
  'type'
]

/**
 * Template for converting an any type JSON schema into a list of subschemas.
 * @constant
 */
export const ANY_VALUE_JSON_SCHEMA = {
  title: 'ANY_VALUE_JSON_SCHEMA',
  oneOf: [
    { type: 'null' },
    { type: 'boolean' },
    { type: 'string' },
    { type: 'number' },
    { type: 'integer' },
    { type: 'array', items: true },
    { type: 'object', additionalProperties: true }
  ]
}

/**
 * Placeholder for schema equivalent to a false JSON schema.
 * @constant
 */
export const NO_VALUE_JSON_SCHEMA = {
  title: 'NO_VALUE_JSON_SCHEMA',
  allOf: [
    { type: 'boolean' },
    { type: 'string' }
  ]
}

/**
 * Generates label from a provided JSON schema value.
 * @class
 * @implements ConversionFactory<FlagOrObject, string>
 * @param {booleanLabels: BooleanFork<string>} booleanLabels - map of names for true / false schema
 * @param {KeyedSchemaLabeler} keyHandler - generates label by property values for a schema object
 */
export class JSONSchemaLabeler implements ConversionFactory<FlagOrObject, string> {
  booleanLabels: BooleanFork<string> = {
    true: ANY_VALUE_JSON_SCHEMA.title,
    false: NO_VALUE_JSON_SCHEMA.title
  }

  keyHandler: KeyedSchemaLabeler

  constructor (
    keyHandler: KeyedSchemaLabeler = new KeyedSchemaLabeler(JSON_SCHEMA_LABEL_PROPERTIES)
  ) {
    this.keyHandler = keyHandler
  }

  process (source: FlagOrObject): string {
    if (typeof source === 'boolean') {
      const label = source ? this.booleanLabels.true : this.booleanLabels.false
      return this.keyHandler.translate != null
        ? this.keyHandler.translate(label)
        : label
    }
    return this.keyHandler.process(source)
  }
}

/**
 * Returns a typeof string that differentiates between arrays, objects, and null values.
 * @function
 * @param {any} value - value to be evaluated
 * @returns {string}
 */
export function getExpandedTypeOf (value: any): string {
  const typeName = typeof value
  if (typeName === 'object') {
    if (Array.isArray(value)) {
      return 'array'
    } else if (value == null) {
      return 'null'
    }
  }
  return typeName
}

/**
 * Produces a list of potential subschema branches for a particular JSON schema.
 * @class
 * @implements ConversionFactory<FlagOrObject, FlagOrObject[]>
 * @param {booleanLabels: BooleanFork<UntypedObject[]>} booleanSchemas - map of subschemas for true / false schema
 * @param {string[]} subschemaKeys - list of keywords that can contain subschema branches
 */
export class JSONSchemaSplitter implements ConversionFactory<FlagOrObject, FlagOrObject[]> {
  booleanSchemas: BooleanFork<UntypedObject[]>
  subschemaKeys: string[]
  enumKey = 'enum'

  constructor (
    subschemaKeys: string[] = ['oneOf', 'anyOf'],
    booleanSchemas: BooleanFork<UntypedObject[]> = {
      true: structuredClone(ANY_VALUE_JSON_SCHEMA.oneOf),
      false: [NO_VALUE_JSON_SCHEMA]
    }
  ) {
    this.booleanSchemas = booleanSchemas
    this.subschemaKeys = subschemaKeys
  }

  process (source: FlagOrObject): FlagOrObject[] {
    if (typeof source === 'boolean') {
      return source ? this.booleanSchemas.true : this.booleanSchemas.false
    }
    if (this.enumKey !== '') {
      const enumValues = source[this.enumKey]
      if (Array.isArray(enumValues)) {
        return enumValues.map(item => ({
          const: item
        }))
      }
    }
    for (const keyword of this.subschemaKeys) {
      const keyValue = source[keyword]
      if (Array.isArray(keyValue)) {
        const filteredItems = keyValue.filter(
          (item) => (typeof item === 'boolean') ||
            (typeof item === 'object' && item != null && !Array.isArray(item))
        ) as FlagOrObject[]
        return filteredItems
      }
    }
    const typeValue = source.type
    if (Array.isArray(typeValue)) {
      const typeNames = typeValue.filter((item) => typeof item === 'string')
      const types = typeNames.map((type) => ({ type }))
      return types
    }
    return [source]
  }
}

/**
 * Generates labeled subschema options from a given JSON schema.
 * @class
 * @extends SchemaOptionsFactory<FlagOrObject, ErrorLog<Partial<KeywordError>>>
 */
export class JSONSchemaOptionsFactory extends SchemaOptionsFactory<FlagOrObject, ErrorLog<Partial<KeywordError>>> {
  constructor (
    enforcerFactory: ConversionFactory<
    FlagOrObject,
    SchemaEnforcer<FlagOrObject, ErrorLog<Partial<KeywordError>>>
    > = new JSONSchemaEnforcerFactory()
  ) {
    super(
      enforcerFactory,
      new JSONSchemaLabeler(),
      new JSONSchemaSplitter()
    )
  }
}
