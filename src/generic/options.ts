import type { ConversionFactory, SchemaEnforcer, UntypedObject } from './coercion'
import type { Convert, ValidationParser } from './validation'

export interface LabeledValue<T> {
  label: string
  value: T
}

/**
 * Generates labeled options from a provided schema.
 * @class
 * @template SchemaType, ValidationType
 * @implements ConversionFactory<SchemaType, Array<LabeledValue<SchemaEnforcer<SchemaType, ValidationType>>>>
 * @param {ConversionFactory<SchemaType, string>} labelFactory - produces labels for each subschema
 * @param {ConversionFactory<SchemaType, SchemaEnforcer<SchemaType, ValidationType>>} enforcerFactory - produces enforcers for each subschema
 * @param {ConversionFactory<SchemaType, SchemaType[]> | undefined} splitter - converts schema to subschema list
 */
export class SchemaOptionsFactory<SchemaType = any, ValidationType = boolean>
implements ConversionFactory<SchemaType, Array<LabeledValue<SchemaEnforcer<SchemaType, ValidationType>>>> {
  labelFactory: ConversionFactory<SchemaType, string>
  enforcerFactory: ConversionFactory<SchemaType, SchemaEnforcer<SchemaType, ValidationType>>
  splitter?: ConversionFactory<SchemaType, SchemaType[]>

  constructor (
    enforcerFactory: ConversionFactory<SchemaType, SchemaEnforcer<SchemaType, ValidationType>>,
    labelFactory: ConversionFactory<SchemaType, string>,
    splitter?: ConversionFactory<SchemaType, SchemaType[]>
  ) {
    this.splitter = splitter
    this.labelFactory = labelFactory
    this.enforcerFactory = enforcerFactory
  }

  /**
   * Generates labeled options from a provided schema.
   * @function
   * @param {SchemaType} source - schema to be converted
   * @returns {Array<LabeledValue<SchemaEnforcer<SchemaType, ValidationType>>>}
   */
  process (
    schema: SchemaType
  ): Array<LabeledValue<SchemaEnforcer<SchemaType, ValidationType>>> {
    const sources = this.splitter != null ? this.splitter.process(schema) : [schema]
    const options = sources.map(
      (source) => ({
        label: this.labelFactory.process(source),
        value: this.enforcerFactory.process(source)
      })
    )
    return options
  }
}

/**
 * Generates label from a provided schema using a prioritized property list.
 * @class
 * @template SchemaType, ValidationType
 * @implements ConversionFactory<UntypedObject, string>
 * @param {string[]} keywords - list of properties to check in descending order of precedence
 * @param {string} delimiter - characters to insert between multiple sublabels
 * @param {Convert<string> | undefined} translate - text translation callback
 * @param {Convert<any, string>} stringify - forces untyped values to strings
 */
export class KeyedSchemaLabeler implements ConversionFactory<UntypedObject, string> {
  keywords: string[]
  delimiter: string
  translate?: Convert<string>
  stringify: Convert<any, string> = String

  constructor (
    keywords: string[] = [],
    delimiter = '/',
    translate?: Convert<string>
  ) {
    this.keywords = keywords
    this.delimiter = delimiter
    this.translate = translate
  }

  /**
   * Generates label from a provided schema.
   * @function
   * @param {UntypedObject} source - schema to be converted
   * @returns {string}
   */
  process (source: UntypedObject): string {
    for (const keyword of this.keywords) {
      if (keyword in source) {
        const value = source[keyword]
        if (Array.isArray(value)) {
          const itemNames = value.map((item) => this.stringify(item))
          if (itemNames.length < 1) continue
          const translations = this.translate != null
            ? itemNames.map((name) => (this.translate as Convert<string>)(name))
            : itemNames
          const text = translations.join(this.delimiter)
          return text
        } else {
          const text = this.stringify(value)
          return this.translate != null ? this.translate(text) : text
        }
      }
    }
    return this.stringify(source)
  }
}

/**
 * Handles generating and evaluating schema options.
 * @class
 * @template SchemaType, ValidationType
 * @param {SchemaOptionsFactory<SchemaType, ValidationType>} optionsFactory - handles option list creation
 * @param {ValidationParser<ValidationType>} validationParser - handles validating options
 */
export class SchemaOptionsParser<SchemaType = any, ValidationType = boolean> {
  optionsFactory: SchemaOptionsFactory<SchemaType, ValidationType>
  validationParser: ValidationParser<ValidationType>

  constructor (
    optionsFactory: SchemaOptionsFactory<SchemaType, ValidationType>,
    validationParser: ValidationParser<ValidationType>
  ) {
    this.optionsFactory = optionsFactory
    this.validationParser = validationParser
  }

  /**
   * Generates label from a provided schema.
   * @function
   * @param {UntypedObject} source - schema to be converted
   * @returns {string}
   */
  getOptionsFor (
    schema: SchemaType
  ): Array<LabeledValue<SchemaEnforcer<SchemaType, ValidationType>>> {
    return this.optionsFactory.process(schema)
  }

  /**
   * Generates label from a provided schema.
   * @function
   * @param {UntypedObject} source - schema to be converted
   * @returns {string}
   */
  getMostValidOption (
    options: Array<LabeledValue<SchemaEnforcer<SchemaType, ValidationType>>>,
    value: any
  ): LabeledValue<SchemaEnforcer<SchemaType, ValidationType>> | undefined {
    let bestOption: LabeledValue<SchemaEnforcer<SchemaType, ValidationType>> | undefined
    let maxValidity = Number.NEGATIVE_INFINITY
    for (const option of options) {
      const validation = option.value.validate(value)
      const validity = this.validationParser.rateValidity(validation)
      if (validity > maxValidity) {
        bestOption = option
        maxValidity = validity
      }
    }
    return bestOption
  }
}
