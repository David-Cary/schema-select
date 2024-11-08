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
exports.TypeKeywordRule = exports.TypeKeywordEnforcer = exports.SequentialKeywordEnforcerFactory = exports.KeywordEnforcerFork = exports.KeywordErrorLogValidationParser = exports.KeywordValueEnforcer = void 0;
var coercion_1 = require("./coercion");
var validation_1 = require("./validation");
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
var KeywordValueEnforcer = /** @class */ (function () {
    function KeywordValueEnforcer(keyword, value, check, coerce, priority) {
        if (priority === void 0) { priority = 0; }
        this.keyword = keyword;
        this.value = value;
        this.check = check;
        this.coerce = coerce;
        this.priority = priority;
    }
    KeywordValueEnforcer.prototype.validate = function (target) {
        return this.check(target)
            ? { errors: [] }
            : {
                errors: [
                    {
                        keyword: this.keyword,
                        value: this.value,
                        target: target,
                        priority: this.priority,
                        coerce: this.coerce
                    }
                ]
            };
    };
    return KeywordValueEnforcer;
}());
exports.KeywordValueEnforcer = KeywordValueEnforcer;
/**
 * Adds support for error priority checking to error log validation parsing.
 * @class
 * @extends ErrorLogValidationParser<Partial<KeywordError>>
 */
var KeywordErrorLogValidationParser = /** @class */ (function (_super) {
    __extends(KeywordErrorLogValidationParser, _super);
    function KeywordErrorLogValidationParser() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    KeywordErrorLogValidationParser.prototype.rateValidity = function (value) {
        if (value.errors.length > 0) {
            var maxErrorPriority = 0;
            for (var _i = 0, _a = value.errors; _i < _a.length; _i++) {
                var error = _a[_i];
                if (error.priority != null && error.priority > maxErrorPriority) {
                    maxErrorPriority = error.priority;
                }
            }
            return -maxErrorPriority;
        }
        return 1;
    };
    return KeywordErrorLogValidationParser;
}(validation_1.ErrorLogValidationParser));
exports.KeywordErrorLogValidationParser = KeywordErrorLogValidationParser;
/**
 * Aplies the first matching constraint within the provided set.
 * @class
 * @template From, To
 * @implements ValueConstraint<any, boolean, ValueType>
 * @property {Array<ValueConstraint<From, ErrorLog<KeywordError>, To>>} branches - constraints to be used
 * @property {Convert<From, To>} defaultCoerce - coercion to apply no branches apply
 */
var KeywordEnforcerFork = /** @class */ (function () {
    function KeywordEnforcerFork(branches, defaultCoerce) {
        this.branches = branches;
        this.defaultCoerce = defaultCoerce;
    }
    KeywordEnforcerFork.prototype.coerce = function (value) {
        var validation = this.validate(value);
        var error = validation.errors[0];
        return (error === null || error === void 0 ? void 0 : error.coerce) != null
            ? error.coerce(value)
            : this.defaultCoerce(value);
    };
    /**
     * Gets the highest priority error in the provided set.
     * @function
     * @param {KeywordError[]} errors - errors to be evaluated
     * @returns {KeywordError | undefined}
     */
    KeywordEnforcerFork.prototype.getHighestPriorityError = function (errors) {
        var _a;
        var match;
        var highestPriority = Number.NEGATIVE_INFINITY;
        for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
            var error = errors_1[_i];
            var priority = (_a = error.priority) !== null && _a !== void 0 ? _a : 0;
            if (match == null || priority > highestPriority) {
                match = error;
            }
        }
        return match;
    };
    KeywordEnforcerFork.prototype.validate = function (target) {
        var _a, _b;
        var result;
        var lowestPriority = Number.POSITIVE_INFINITY;
        for (var _i = 0, _c = this.branches; _i < _c.length; _i++) {
            var branch = _c[_i];
            var validation = branch.validate(target);
            if (validation.errors.length < 1) {
                return validation;
            }
            var priority = (_b = (_a = this.getHighestPriorityError(validation.errors)) === null || _a === void 0 ? void 0 : _a.priority) !== null && _b !== void 0 ? _b : 0;
            if (result == null || priority < lowestPriority) {
                result = validation;
                lowestPriority = priority;
            }
        }
        return result !== null && result !== void 0 ? result : { errors: [] };
    };
    return KeywordEnforcerFork;
}());
exports.KeywordEnforcerFork = KeywordEnforcerFork;
/**
 * Supports chaining multiple keyword rules into a single rule set.
 * @class
 * @template From, To
 * @implements ConversionFactory<UntypedObject, SchemaEnforcer<UntypedObject, ErrorLog<KeywordError>, To>, KeywordEnforcerContext<From, To>>
 * @param {Array<KeywordRule<From, To>>} rules - list of rules to be checked
 * @param {ErrorLogValidationParser} validationParser - provides handling for error logs
 */
var SequentialKeywordEnforcerFactory = /** @class */ (function () {
    function SequentialKeywordEnforcerFactory(rules) {
        if (rules === void 0) { rules = []; }
        this.validationParser = new validation_1.ErrorLogValidationParser();
        this.rules = rules;
    }
    SequentialKeywordEnforcerFactory.prototype.process = function (schema, context) {
        if (context === void 0) { context = { enforcers: {} }; }
        var enforcers = {};
        var validateQueue = [];
        var coerceQueue = [];
        var _loop_1 = function (rule) {
            var ruleEnforcer = rule.getEnforcerFor(schema, context);
            if (ruleEnforcer != null) {
                validateQueue.push(function (value) { return ruleEnforcer.validate(value); });
                if (ruleEnforcer.coerce != null) {
                    var coerce_1 = ruleEnforcer.coerce;
                    coerceQueue.push(function (value) { return coerce_1(value); });
                }
                enforcers[rule.keyword] = ruleEnforcer;
            }
        };
        for (var _i = 0, _a = this.rules; _i < _a.length; _i++) {
            var rule = _a[_i];
            _loop_1(rule);
        }
        var enforcer = {
            schema: schema,
            validate: (0, validation_1.mergeValidateSteps)(validateQueue, this.validationParser),
            enforcers: enforcers
        };
        if (coerceQueue.length > 0) {
            enforcer.coerce = (0, coercion_1.mergeCoerceSteps)(coerceQueue);
        }
        return enforcer;
    };
    return SequentialKeywordEnforcerFactory;
}());
exports.SequentialKeywordEnforcerFactory = SequentialKeywordEnforcerFactory;
/**
 * Supports chaining multiple keyword rules into a single rule set.
 * @class
 * @template ValueType
 * @extends KeywordValueEnforcer<any, ValueType>
 * @param {Convert<any, ValueType>} coerceType - converts value to the target type
 * @param {KeywordRulesEnforcer<ValueType> | undefined} rulesEnforcer - applies additional constraints to the target value
 */
var TypeKeywordEnforcer = /** @class */ (function (_super) {
    __extends(TypeKeywordEnforcer, _super);
    function TypeKeywordEnforcer(keyword, value, check, coerceType, rulesEnforcer, priority) {
        if (priority === void 0) { priority = 0; }
        var _this = _super.call(this, keyword, value, check, undefined, priority) || this;
        _this.coerceType = coerceType;
        _this.coerce = function (value) {
            var _a;
            var typedValue = _this.coerceType(value);
            return ((_a = _this.rulesEnforcer) === null || _a === void 0 ? void 0 : _a.coerce) != null
                ? _this.rulesEnforcer.coerce(typedValue)
                : typedValue;
        };
        return _this;
    }
    TypeKeywordEnforcer.prototype.validate = function (target) {
        var typeCheck = _super.prototype.validate.call(this, target);
        if (this.rulesEnforcer != null && typeCheck.errors.length < 1) {
            var rulesCheck = this.rulesEnforcer.validate(target);
            return rulesCheck;
        }
        return typeCheck;
    };
    return TypeKeywordEnforcer;
}(KeywordValueEnforcer));
exports.TypeKeywordEnforcer = TypeKeywordEnforcer;
/**
 * Supports chaining multiple keyword rules into a single rule set.
 * @class
 * @template ValueType
 * @implements KeywordRule
 * @param {string} keyword - type keyword for the target schema
 * @param {Required<ValueConstraint<any, boolean, ValueType>>} typeEnforcer - handles type validation and coercion
 * @param {SequentialKeywordEnforcerFactory<ValueType> | undefined} typedKeywords - provides subconstraints for the keyword
 */
var TypeKeywordRule = /** @class */ (function () {
    function TypeKeywordRule(keyword, typeEnforcer, typedKeywords) {
        this.keyword = keyword;
        this.typeEnforcer = typeEnforcer;
        this.typedKeywords = typedKeywords;
    }
    TypeKeywordRule.prototype.getEnforcerFor = function (schema, context) {
        var _this = this;
        var _a;
        if (context === void 0) { context = { enforcers: {} }; }
        var typedEnforcer = (_a = this.typedKeywords) === null || _a === void 0 ? void 0 : _a.process(schema, context);
        var enforcer = new TypeKeywordEnforcer(this.keyword, schema[this.keyword], function (value) { return _this.typeEnforcer.validate(value); }, function (value) { return _this.typeEnforcer.coerce(value); }, typedEnforcer, 100);
        return enforcer;
    };
    return TypeKeywordRule;
}());
exports.TypeKeywordRule = TypeKeywordRule;
