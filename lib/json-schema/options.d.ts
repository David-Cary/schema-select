import type { ConversionFactory, SchemaEnforcer, UntypedObject } from '../generic/coercion';
import { type ErrorLog } from '../generic/validation';
import { type KeywordError } from '../generic/keywords';
import { SchemaOptionsFactory, SchemaOptionsParser, KeyedSchemaLabeler } from '../generic/options';
import { type BooleanFork, type FlagOrObject } from './coercion';
/**
 * Standard list of JSON schema label properties in descending order of precedence.
 * @constant
 */
export declare const JSON_SCHEMA_LABEL_PROPERTIES: string[];
/**
 * Template for converting an any type JSON schema into a list of subschemas.
 * @constant
 */
export declare const ANY_VALUE_JSON_SCHEMA: {
    title: string;
    oneOf: ({
        type: string;
        items?: undefined;
        additionalProperties?: undefined;
    } | {
        type: string;
        items: boolean;
        additionalProperties?: undefined;
    } | {
        type: string;
        additionalProperties: boolean;
        items?: undefined;
    })[];
};
/**
 * Placeholder for schema equivalent to a false JSON schema.
 * @constant
 */
export declare const NO_VALUE_JSON_SCHEMA: {
    title: string;
    allOf: {
        type: string;
    }[];
};
/**
 * Generates label from a provided JSON schema value.
 * @class
 * @implements ConversionFactory<FlagOrObject, string>
 * @param {booleanLabels: BooleanFork<string>} booleanLabels - map of names for true / false schema
 * @param {KeyedSchemaLabeler} keyHandler - generates label by property values for a schema object
 */
export declare class JSONSchemaLabeler implements ConversionFactory<FlagOrObject, string> {
    booleanLabels: BooleanFork<string>;
    keyHandler: KeyedSchemaLabeler;
    constructor(keyHandler?: KeyedSchemaLabeler);
    process(source: FlagOrObject): string;
}
/**
 * Returns a typeof string that differentiates between arrays, objects, and null values.
 * @function
 * @param {any} value - value to be evaluated
 * @returns {string}
 */
export declare function getExpandedTypeOf(value: any): string;
/**
 * Produces a list of potential subschema branches for a particular JSON schema.
 * @class
 * @implements ConversionFactory<FlagOrObject, FlagOrObject[]>
 * @param {booleanLabels: BooleanFork<UntypedObject[]>} booleanSchemas - map of subschemas for true / false schema
 * @param {string[]} subschemaKeys - list of keywords that can contain subschema branches
 */
export declare class JSONSchemaSplitter implements ConversionFactory<FlagOrObject, FlagOrObject[]> {
    booleanSchemas: BooleanFork<UntypedObject[]>;
    subschemaKeys: string[];
    enumKey: string;
    constructor(subschemaKeys?: string[], booleanSchemas?: BooleanFork<UntypedObject[]>);
    process(source: FlagOrObject): FlagOrObject[];
}
/**
 * Generates labeled subschema options from a given JSON schema.
 * @class
 * @extends SchemaOptionsFactory<FlagOrObject, ErrorLog<Partial<KeywordError>>>
 */
export declare class JSONSchemaOptionsFactory extends SchemaOptionsFactory<FlagOrObject, ErrorLog<Partial<KeywordError>>> {
    constructor(enforcerFactory?: ConversionFactory<FlagOrObject, SchemaEnforcer<FlagOrObject, ErrorLog<Partial<KeywordError>>>>);
}
/**
 * Creates and evaluates JSON Schema subschema options.
 * @class
 * @extends SchemaOptionsParser<FlagOrObject, ErrorLog<Partial<KeywordError>>>
 */
export declare class JSONSchemaOptionsParser extends SchemaOptionsParser<FlagOrObject, ErrorLog<Partial<KeywordError>>> {
    constructor(enforcerFactory?: ConversionFactory<FlagOrObject, SchemaEnforcer<FlagOrObject, ErrorLog<Partial<KeywordError>>>>);
}
