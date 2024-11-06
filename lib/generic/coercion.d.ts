import { type Convert } from './validation';
/**
 * Stand in for untyped javascript objects.
 * @type
 */
export type UntypedObject = Record<string, any>;
/**
 * Combines multiple coercion functions into a single function, pass the results through each in order.
 * @function
 * @template ValueType
 * @param {Array<Convert<ValueType>>} steps - callbacks to be merged
 * @returns {Convert<ValueType>}
 */
export declare function mergeCoerceSteps<ValueType = any>(steps: Array<Convert<ValueType>>): Convert<ValueType>;
/**
 * Provides validation and potential coercion handing.
 * @interface
 * @template SourceType, ValidationType, ValueType
 */
export interface ValueConstraint<SourceType = any, ValidationType = boolean, ValueType = SourceType> {
    /**
     * Check if the target value follows this constraint.
     * @function
     * @param {SourceType} source - value to be validated
     * @returns {ValidationType}
     */
    validate: Convert<SourceType, ValidationType>;
    /**
     * Returns a version of the provided value that adheres to this constraint.
     * @function
     * @param {SourceType} source - value to be converted
     * @returns {ValueType}
     */
    coerce?: Convert<SourceType, ValueType>;
}
/**
 * Attaches a schema to it's corresponding validation and coercion callbacks.
 * @interface
 * @template SchemaType, ValidationType, ValueType
 * @property {SchemaType} schema - schema used to construct the constraint
 */
export interface SchemaEnforcer<SchemaType = any, ValidationType = boolean, ValueType = any> extends ValueConstraint<any, ValidationType, ValueType> {
    schema: SchemaType;
}
/**
 * Provides validation and potential coercion handing.
 * @interface
 * @template SourceType, OutputType, ContextType
 */
export interface ConversionFactory<SourceType = any, OutputType = SourceType, ContextType = any> {
    /**
     * Returns a version of the provided value that adheres to this constraint.
     * @function
     * @param {SourceType} source - value to be converted
     * @param {ContextType} context - data and options to be used in the conversion process
     * @returns {OutputType}
     */
    process: (source: SourceType, context?: ContextType) => OutputType;
}
/**
 * Generates constaints for schemas that meet certain criteria.
 * @interface
 * @template SchemaType, ContextType, InputType, ValidationType, OutputType
 */
export interface ValueConstraintRule<SchemaType = any, ContextType = any, InputType = any, ValidationType = boolean, OutputType = InputType> {
    /**
     * Returns a constraint if the schema meets the rule's criteria.
     * @function
     * @param {SchemaType} source - value to be converted
     * @param {ContextType} context - data and options to be used in the conversion process
     * @returns {ValueConstraint<InputType, ValidationType, OutputType> | undefined}
     */
    getEnforcerFor: (schema: SchemaType, context?: ContextType) => ValueConstraint<InputType, ValidationType, OutputType> | undefined;
}
/**
 * Wraps returning the provided value in a function
 * @function
 * @template T
 * @param {T} value - value to be returned
 * @returns {T}
 */
export declare function echoValue<T = any>(value: T): T;
/**
 * Provides validation and coercion to a specific javascript type.
 * @class
 * @template ValueType
 * @implements ValueConstraint<any, boolean, ValueType>
 */
export declare class ValueTypeEnforcer<ValueType = any> implements ValueConstraint<any, boolean, ValueType> {
    readonly typeName: string;
    defaultValue?: ValueType;
    valueProperty?: string;
    constructor(typeName: string, defaultValue?: ValueType, valueProperty?: string);
    validate(value: any): boolean;
    /**
     * Tries to extract a value as specified by the enforcer's property name.
     * @function
     * @param {any} value - value to be evaluated
     * @returns {any}
     */
    unwrap(value: any): any;
}
/**
 * Checks for and converts to an array.
 * @class
 * @extends ValueTypeEnforcer<any[]>
 */
export declare class ArrayEnforcer extends ValueTypeEnforcer<any[]> {
    constructor(defaultValue?: any[], valueProperty?: string);
    validate(value: any): boolean;
    coerce(value: any): any[];
}
/**
 * Checks for and converts to a boolean.
 * @class
 * @extends ValueTypeEnforcer<boolean>
 */
export declare class BooleanEnforcer extends ValueTypeEnforcer<boolean> {
    constructor(defaultValue?: boolean, valueProperty?: string);
    coerce(value: any): boolean;
}
/**
 * Checks for and converts to a number.
 * @class
 * @extends ValueTypeEnforcer<number>
 */
export declare class NumberEnforcer extends ValueTypeEnforcer<number> {
    constructor(defaultValue?: number, valueProperty?: string);
    coerce(value: any): number;
}
/**
 * Applies multiplier constriants to a NumberEnforcer.
 * @class
 * @extends NumberEnforcer
 */
export declare class SteppedNumberEnforcer extends NumberEnforcer {
    step: number;
    constructor(defaultValue?: number, step?: number, valueProperty?: string);
    validate(value: any): boolean;
    coerce(value: any): number;
}
/**
 * Checks for and converts to an object.
 * @class
 * @extends ValueTypeEnforcer<Record<string, any>>
 */
export declare class ObjectEnforcer extends ValueTypeEnforcer<Record<string, any>> {
    constructor(defaultValue?: Record<string, any>, valueProperty?: string);
    validate(value: any): boolean;
    coerce(value: any): Record<string, any>;
}
/**
 * Checks for and converts to a string.
 * @class
 * @extends ValueTypeEnforcer<string>
 */
export declare class StringEnforcer extends ValueTypeEnforcer<string> {
    constructor(defaultValue?: string, valueProperty?: string);
    coerce(value: any): string;
}
export declare function isEquivalentTo(a: any, b: any): boolean;
/**
 * Checks if an value is strictly equal to the target value.
 * @class
 * @template ValueType
 * @implements ValueConstraint<any, boolean, ValueType>
 */
export declare class StrictEqualityEnforcer<ValueType = any> implements ValueConstraint<any, boolean, ValueType> {
    value: ValueType;
    constructor(value: ValueType);
    validate(value: any): boolean;
    coerce(value: any): ValueType;
}
/**
 * Dummy enforcer that accepts any value and applied no changes on coercion.
 * @class
 * @implements ValueConstraint<any, boolean, any>
 */
export declare class AnyValueEnforcer implements ValueConstraint<any, boolean, any> {
    validate(value: any): boolean;
    coerce(value: any): any;
}
