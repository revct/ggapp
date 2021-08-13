import {NavigationStackScreenProps} from 'react-navigation-stack';
import {NavigationParams} from 'react-navigation';
import {UserInterface} from 'contexts/UserContext';

export type ProfileFormFields =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'username'
  | 'address'
  | 'city'
  | 'state'
  | 'password'
  | 'passwordConfirmation';

export type ProfileRules = {
  [key in ProfileFormFields]?: Array<(v: string) => false | string>
};

export type ProfileValidationItem = {
  name: ProfileFormFields;
  error: false | string;
};

export interface ProfileProps
  extends NavigationStackScreenProps<NavigationParams> {
  user: UserInterface;
  setUser: (user: UserInterface) => void;
}

export interface ProfileState {
  isPending: boolean;
  editingUsername: boolean;
  form: {[key in ProfileFormFields]?: string};
  edited: Array<ProfileFormFields>;
}
