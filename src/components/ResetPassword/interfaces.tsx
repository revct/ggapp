import {NavigationStackScreenProps} from 'react-navigation-stack';
import {NavigationParams} from 'react-navigation';
import {UserInterface} from '../../contexts/UserContext';

export enum ResetPasswordFormFields {
  code = 'code',
  password = 'password',
  passwordConfirmation = 'passwordConfirmation',
}

export type ResetPasswordForm = {[key in ResetPasswordFormFields]: string};

export type ResetPasswordFormField =
  | 'code'
  | 'password'
  | 'passwordConfirmation';

export interface ResetPasswordProps
  extends NavigationStackScreenProps<NavigationParams> {
  setUser: (user: UserInterface) => Promise<UserInterface>;
}

export type ResetPasswordValidationItem = {
  name: ResetPasswordFormField;
  error: false | string;
};

export type ResetPasswordRules = {
  [key in ResetPasswordFormField]: Array<(v: string) => false | string>
};

export interface ResetPasswordState {
  form: ResetPasswordForm;
  touched: Array<ResetPasswordFormField>;
  dirtied: Array<ResetPasswordFormField>;
  error: {[key in ResetPasswordFormFields]?: string};
  isPending: boolean;
}
