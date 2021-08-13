import {NavigationStackScreenProps} from 'react-navigation-stack';
import {NavigationParams} from 'react-navigation';
import {UserInterface} from 'contexts/UserContext';

export enum SignUpFormFields {
  firstName = 'firstName',
  lastName = 'lastName',
  email = 'email',
  username = 'username',
  password = 'password',
  passwordConfirmation = 'passwordConfirmation',
  reference = 'reference',
}

export type SignUpRules = {
  [key in SignUpFormField]: Array<(v: string) => false | string>
};

export type SignUpForm = {[key in SignUpFormField]: string};

export interface SignUpProps
  extends NavigationStackScreenProps<NavigationParams> {
  setUser: (user: UserInterface) => Promise<UserInterface>;
  user: UserInterface | null;
}

export type SignUpFormField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'username'
  | 'password'
  | 'passwordConfirmation'
  | 'reference';

export type SignUpValidationItem = {
  name: SignUpFormField;
  error: false | string;
};

export interface SignUpState {
  socialLogin: 'facebook' | 'twitter' | 'google' | null;
  isFetching: boolean;
  isReady: boolean;
  form: SignUpForm;
  touched: Array<SignUpFormField>;
  dirtied: Array<SignUpFormField>;
  error: {[key in SignUpFormFields]?: string};
}
