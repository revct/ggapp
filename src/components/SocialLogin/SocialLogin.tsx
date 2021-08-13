import React from 'react';
import {SocialLoginProps, SocialLoginState} from './interfaces';
import {
  TouchableWithoutFeedback,
  Image,
  StyleSheet,
  View,
  NativeModules,
} from 'react-native';
import {
  LoginManager,
  GraphRequest,
  GraphRequestManager,
} from 'react-native-fbsdk';
import {GoogleSignin, statusCodes} from '@react-native-community/google-signin';
import Logger from 'utils/Logger';
const {RNTwitterSignIn} = NativeModules;
const twitterLogo = require('../../assets/authentication/twitter.png');
const facebookLogo = require('../../assets/authentication/facebook.png');
const googleLogo = require('../../assets/authentication/google.png');
const TWITTER_COMSUMER_KEY = 'l6GuKJeDcFFea2yySe1ELWcIH';
const TWITTER_CONSUMER_SECRET =
  'sU0sW3cbJtWg3PVeZ5K2prrSdvC1IQ6EwrUskIM0MFyW60mHFj';

class SocialLogin extends React.Component<SocialLoginProps, SocialLoginState> {
  static defaultProps = {
    disableTwitter: true,
  };

  state: SocialLoginState = {
    isPending: false,
  };

  mounted: boolean = false;

  fbInfoRequest: GraphRequest;

  googleSignInConfigured: boolean = false;

  constructor(props: SocialLoginProps) {
    super(props);
    this.fbInfoRequest = new GraphRequest(
      '/me?fields=first_name,last_name,email,picture.type(large),id',
      null,
      this.handleGraphCallback,
    );
  }

  componentDidMount() {
    this.mounted = true;
  }

  handleTwitterSignIn = () => {
    const {onLogin, onLoginSuccess, onLoginFailure} = this.props;
    const {isPending} = this.state;
    if (isPending) {
      return;
    }
    this.setState(
      {
        isPending: true,
      },
      async () => {
        try {
          // fire on log in handler if available
          if (onLogin) {
            onLogin('twitter');
          }

          // initialize twitter
          RNTwitterSignIn.init(
            TWITTER_COMSUMER_KEY.trim(),
            TWITTER_CONSUMER_SECRET.trim(),
          );

          // perform twitter login
          const result = await RNTwitterSignIn.logIn();

          // stop if component had already unmounted
          if (!this.mounted) {
            return;
          }

          // toggle off pending mode
          this.setState(
            {
              isPending: false,
            },
            () => {
              if (onLoginSuccess) {
                onLoginSuccess('twitter', {
                  id: result.userID,
                  first_name: result.name || result.userName,
                  last_name: result.userName || '',
                  email: result.email,
                  avatar: result.avatar || '',
                });
              }
            },
          );
        } catch (e) {
          // stop if component is no longer mounted
          if (!this.mounted) {
            return;
          }

          // log error
          Logger(e);

          // toggle off pending mode
          this.setState(
            {
              isPending: false,
            },
            () => {
              // fire login erro handler if available
              if (onLoginFailure) {
                onLoginFailure('twitter', e.message);
              }
            },
          );
        }
      },
    );
  };

  handleGoogleSignIn = () => {
    const {onLogin, onLoginSuccess, onLoginFailure} = this.props;
    const {isPending} = this.state;
    // stop if already logging in
    if (isPending) {
      return;
    }

    // configure google sign in
    this.handleGoogleConfiguration();

    // set compoennt into pending mode
    this.setState(
      {
        isPending: true,
      },
      async () => {
        try {
          // wait and log user out
          await this.googleLogout();
          // fire on login handler if available
          if (onLogin) {
            onLogin('google');
          }
          // verify the availability of play services
          await GoogleSignin.hasPlayServices();

          // sign in with google
          const result = await GoogleSignin.signIn();

          // stop if component had already unmounted
          if (!this.mounted) {
            return;
          }

          // toggle off pending mode
          this.setState(
            {
              isPending: false,
            },
            () => {
              // fire log in success callback if available
              if (onLoginSuccess) {
                onLoginSuccess('google', {
                  id: result.user.id,
                  first_name: result.user.givenName,
                  last_name: result.user.familyName,
                  email: result.user.email,
                  avatar_url: result.user.photo,
                });
              }
            },
          );
        } catch (error) {
          // stop if user has already unmounted
          if (!this.mounted) {
            return;
          }

          // toggle of pending mode
          this.setState({isPending: false});

          Logger(error);

          // generic erro message as default error message
          let errorMessage =
            'Failed to sign you in with google,' +
            ' please try again in a moment.';

          // determine what kind of error occured
          if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            // set error message
            errorMessage === 'Google sign in was cancelled.';
          } else if (error.code === statusCodes.IN_PROGRESS) {
            // set error message
            errorMessage = 'An error occurred, please try again.';
            // log out
            await this.googleLogout();
          } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            // set error message
            errorMessage =
              'Google sign is not available on' + ' your version of android.';
            // log error
            Logger(
              new Error(
                'Play services not available or outdated for google sign in.',
              ),
            );
          } else {
            // some other error happened
          }

          // fire login failure handler if available
          if (onLoginFailure) {
            onLoginFailure('google', errorMessage);
          }
        }
      },
    );
  };

  handleGoogleConfiguration() {
    if (this.googleSignInConfigured) {
      return;
    }
    // configure google sign in
    GoogleSignin.configure({
      webClientId:
        '500495015855-bsc2r3pguc1od73ej051njr4k1231knk.apps.googleusercontent.com',
      offlineAccess: true,
      forceConsentPrompt: true,
    });
  }

  handleFacebookLogin = async () => {
    const {onLogin, onLoginFailure} = this.props;
    const {isPending} = this.state;
    // stop if already logging the user in
    if (isPending) {
      return false;
    }

    // fire on log in handler if available
    if (onLogin) {
      onLogin('facebook');
    }

    // Put compoennt in pending mode
    this.setState(
      {
        isPending: true,
      },
      async () => {
        try {
          // login with "public_profile" and "email" permissions
          const data = await LoginManager.logInWithPermissions([
            'public_profile',
            'email',
          ]);

          // when login is cancelled
          if (data.isCancelled) {
            throw new Error('Login was cancelled.');
          }

          // when there was an error logging in
          if (data.error) {
            throw new Error(data.error);
          }

          // when permission is declined
          if (
            data.declinedPermissions &&
            (data.declinedPermissions.indexOf('email') !== -1 ||
              data.declinedPermissions.indexOf('public_profile') !== -1)
          ) {
            throw new Error(
              'Access to your public profile and email is required for logging' +
                ' in with Facebook.',
            );
          }

          // stop if component had already unmounted
          if (!this.mounted) {
            return;
          }

          // start request to graphQl for user info
          this.startFbGraphRequest();
        } catch (e) {
          // stop if not mounted
          if (!this.mounted) {
            return;
          }

          // fire error callback if available
          if (onLoginFailure) {
            onLoginFailure('facebook', e.message);
          }

          // log error
          Logger(e);
          this.setState({
            isPending: false,
          });
        }
      },
    );
  };

  handleGraphCallback = (error?: object, result?: any) => {
    // log out previously logged in user if any
    LoginManager.logOut();

    // stop if component had already unmounted
    if (!this.mounted) {
      return;
    }
    // get handlers
    const {onLoginSuccess, onLoginFailure} = this.props;
    // remove component from pending mode
    this.setState(
      {
        isPending: false,
      },
      () => {
        if (error) {
          Logger(new Error(error.toString()));
          if (onLoginFailure) {
            onLoginFailure(
              'facebook',
              'Error fetching data: ' + error.toString(),
            );
          }
        } else if (result) {
          if (onLoginSuccess) {
            onLoginSuccess('facebook', {
              first_name: result.first_name,
              last_name: result.last_name,
              email: result.email,
              id: result.id,
              avatar:
                (result.picture &&
                  result.picture.data &&
                  result.picture.data.url) ||
                '',
            });
          }
        } else {
          Logger(new Error('Facebook log in returned nothing!'));
          if (onLoginFailure) {
            onLoginFailure('facebook', 'An unknown error occured.');
          }
        }
      },
    );
  };

  startFbGraphRequest() {
    new GraphRequestManager().addRequest(this.fbInfoRequest).start();
  }

  googleLogout = async (): Promise<boolean> => {
    try {
      // log previously logged in user out
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      return Promise.resolve(true);
    } catch (e) {
      Logger(e, false);
      return Promise.resolve(false);
    }
  };

  render() {
    const {
      containerStyle,
      disableFacebook,
      disableGoogle,
      disableTwitter,
      disabled,
    } = this.props;

    return (
      <View style={[styles.socialLogInOptions, containerStyle]}>
        {!disableFacebook ? (
          <TouchableWithoutFeedback
            onPress={this.handleFacebookLogin}
            disabled={disabled ? true : false}>
            <Image
              source={facebookLogo}
              style={styles.loginSocialLogIn}
              resizeMode="stretch"
            />
          </TouchableWithoutFeedback>
        ) : null}
        {!disableGoogle ? (
          <TouchableWithoutFeedback
            onPress={this.handleGoogleSignIn}
            disabled={disabled ? true : false}>
            <Image
              source={googleLogo}
              style={styles.loginSocialLogIn}
              resizeMode="stretch"
            />
          </TouchableWithoutFeedback>
        ) : null}
        {!disableTwitter ? (
          <TouchableWithoutFeedback
            onPress={this.handleTwitterSignIn}
            disabled={disabled ? true : false}>
            <Image
              source={twitterLogo}
              style={styles.loginSocialLogIn}
              resizeMode="stretch"
            />
          </TouchableWithoutFeedback>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  loginSocialLogIn: {
    width: 24,
    height: 24,
    marginHorizontal: 8,
  },
  socialLogInOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SocialLogin;
