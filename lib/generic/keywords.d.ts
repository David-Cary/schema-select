import { type ConversionFactory, type SchemaEnforcer, type UntypedObject, type ValueConstraint, type ValueConstraintRule } from './coercion';
import { type Convert, type ErrorLog, ErrorLogValidationParser } from './validation';
/**
 * Handles errors associated with a keyword / schema property.
 * @interface
 * @template From, To
 * @property {string} keyword - target schema property
 * @property {any} value - value that failed validation
 * @property {any} target - target schema value
 * @property {number | undefined} priority - relative importance of the target error
 * @property {Convert<From, To> | undefined} coerce - provideds a callback to fix the validation error
 */
export interface KeywordError<From = any, To = From> {
    keyword: string;
    value: any;
    target: any;
    priority?: number;
    coerce?: Convert<From, To>;
}
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
export declare class KeywordValueEnforcer<From = any, To = From> implements ValueConstraint<From, ErrorLog<KeywordError>, To> {
    keyword: string;
    value: any;
    check: Convert<From, boolean>;
    coerce?: Convert<From, To>;
    priority: number;
    constructor(keyword: string, value: any, check: Convert<From, boolean>, coerce?: Convert<From, To>, priority?: number);
    validate(target: From): ErrorLog<KeywordError>;
}
/**
 * Adds support for error priority checking to error log validation parsing.
 * @class
 * @extends ErrorLogValidationParser<Partial<KeywordError>>
 */
export declare class KeywordErrorLogValidationParser extends ErrorLogValidationParser<Partial<KeywordError>> {
    rateValidity(value: ErrorLog<Partial<KeywordError>>): number;
}
/**
 * Aplies the first matching constraint within the provided set.
 * @class
 * @template From, To
 * @implements ValueConstraint<any, boolean, ValueType>
 * @property {Array<ValueConstraint<From, ErrorLog<KeywordError>, To>>} branches - constraints to be used
 * @property {Convert<From, To>} defaultCoerce - coercion to apply no branches apply
 */
export declare class KeywordEnforcerFork<From = any, To = From> implements ValueConstraint<From, ErrorLog<KeywordError>, To> {
    branches: Array<ValueConstraint<From, ErrorLog<KeywordError>, To>>;
    defaultCoerce: Convert<From, To>;
    constructor(branches: Array<ValueConstraint<From, ErrorLog<KeywordError>, To>>, defaultCoerce: Convert<From, To>);
    coerce(value: From): To;
    /**
     * Gets the highest priority error in the provided set.
     * @function
     * @param {KeywordError[]} errors - errors to be evaluated
     * @returns {KeywordError | undefined}
     */
    getHighestPriorityError(errors: KeywordError[]): KeywordError | undefined;
    validate(target: From): ErrorLog<KeywordError>;
}
/**
 * Wrapper for a mapping of constraints by associated keywords.
 * @interface
 * @template From, To
 * @property {Record<string, ValueConstraint<From, ErrorLog<KeywordError>, To>>} enforcers - constraint map
 */
export interface KeywordEnforcerContext<From = any, To = From> {
    enforcers: Record<string, ValueConstraint<From, ErrorLog<KeywordError>, To>>;
}
/**
 * Generates a constraint if the target schema matches the provided keyword.
 * @interface
 * @template From, To
 * @property {string} keyword - associated schema property
 * @extends ValueConstraintRule<UntypedObject, KeywordEnforcerContext<From, To>, From, ErrorLog<KeywordError>, To>
 */
export interface KeywordRule<From = any, To = From> extends ValueConstraintRule<UntypedObject, KeywordEnforcerContext<From, To>, From, ErrorLog<KeywordError>, To> {
    keyword: string;
    getEnforcerFor: (source: UntypedObject, context?: KeywordEnforcerContext<From, To>) => ValueConstraint<From, ErrorLog<KeywordError>, To> | undefined;
}
/**
 * Provides a schema enforcer for keywords with subenforcers attached.
 * @type
 */
export type KeywordRulesEnforcer<From = any, To = From> = SchemaEnforcer<UntypedObject, ErrorLog<KeywordError>, To> & KeywordEnforcerContext<From, To>;
/**
 * Supports chaining multiple keyword rules into a single rule set.
 * @class
 * @template From, To
 * @implements ConversionFactory<UntypedObject, SchemaEnforcer<UntypedObject, ErrorLog<KeywordError>, To>, KeywordEnforcerContext<From, To>>
 * @param {Array<KeywordRule<From, To>>} rules - list of rules to be checked
 * @param {ErrorLogValidationParser} validationParser - provides handling for error logs
 */
export declare class SequentialKeywordEnforcerFactory<From = any, To = From> implements ConversionFactory<UntypedObject, SchemaEnforcer<UntypedObject, ErrorLog<KeywordError>, To>, KeywordEnforcerContext<From, To>> {
    rules: Array<KeywordRule<From, To>>;
    validationParser: ErrorLogValidationParser<any>;
    constructor(rules?: Array<KeywordRule<From, To>>);
    process(schema: UntypedObject, context?: KeywordEnforcerContext<From, To>): KeywordRulesEnforcer<From, To>;
}
/**
 * Supports chaining multiple keyword rules into a single rule set.
 * @class
 * @template ValueType
 * @extends KeywordValueEnforcer<any, ValueType>
 * @param {Convert<any, ValueType>} coerceType - converts value to the target type
 * @param {KeywordRulesEnforcer<ValueType> | undefined} rulesEnforcer - applies additional constraints to the target value
 */
export declare class TypeKeywordEnforcer<ValueType = any> extends KeywordValueEnforcer<any, ValueType> {
    coerceType: Convert<any, ValueType>;
    rulesEnforcer?: KeywordRulesEnforcer<ValueType>;
    constructor(keyword: string, value: any, check: Convert<any, boolean>, coerceType: Convert<any, ValueType>, rulesEnforcer?: KeywordRulesEnforcer<ValueType>, priority?: number);
    validate(target: any): ErrorLog<KeywordError>;
}
/**
 * Supports chaining multiple keyword rules into a single rule set.
 * @class
 * @template ValueType
 * @implements KeywordRule
 * @param {string} keyword - type keyword for the target schema
 * @param {Required<ValueConstraint<any, boolean, ValueType>>} typeEnforcer - handles type validation and coercion
 * @param {SequentialKeywordEnforcerFactory<ValueType> | undefined} typedKeywords - provides subconstraints for the keyword
 */
export declare class TypeKeywordRule<ValueType = any> implements KeywordRule {
    keyword: string;
    typeEnforcer: Required<ValueConstraint<any, boolean, ValueType>>;
    typedKeywords?: SequentialKeywordEnforcerFactory<ValueType>;
    constructor(keyword: string, typeEnforcer: Required<ValueConstraint<any, boolean, ValueType>>, typedKeywords?: SequentialKeywordEnforcerFactory<ValueType>);
    getEnforcerFor(schema: UntypedObject, context?: KeywordEnforcerContext<ValueType>): KeywordValueEnforcer | undefined;
}
