import {NavigationStackScreenProps} from 'react-navigation-stack';
import {NavigationParams} from 'react-navigation';
import {UserInterface} from '../../contexts/UserContext';

export enum ForgotPasswordFormFields {
  email = 'email',
}

export type ForgotPasswordForm = {[key in ForgotPasswordFormFields]: string};

export type ForgotPasswordFormField = 'email';

export interface ForgotPasswordProps
  extends NavigationStackScreenProps<NavigationParams> {
  setUser: (user: UserInterface) => Promise<UserInterface>;
}

export interface ForgotPasswordState {
  form: ForgotPasswordForm;
  touched: Array<ForgotPasswordFormField>;
  dirtied: Array<ForgotPasswordFormField>;
  error: {[key in ForgotPasswordFormFields]?: string};
  isPending: boolean;
  socialLogin: 'facebook' | 'twitter' | 'google' | null;
}
