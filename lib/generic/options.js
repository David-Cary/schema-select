"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyedSchemaLabeler = exports.SchemaOptionsFactory = void 0;
/**
 * Generates labeled options from a provided schema.
 * @class
 * @template SchemaType, ValidationType
 * @implements ConversionFactory<SchemaType, Array<LabeledValue<SchemaEnforcer<SchemaType, ValidationType>>>>
 * @param {ConversionFactory<SchemaType, string>} labelFactory - produces labels for each subschema
 * @param {ConversionFactory<SchemaType, SchemaEnforcer<SchemaType, ValidationType>>} enforcerFactory - produces enforcers for each subschema
 * @param {ConversionFactory<SchemaType, SchemaType[]> | undefined} splitter - converts schema to subschema list
 */
var SchemaOptionsFactory = /** @class */ (function () {
    function SchemaOptionsFactory(enforcerFactory, labelFactory, splitter) {
        this.splitter = splitter;
        this.labelFactory = labelFactory;
        this.enforcerFactory = enforcerFactory;
    }
    /**
     * Generates labeled options from a provided schema.
     * @function
     * @param {SchemaType} source - schema to be converted
     * @returns {Array<LabeledValue<SchemaEnforcer<SchemaType, ValidationType>>>}
     */
    SchemaOptionsFactory.prototype.process = function (schema) {
        var _this = this;
        var sources = this.splitter != null ? this.splitter.process(schema) : [schema];
        var options = sources.map(function (source) { return ({
            label: _this.labelFactory.process(source),
            value: _this.enforcerFactory.process(source)
        }); });
        return options;
    };
    return SchemaOptionsFactory;
}());
exports.SchemaOptionsFactory = SchemaOptionsFactory;
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
var KeyedSchemaLabeler = /** @class */ (function () {
    function KeyedSchemaLabeler(keywords, delimiter, translate) {
        if (keywords === void 0) { keywords = []; }
        if (delimiter === void 0) { delimiter = '/'; }
        this.stringify = String;
        this.keywords = keywords;
        this.delimiter = delimiter;
        this.translate = translate;
    }
    /**
     * Generates label from a provided schema.
     * @function
     * @param {UntypedObject} source - schema to be converted
     * @returns {string}
     */
    KeyedSchemaLabeler.prototype.process = function (source) {
        var _this = this;
        for (var _i = 0, _a = this.keywords; _i < _a.length; _i++) {
            var keyword = _a[_i];
            if (keyword in source) {
                var value = source[keyword];
                if (Array.isArray(value)) {
                    var itemNames = value.map(function (item) { return _this.stringify(item); });
                    if (itemNames.length < 1)
                        continue;
                    var translations = this.translate != null
                        ? itemNames.map(function (name) { return _this.translate(name); })
                        : itemNames;
                    var text = translations.join(this.delimiter);
                    return text;
                }
                else if (typeof value === 'string') {
                    return this.translate != null ? this.translate(value) : value;
                }
            }
        }
        return this.stringify(source);
    };
    return KeyedSchemaLabeler;
}());
exports.KeyedSchemaLabeler = KeyedSchemaLabeler;
