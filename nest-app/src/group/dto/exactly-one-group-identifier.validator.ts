import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

interface GroupIdentifierShape {
  groupId?: number;
  groupName?: string;
}

@ValidatorConstraint({ name: 'ExactlyOneGroupIdentifier', async: false })
class ExactlyOneGroupIdentifierConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const { groupId, groupName } = args.object as GroupIdentifierShape;
    return (groupId !== undefined) !== (groupName !== undefined);
  }

  defaultMessage(): string {
    return 'Provide exactly one of groupId or groupName';
  }
}

/**
 * Applied to `groupId`; reads both `groupId` and `groupName` off the DTO
 * instance to make sure callers identify a group one way, not both or
 * neither.
 */
export function ExactlyOneGroupIdentifier(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      name: 'exactlyOneGroupIdentifier',
      target: target.constructor,
      propertyName,
      options: validationOptions,
      validator: ExactlyOneGroupIdentifierConstraint,
    });
  };
}
