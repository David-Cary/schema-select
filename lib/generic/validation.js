"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorLogValidationParser = exports.BooleanValidationParser = void 0;
exports.mergeValidateSteps = mergeValidateSteps;
/**
 * Handles treating booleans as validation values.
 * @class
 * @implements ValidationParser
 */
var BooleanValidationParser = /** @class */ (function () {
    function BooleanValidationParser() {
    }
    BooleanValidationParser.prototype.isValid = function (value) {
        return value;
    };
    BooleanValidationParser.prototype.getValid = function () {
        return true;
    };
    return BooleanValidationParser;
}());
exports.BooleanValidationParser = BooleanValidationParser;
/**
 * Handles checking if an error log indicates valid results.
 * @class
 * @implements ValidationParser<ErrorLog<any>>
 */
var ErrorLogValidationParser = /** @class */ (function () {
    function ErrorLogValidationParser() {
    }
    ErrorLogValidationParser.prototype.isValid = function (value) {
        return value.errors.length < 1;
    };
    ErrorLogValidationParser.prototype.getValid = function () {
        return { errors: [] };
    };
    return ErrorLogValidationParser;
}());
exports.ErrorLogValidationParser = ErrorLogValidationParser;
/**
 * Combines multiple validation functions into a single function, returning the first falsey validation.
 * @function
 * @template ValidationType
 * @param {Array<Convert<any, ValidationType>>} steps - callbacks to be merged
 * @param {ValidationParser<ValidationType>} validationParser - evaluates validation results
 * @returns {Convert<any, ValidationType>}
 */
function mergeValidateSteps(steps, validationParser) {
    return function (value) {
        for (var _i = 0, steps_1 = steps; _i < steps_1.length; _i++) {
            var validate = steps_1[_i];
            var validation = validate(value);
            if (!validationParser.isValid(validation)) {
                return validation;
            }
        }
        return validationParser.getValid();
    };
}
