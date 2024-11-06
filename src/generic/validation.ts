/**
 * Generic type for conversion functions.
 * @type
 */
export type Convert<From = any, To = From> = (source: From) => To

/**
 * Handler for reading whether of not a given validation object is reporting valid.
 * @interface
 */
export interface ValidationParser<ValidationType = boolean> {
  /**
   * Check if the validation is true.
   * @function
   * @param {ValidationType} source - value to be validated
   * @returns {boolean}
   */
  isValid: Convert<ValidationType, boolean>
  /**
   * Generates a validation object that evaluates as true.
   * @function
   * @returns {ValidationType}
   */
  getValid: () => ValidationType
}

/**
 * Handles treating booleans as validation values.
 * @class
 * @implements ValidationParser
 */
export class BooleanValidationParser implements ValidationParser {
  isValid (value: boolean): boolean {
    return value
  }

  getValid (): boolean {
    return true
  }
}

/**
 * Object wrapper for a list of errors.
 * @interface
 * @template ErrorType
 * @property {ErrorType[]} errors - list of errors encountered
 */
export interface ErrorLog<ErrorType = string> {
  errors: ErrorType[]
}

/**
 * Handles checking if an error log indicates valid results.
 * @class
 * @implements ValidationParser<ErrorLog<any>>
 */
export class ErrorLogValidationParser
implements ValidationParser<ErrorLog<any>> {
  isValid (value: ErrorLog<any>): boolean {
    return value.errors.length < 1
  }

  getValid (): ErrorLog<any> {
    return { errors: [] }
  }
}

/**
 * Combines multiple validation functions into a single function, returning the first falsey validation.
 * @function
 * @template ValidationType
 * @param {Array<Convert<any, ValidationType>>} steps - callbacks to be merged
 * @param {ValidationParser<ValidationType>} validationParser - evaluates validation results
 * @returns {Convert<any, ValidationType>}
 */
export function mergeValidateSteps<ValidationType = boolean> (
  steps: Array<Convert<any, ValidationType>>,
  validationParser: ValidationParser<ValidationType>
): Convert<any, ValidationType> {
  return (value: any) => {
    for (const validate of steps) {
      const validation = validate(value)
      if (!validationParser.isValid(validation)) {
        return validation
      }
    }
    return validationParser.getValid()
  }
}