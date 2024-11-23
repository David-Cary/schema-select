"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONSchemaEnforcerFactory = exports.JSONSchemaNoValueEnforcer = exports.JSONSchemaAnyValueEnforcer = exports.JSONSchemaConstRule = exports.JSONSchemaTypeRule = void 0;
var coercion_1 = require("../generic/coercion");
var keywords_1 = require("../generic/keywords");
/**
 * Generates rules for resolving potential values of the JSON schema type keyword.
 * @function
 * @param {string} keyword - type keyword
 * @param {string | undefined} valueProperty - value property to be passed onto each subrule
 * @returns {Record<string, TypeKeywordRule>}
 */
function createJSONSchemaTypeRules(keyword, valueProperty) {
    if (keyword === void 0) { keyword = 'type'; }
    return {
        any: new keywords_1.TypeKeywordRule(keyword, new coercion_1.AnyValueEnforcer()),
        array: new keywords_1.TypeKeywordRule(keyword, new coercion_1.ArrayEnforcer(undefined, valueProperty)),
        boolean: new keywords_1.TypeKeywordRule(keyword, new coercion_1.BooleanEnforcer(false, valueProperty)),
        integer: new keywords_1.TypeKeywordRule(keyword, new coercion_1.SteppedNumberEnforcer(0, 1, valueProperty)),
        null: new keywords_1.TypeKeywordRule(keyword, new coercion_1.StrictEqualityEnforcer(null)),
        number: new keywords_1.TypeKeywordRule(keyword, new coercion_1.NumberEnforcer(0, valueProperty)),
        object: new keywords_1.TypeKeywordRule(keyword, new coercion_1.ObjectEnforcer(undefined, valueProperty)),
        string: new keywords_1.TypeKeywordRule(keyword, new coercion_1.StringEnforcer('', valueProperty))
    };
}
/**
 * Handles the JSON schema type keyword.
 * @class
 * @implements KeywordRule
 */
var JSONSchemaTypeRule = /** @class */ (function () {
    function JSONSchemaTypeRule(keyword, typeRules) {
        if (keyword === void 0) { keyword = 'type'; }
        if (typeRules === void 0) { typeRules = createJSONSchemaTypeRules(keyword); }
        this.keyword = keyword;
        this.typeRules = typeRules;
    }
    JSONSchemaTypeRule.prototype.getEnforcerFor = function (schema, context) {
        var _this = this;
        var typeValue = schema[this.keyword];
        if (typeof typeValue === 'string') {
            var typeRule = this.typeRules[typeValue];
            return typeRule === null || typeRule === void 0 ? void 0 : typeRule.getEnforcerFor(schema, context);
        }
        if (Array.isArray(typeValue)) {
            var typeNames = typeValue.filter(function (item) { return typeof item === 'string'; });
            var targetRules = typeNames
                .map(function (typeName) { return _this.typeRules[typeName]; })
                .filter(function (rule) { return rule != null; });
            var typeEnforcers = targetRules
                .map(function (rule) { return rule.getEnforcerFor(schema, context); })
                .filter(function (enforcer) { return enforcer != null; });
            var fork = new keywords_1.KeywordEnforcerFork(typeEnforcers, coercion_1.echoValue);
            return fork;
        }
    };
    return JSONSchemaTypeRule;
}());
exports.JSONSchemaTypeRule = JSONSchemaTypeRule;
/**
 * Handles the JSON schema const keyword.
 * @class
 * @implements KeywordRule
 */
var JSONSchemaConstRule = /** @class */ (function () {
    function JSONSchemaConstRule(keyword) {
        if (keyword === void 0) { keyword = 'const'; }
        this.keyword = keyword;
    }
    JSONSchemaConstRule.prototype.getEnforcerFor = function (schema, context) {
        var value = schema[this.keyword];
        if (value !== undefined) {
            return new keywords_1.KeywordValueEnforcer(this.keyword, value, function (target) { return (0, coercion_1.isEquivalentTo)(target, value); }, function (target) { return structuredClone(value); }, 90);
        }
    };
    return JSONSchemaConstRule;
}());
exports.JSONSchemaConstRule = JSONSchemaConstRule;
/**
 * Accepts any value, returning an empty error log on validation.
 * @class
 * @implements SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>>
 */
var JSONSchemaAnyValueEnforcer = /** @class */ (function () {
    function JSONSchemaAnyValueEnforcer() {
        this.schema = true;
    }
    JSONSchemaAnyValueEnforcer.prototype.validate = function (value) {
        return { errors: [] };
    };
    JSONSchemaAnyValueEnforcer.prototype.coerce = function (value) {
        return value;
    };
    return JSONSchemaAnyValueEnforcer;
}());
exports.JSONSchemaAnyValueEnforcer = JSONSchemaAnyValueEnforcer;
/**
 * Doesn't accept any value, returning an error on validation.
 * @class
 * @implements SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>>
 */
var JSONSchemaNoValueEnforcer = /** @class */ (function () {
    function JSONSchemaNoValueEnforcer() {
        this.schema = false;
    }
    JSONSchemaNoValueEnforcer.prototype.validate = function (value) {
        return {
            errors: [
                { target: value }
            ]
        };
    };
    return JSONSchemaNoValueEnforcer;
}());
exports.JSONSchemaNoValueEnforcer = JSONSchemaNoValueEnforcer;
/**
 * Doesn't accept any value, returning an error on validation.
 * @class
 * @implements ConversionFactory<FlagOrObject, SchemaEnforcer<FlagOrObject, ErrorLog<Partial<KeywordError>>>, KeywordEnforcerContext>
 * @param {BooleanFork<SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>>>} booleanEnforcers - provides enforcers for a true or false schema
 * @param {SequentialKeywordEnforcerFactory} keywordHandler - produces enforcers using json schema keyword rules
 */
var JSONSchemaEnforcerFactory = /** @class */ (function () {
    function JSONSchemaEnforcerFactory() {
        this.booleanEnforcers = {
            true: new JSONSchemaAnyValueEnforcer(),
            false: new JSONSchemaNoValueEnforcer()
        };
        this.keywordHandler = new keywords_1.SequentialKeywordEnforcerFactory([
            new JSONSchemaTypeRule(),
            new JSONSchemaConstRule()
        ]);
    }
    JSONSchemaEnforcerFactory.prototype.process = function (schema, context) {
        if (context === void 0) { context = { enforcers: {} }; }
        if (typeof schema === 'boolean') {
            return schema ? this.booleanEnforcers.true : this.booleanEnforcers.false;
        }
        return this.keywordHandler.process(schema, context);
    };
    return JSONSchemaEnforcerFactory;
}());
exports.JSONSchemaEnforcerFactory = JSONSchemaEnforcerFactory;
