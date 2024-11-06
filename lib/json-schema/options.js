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
exports.JSONSchemaOptionsFactory = exports.JSONSchemaSplitter = exports.JSONSchemaLabeler = exports.NO_VALUE_JSON_SCHEMA = exports.ANY_VALUE_JSON_SCHEMA = exports.JSON_SCHEMA_LABEL_PROPERTIES = void 0;
exports.getExpandedTypeOf = getExpandedTypeOf;
var options_1 = require("../generic/options");
var coercion_1 = require("./coercion");
/**
 * Standard list of JSON schema label properties in descending order of precedence.
 * @constant
 */
exports.JSON_SCHEMA_LABEL_PROPERTIES = [
    'title',
    '$id',
    '$ref',
    'description',
    '$comment',
    'const',
    'format',
    'type'
];
/**
 * Template for converting an any type JSON schema into a list of subschemas.
 * @constant
 */
exports.ANY_VALUE_JSON_SCHEMA = {
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
};
/**
 * Placeholder for schema equivalent to a false JSON schema.
 * @constant
 */
exports.NO_VALUE_JSON_SCHEMA = {
    title: 'NO_VALUE_JSON_SCHEMA',
    allOf: [
        { type: 'boolean' },
        { type: 'string' }
    ]
};
/**
 * Generates label from a provided JSON schema value.
 * @class
 * @implements ConversionFactory<FlagOrObject, string>
 * @param {booleanLabels: BooleanFork<string>} booleanLabels - map of names for true / false schema
 * @param {KeyedSchemaLabeler} keyHandler - generates label by property values for a schema object
 */
var JSONSchemaLabeler = /** @class */ (function () {
    function JSONSchemaLabeler(keyHandler) {
        if (keyHandler === void 0) { keyHandler = new options_1.KeyedSchemaLabeler(exports.JSON_SCHEMA_LABEL_PROPERTIES); }
        this.booleanLabels = {
            true: exports.ANY_VALUE_JSON_SCHEMA.title,
            false: exports.NO_VALUE_JSON_SCHEMA.title
        };
        this.keyHandler = keyHandler;
    }
    JSONSchemaLabeler.prototype.process = function (source) {
        if (typeof source === 'boolean') {
            var label = source ? this.booleanLabels.true : this.booleanLabels.false;
            return this.keyHandler.translate != null
                ? this.keyHandler.translate(label)
                : label;
        }
        return this.keyHandler.process(source);
    };
    return JSONSchemaLabeler;
}());
exports.JSONSchemaLabeler = JSONSchemaLabeler;
/**
 * Returns a typeof string that differentiates between arrays, objects, and null values.
 * @function
 * @param {any} value - value to be evaluated
 * @returns {string}
 */
function getExpandedTypeOf(value) {
    var typeName = typeof value;
    if (typeName === 'object') {
        if (Array.isArray(value)) {
            return 'array';
        }
        else if (value == null) {
            return 'null';
        }
    }
    return typeName;
}
/**
 * Produces a list of potential subschema branches for a particular JSON schema.
 * @class
 * @implements ConversionFactory<FlagOrObject, FlagOrObject[]>
 * @param {booleanLabels: BooleanFork<UntypedObject[]>} booleanSchemas - map of subschemas for true / false schema
 * @param {string[]} subschemaKeys - list of keywords that can contain subschema branches
 */
var JSONSchemaSplitter = /** @class */ (function () {
    function JSONSchemaSplitter(subschemaKeys, booleanSchemas) {
        if (subschemaKeys === void 0) { subschemaKeys = ['oneOf', 'anyOf']; }
        if (booleanSchemas === void 0) { booleanSchemas = {
            true: structuredClone(exports.ANY_VALUE_JSON_SCHEMA.oneOf),
            false: [exports.NO_VALUE_JSON_SCHEMA]
        }; }
        this.enumKey = 'enum';
        this.booleanSchemas = booleanSchemas;
        this.subschemaKeys = subschemaKeys;
    }
    JSONSchemaSplitter.prototype.process = function (source) {
        if (typeof source === 'boolean') {
            return source ? this.booleanSchemas.true : this.booleanSchemas.false;
        }
        if (this.enumKey !== '') {
            var enumValues = source[this.enumKey];
            if (Array.isArray(enumValues)) {
                return enumValues.map(function (item) { return ({
                    const: item
                }); });
            }
        }
        for (var _i = 0, _a = this.subschemaKeys; _i < _a.length; _i++) {
            var keyword = _a[_i];
            var keyValue = source[keyword];
            if (Array.isArray(keyValue)) {
                var filteredItems = keyValue.filter(function (item) { return (typeof item === 'boolean') ||
                    (typeof item === 'object' && item != null && !Array.isArray(item)); });
                return filteredItems;
            }
        }
        var typeValue = source.type;
        if (Array.isArray(typeValue)) {
            var typeNames = typeValue.filter(function (item) { return typeof item === 'string'; });
            var types = typeNames.map(function (type) { return ({ type: type }); });
            return types;
        }
        return [source];
    };
    return JSONSchemaSplitter;
}());
exports.JSONSchemaSplitter = JSONSchemaSplitter;
/**
 * Generates labeled subschema options from a given JSON schema.
 * @class
 * @extends SchemaOptionsFactory<FlagOrObject, ErrorLog<Partial<KeywordError>>>
 */
var JSONSchemaOptionsFactory = /** @class */ (function (_super) {
    __extends(JSONSchemaOptionsFactory, _super);
    function JSONSchemaOptionsFactory(enforcerFactory) {
        if (enforcerFactory === void 0) { enforcerFactory = new coercion_1.JSONSchemaEnforcerFactory(); }
        return _super.call(this, enforcerFactory, new JSONSchemaLabeler(), new JSONSchemaSplitter()) || this;
    }
    return JSONSchemaOptionsFactory;
}(options_1.SchemaOptionsFactory));
exports.JSONSchemaOptionsFactory = JSONSchemaOptionsFactory;
