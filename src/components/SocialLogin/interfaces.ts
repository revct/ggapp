import { ViewStyle } from "react-native";

export interface FacebookGraphQLInfoResponse {
  email: string,
  first_name: string,
  id: string,
  last_name: string
  picture: null | {
    data: null | {
      height: number
      is_silhouette: boolean
      url: string,
      width: number
    }
  }
};

export interface SocialLoginProps {
  disableGoogle?: 'disableGoogle' | boolean,
  disableTwitter?: 'disableTwitter' | boolean,
  disableFacebook?: 'disableFacebook' | boolean,
  containerStyle?: ViewStyle,
  disabled?: 'disabled' | boolean,
  onLogin?: (provider: 'facebook' | 'twitter' | 'google') => void,
  onLoginSuccess?: (provider: 'facebook' | 'twitter' | 'google', data: any) => void,
  onLoginFailure?: (provider: 'facebook' | 'twitter' | 'google', error: string) => void,
}

export interface SocialLoginState {
  isPending: boolean,
}
