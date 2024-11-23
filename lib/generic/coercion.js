"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnyValueEnforcer = exports.StrictEqualityEnforcer = exports.StringEnforcer = exports.ObjectEnforcer = exports.SteppedNumberEnforcer = exports.NumberEnforcer = exports.BooleanEnforcer = exports.ArrayEnforcer = exports.ValueTypeEnforcer = void 0;
exports.mergeCoerceSteps = mergeCoerceSteps;
exports.echoValue = echoValue;
exports.isEquivalentTo = isEquivalentTo;
/**
 * Combines multiple coercion functions into a single function, pass the results through each in order.
 * @function
 * @template ValueType
 * @param {Array<Convert<ValueType>>} steps - callbacks to be merged
 * @returns {Convert<ValueType>}
 */
function mergeCoerceSteps(steps) {
    return function (value) {
        var converted = value;
        for (var _i = 0, steps_1 = steps; _i < steps_1.length; _i++) {
            var coerce = steps_1[_i];
            converted = coerce(converted);
        }
        return converted;
    };
}
/**
 * Wraps returning the provided value in a function
 * @function
 * @template T
 * @param {T} value - value to be returned
 * @returns {T}
 */
function echoValue(value) {
    return value;
}
/**
 * Provides validation and coercion to a specific javascript type.
 * @class
 * @template ValueType
 * @implements ValueConstraint<any, boolean, ValueType>
 */
var ValueTypeEnforcer = /** @class */ (function () {
    function ValueTypeEnforcer(typeName, defaultValue, valueProperty) {
        this.typeName = typeName;
        this.defaultValue = defaultValue;
        this.valueProperty = valueProperty;
    }
    ValueTypeEnforcer.prototype.validate = function (value) {
        return (typeof value) === this.typeName;
    };
    /**
     * Tries to extract a value as specified by the enforcer's property name.
     * @function
     * @param {any} value - value to be evaluated
     * @returns {any}
     */
    ValueTypeEnforcer.prototype.unwrap = function (value) {
        return (this.valueProperty != null &&
            typeof value === 'object' &&
            value != null &&
            this.valueProperty in value)
            ? value[this.valueProperty]
            : value;
    };
    return ValueTypeEnforcer;
}());
exports.ValueTypeEnforcer = ValueTypeEnforcer;
/**
 * Checks for and converts to an array.
 * @class
 * @extends ValueTypeEnforcer<any[]>
 */
var ArrayEnforcer = /** @class */ (function (_super) {
    __extends(ArrayEnforcer, _super);
    function ArrayEnforcer(defaultValue, valueProperty) {
        return _super.call(this, 'array', defaultValue, valueProperty) || this;
    }
    ArrayEnforcer.prototype.validate = function (value) {
        return Array.isArray(value);
    };
    ArrayEnforcer.prototype.coerce = function (value) {
        var unwrapped = this.unwrap(value);
        switch (typeof unwrapped) {
            case 'string': {
                try {
                    var parsed = JSON.parse(unwrapped);
                    if (Array.isArray(parsed))
                        return parsed;
                }
                catch (error) { }
                break;
            }
            case 'object': {
                if (unwrapped == null)
                    break;
                if (Array.isArray(unwrapped)) {
                    return unwrapped;
                }
                else {
                    var values = [];
                    for (var key in unwrapped) {
                        var index = Number(key);
                        if (!isNaN(index)) {
                            values[index] = unwrapped[key];
                        }
                    }
                    return values;
                }
            }
        }
        if (this.defaultValue != null && unwrapped == null) {
            return structuredClone(this.defaultValue);
        }
        return [unwrapped];
    };
    return ArrayEnforcer;
}(ValueTypeEnforcer));
exports.ArrayEnforcer = ArrayEnforcer;
/**
 * Checks for and converts to a boolean.
 * @class
 * @extends ValueTypeEnforcer<boolean>
 */
var BooleanEnforcer = /** @class */ (function (_super) {
    __extends(BooleanEnforcer, _super);
    function BooleanEnforcer(defaultValue, valueProperty) {
        return _super.call(this, 'boolean', defaultValue, valueProperty) || this;
    }
    BooleanEnforcer.prototype.coerce = function (value) {
        var unwrapped = this.unwrap(value);
        if (unwrapped == null && this.defaultValue != null) {
            return this.defaultValue;
        }
        return Boolean(unwrapped);
    };
    return BooleanEnforcer;
}(ValueTypeEnforcer));
exports.BooleanEnforcer = BooleanEnforcer;
/**
 * Checks for and converts to a number.
 * @class
 * @extends ValueTypeEnforcer<number>
 */
var NumberEnforcer = /** @class */ (function (_super) {
    __extends(NumberEnforcer, _super);
    function NumberEnforcer(defaultValue, valueProperty) {
        return _super.call(this, 'number', defaultValue, valueProperty) || this;
    }
    NumberEnforcer.prototype.coerce = function (value) {
        var _a;
        var unwrapped = this.unwrap(value);
        var num = Number(unwrapped);
        if (isNaN(num)) {
            return (_a = this.defaultValue) !== null && _a !== void 0 ? _a : 0;
        }
        return num;
    };
    return NumberEnforcer;
}(ValueTypeEnforcer));
exports.NumberEnforcer = NumberEnforcer;
/**
 * Applies multiplier constriants to a NumberEnforcer.
 * @class
 * @extends NumberEnforcer
 */
var SteppedNumberEnforcer = /** @class */ (function (_super) {
    __extends(SteppedNumberEnforcer, _super);
    function SteppedNumberEnforcer(defaultValue, step, valueProperty) {
        if (step === void 0) { step = 1; }
        var _this = _super.call(this, defaultValue, valueProperty) || this;
        _this.step = step;
        return _this;
    }
    SteppedNumberEnforcer.prototype.validate = function (value) {
        if (typeof value === 'number') {
            return this.step === 0 || value % this.step === 0;
        }
        return false;
    };
    SteppedNumberEnforcer.prototype.coerce = function (value) {
        var num = _super.prototype.coerce.call(this, value);
        return this.step !== 0
            ? Math.round(num / this.step) * this.step
            : num;
    };
    return SteppedNumberEnforcer;
}(NumberEnforcer));
exports.SteppedNumberEnforcer = SteppedNumberEnforcer;
/**
 * Checks for and converts to an object.
 * @class
 * @extends ValueTypeEnforcer<Record<string, any>>
 */
var ObjectEnforcer = /** @class */ (function (_super) {
    __extends(ObjectEnforcer, _super);
    function ObjectEnforcer(defaultValue, valueProperty) {
        return _super.call(this, 'object', defaultValue, valueProperty) || this;
    }
    ObjectEnforcer.prototype.validate = function (value) {
        return typeof value === 'object' && value != null && !Array.isArray(value);
    };
    ObjectEnforcer.prototype.coerce = function (value) {
        var _a;
        switch (typeof value) {
            case 'string': {
                try {
                    var parsed = JSON.parse(value);
                    if (this.validate(parsed))
                        return parsed;
                }
                catch (error) { }
                break;
            }
            case 'object': {
                if (value == null)
                    break;
                if (Array.isArray(value)) {
                    var values = {};
                    for (var i = 0; i < value.length; i++) {
                        var indexedValue = value[i];
                        if (indexedValue !== undefined) {
                            var key = String(i);
                            values[key] = indexedValue;
                        }
                    }
                    return values;
                }
                else {
                    return value;
                }
            }
        }
        if (this.defaultValue != null) {
            return structuredClone(this.defaultValue);
        }
        return this.valueProperty != null
            ? (_a = {}, _a[this.valueProperty] = value, _a) : {};
    };
    return ObjectEnforcer;
}(ValueTypeEnforcer));
exports.ObjectEnforcer = ObjectEnforcer;
/**
 * Checks for and converts to a string.
 * @class
 * @extends ValueTypeEnforcer<string>
 */
var StringEnforcer = /** @class */ (function (_super) {
    __extends(StringEnforcer, _super);
    function StringEnforcer(defaultValue, valueProperty) {
        return _super.call(this, 'string', defaultValue, valueProperty) || this;
    }
    StringEnforcer.prototype.coerce = function (value) {
        var unwrapped = this.unwrap(value);
        if (unwrapped == null && this.defaultValue != null) {
            return this.defaultValue;
        }
        switch (typeof unwrapped) {
            case 'string': {
                return unwrapped;
            }
            case 'object': {
                try {
                    return JSON.stringify(unwrapped);
                }
                catch (error) {
                    break;
                }
            }
        }
        return String(unwrapped);
    };
    return StringEnforcer;
}(ValueTypeEnforcer));
exports.StringEnforcer = StringEnforcer;
function isEquivalentTo(a, b) {
    if (typeof a === 'object' && a != null && typeof b === 'object' && b != null) {
        var checkedKeys = [];
        for (var key in a) {
            if (!isEquivalentTo(a[key], b[key])) {
                return false;
            }
            checkedKeys.push(key);
        }
        for (var key in b) {
            if (checkedKeys.includes(key))
                continue;
            if (!isEquivalentTo(a[key], b[key])) {
                return false;
            }
            checkedKeys.push(key);
        }
    }
    return a === b;
}
/**
 * Checks if an value is strictly equal to the target value.
 * @class
 * @template ValueType
 * @implements ValueConstraint<any, boolean, ValueType>
 */
var StrictEqualityEnforcer = /** @class */ (function () {
    function StrictEqualityEnforcer(value) {
        this.value = value;
    }
    StrictEqualityEnforcer.prototype.validate = function (value) {
        return value === this.value;
    };
    StrictEqualityEnforcer.prototype.coerce = function (value) {
        return this.value;
    };
    return StrictEqualityEnforcer;
}());
exports.StrictEqualityEnforcer = StrictEqualityEnforcer;
/**
 * Dummy enforcer that accepts any value and applied no changes on coercion.
 * @class
 * @implements ValueConstraint<any, boolean, any>
 */
var AnyValueEnforcer = /** @class */ (function () {
    function AnyValueEnforcer() {
    }
    AnyValueEnforcer.prototype.validate = function (value) {
        return true;
    };
    AnyValueEnforcer.prototype.coerce = function (value) {
        return value;
    };
    return AnyValueEnforcer;
}());
exports.AnyValueEnforcer = AnyValueEnforcer;
