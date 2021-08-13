import {NavigationStackScreenProps} from 'react-navigation-stack';
import {NavigationParams} from 'react-navigation';
import {UserInterface} from 'contexts/UserContext';

export type LogInRules = {
  [key in LogInFormField]: Array<(v: string) => false | string>
};

export type LogInForm = {[key in LogInFormField]: string};

export type LogInFormField = 'username' | 'password';

export interface LogInProps
  extends NavigationStackScreenProps<NavigationParams> {
  setUser: (user: UserInterface) => Promise<UserInterface>;
  user: UserInterface | null;
}

export type LoginValidationItem = {
  name: LogInFormField;
  error: false | string;
};

export interface LogInState {
  socialLogin: 'facebook' | 'twitter' | 'google' | null;
  isFetching: boolean;
  isReady: boolean;
  form: LogInForm;
  touched: Array<LogInFormField>;
  dirtied: Array<LogInFormField>;
  error: {[key in LogInFormField]?: string};
}
