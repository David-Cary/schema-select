import type { ConversionFactory, SchemaEnforcer, UntypedObject } from './coercion';
import type { Convert, ValidationParser } from './validation';
export interface LabeledValue<T> {
    label: string;
    value: T;
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
export declare class SchemaOptionsFactory<SchemaType = any, ValidationType = boolean> implements ConversionFactory<SchemaType, Array<LabeledValue<SchemaEnforcer<SchemaType, ValidationType>>>> {
    labelFactory: ConversionFactory<SchemaType, string>;
    enforcerFactory: ConversionFactory<SchemaType, SchemaEnforcer<SchemaType, ValidationType>>;
    splitter?: ConversionFactory<SchemaType, SchemaType[]>;
    constructor(enforcerFactory: ConversionFactory<SchemaType, SchemaEnforcer<SchemaType, ValidationType>>, labelFactory: ConversionFactory<SchemaType, string>, splitter?: ConversionFactory<SchemaType, SchemaType[]>);
    /**
     * Generates labeled options from a provided schema.
     * @function
     * @param {SchemaType} source - schema to be converted
     * @returns {Array<LabeledValue<SchemaEnforcer<SchemaType, ValidationType>>>}
     */
    process(schema: SchemaType): Array<LabeledValue<SchemaEnforcer<SchemaType, ValidationType>>>;
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
export declare class KeyedSchemaLabeler implements ConversionFactory<UntypedObject, string> {
    keywords: string[];
    delimiter: string;
    translate?: Convert<string>;
    stringify: Convert<any, string>;
    constructor(keywords?: string[], delimiter?: string, translate?: Convert<string>);
    /**
     * Generates label from a provided schema.
     * @function
     * @param {UntypedObject} source - schema to be converted
     * @returns {string}
     */
    process(source: UntypedObject): string;
}
/**
 * Handles generating and evaluating schema options.
 * @class
 * @template SchemaType, ValidationType
 * @param {SchemaOptionsFactory<SchemaType, ValidationType>} optionsFactory - handles option list creation
 * @param {ValidationParser<ValidationType>} validationParser - handles validating options
 */
export declare class SchemaOptionsParser<SchemaType = any, ValidationType = boolean> {
    optionsFactory: SchemaOptionsFactory<SchemaType, ValidationType>;
    validationParser: ValidationParser<ValidationType>;
    constructor(optionsFactory: SchemaOptionsFactory<SchemaType, ValidationType>, validationParser: ValidationParser<ValidationType>);
    /**
     * Generates label from a provided schema.
     * @function
     * @param {UntypedObject} source - schema to be converted
     * @returns {string}
     */
    getOptionsFor(schema: SchemaType): Array<LabeledValue<SchemaEnforcer<SchemaType, ValidationType>>>;
    /**
     * Generates label from a provided schema.
     * @function
     * @param {UntypedObject} source - schema to be converted
     * @returns {string}
     */
    getMostValidOption(options: Array<LabeledValue<SchemaEnforcer<SchemaType, ValidationType>>>, value: any): LabeledValue<SchemaEnforcer<SchemaType, ValidationType>> | undefined;
}
