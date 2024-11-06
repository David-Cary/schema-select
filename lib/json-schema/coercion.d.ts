import { type ConversionFactory, type SchemaEnforcer, type UntypedObject, type ValueConstraint } from '../generic/coercion';
import { type ErrorLog } from '../generic/validation';
import { type KeywordEnforcerContext, type KeywordError, type KeywordRule, type KeywordRulesEnforcer, TypeKeywordRule, SequentialKeywordEnforcerFactory } from '../generic/keywords';
/**
 * Handles the JSON schema type keyword.
 * @class
 * @implements KeywordRule
 */
export declare class JSONSchemaTypeRule implements KeywordRule {
    keyword: string;
    typeRules: Record<string, TypeKeywordRule>;
    constructor(keyword?: string, typeRules?: Record<string, TypeKeywordRule<any>>);
    getEnforcerFor(schema: UntypedObject, context?: KeywordEnforcerContext): ValueConstraint<any, ErrorLog<KeywordError>> | undefined;
}
/**
 * Handles the JSON schema const keyword.
 * @class
 * @implements KeywordRule
 */
export declare class JSONSchemaConstRule implements KeywordRule {
    keyword: string;
    constructor(keyword?: string);
    getEnforcerFor(schema: UntypedObject, context?: KeywordEnforcerContext): ValueConstraint<any, ErrorLog<KeywordError>> | undefined;
}
/**
 * Accepts any value, returning an empty error log on validation.
 * @class
 * @implements SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>>
 */
export declare class JSONSchemaAnyValueEnforcer implements SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>> {
    schema: boolean;
    validate(value: any): ErrorLog<Partial<KeywordError>>;
    coerce(value: any): any;
}
/**
 * Doesn't accept any value, returning an error on validation.
 * @class
 * @implements SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>>
 */
export declare class JSONSchemaNoValueEnforcer implements SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>> {
    schema: boolean;
    validate(value: any): ErrorLog<Partial<KeywordError>>;
}
/**
 * Allows either a javascript object or boolean value.
 * @type
 */
export type FlagOrObject = boolean | UntypedObject;
/**
 * Provides values for true and false branches.
 * @interface
 */
export interface BooleanFork<T> {
    true: T;
    false: T;
}
/**
 * Doesn't accept any value, returning an error on validation.
 * @class
 * @implements ConversionFactory<FlagOrObject, SchemaEnforcer<FlagOrObject, ErrorLog<Partial<KeywordError>>>, KeywordEnforcerContext>
 * @param {BooleanFork<SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>>>} booleanEnforcers - provides enforcers for a true or false schema
 * @param {SequentialKeywordEnforcerFactory} keywordHandler - produces enforcers using json schema keyword rules
 */
export declare class JSONSchemaEnforcerFactory implements ConversionFactory<FlagOrObject, SchemaEnforcer<FlagOrObject, ErrorLog<Partial<KeywordError>>>, KeywordEnforcerContext> {
    booleanEnforcers: BooleanFork<SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>>>;
    keywordHandler: SequentialKeywordEnforcerFactory<any, any>;
    process(schema: FlagOrObject, context?: KeywordEnforcerContext<FlagOrObject>): KeywordRulesEnforcer | SchemaEnforcer<boolean, ErrorLog<Partial<KeywordError>>>;
}
