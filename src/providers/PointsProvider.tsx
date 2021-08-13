import React from 'react';
import { PointsContextProvider } from 'contexts/PointsContext';
import { withUser, UserInterface } from 'contexts/UserContext';
import { sleep } from 'utils/Misc';
import PointsAuthenticate from 'api/PointsAuthenticate'
import Axios from 'axios';
import Toast from 'utils/Toast';
import GetPoints from 'api/GetPoints';
import isEqual from 'lodash/isEqual';

interface PointsProviderState {
  isGettingToken: boolean,
  isGettingPoints: boolean,
  points: number | null,
  token: string | null,
}

interface PointsProviderProps {
  user: UserInterface
}
class PointsProvider extends React.Component<PointsProviderProps, PointsProviderState> {
  state: PointsProviderState = {
    isGettingToken: false,
    isGettingPoints: false,
    points: null,
    token: null,
  };

  authenticate: PointsAuthenticate;

  totalPoints: GetPoints;

  constructor(props:PointsProviderProps) {
    super(props);
    this.authenticate = new PointsAuthenticate;
    this.totalPoints = new GetPoints;
  }

  componentDidMount() {
    this.getToken();
  }

  componentDidUpdate(prevProps:PointsProviderProps, prevState:PointsProviderState) {
    if(!isEqual(prevProps.user, this.props.user) && !this.state.isGettingToken) {
      this.getToken(() => this.getTotalPoints());
    }
  }

  componentWillUnmount() {
    this.authenticate.cancel();
    this.totalPoints.cancel();
  }

  getTotalPoints = async () => {
    const {user} = this.props;
    const {isGettingPoints, token} = this.state;
    if(!user || !user.billing.phone || isGettingPoints) {
      return;
    }
    if(!token) {
      this.getToken(() => this.getTotalPoints());
      return;
    }
    // toggle component auth pending state on
    this.setState({isGettingPoints: true});

    // wait for component state to change
    await sleep(200);

    // get auth token
    try {
      // get total points
      const result = await this.totalPoints.fetch(token);

      // add token to state and toggle off pending
      this.setState({
        isGettingPoints: false,
        points: result
      });
    } catch(e) {
      // toggle off pending mode
      this.setState({
        isGettingPoints: false,
        points: null
      });
    }
  }

  getToken = async (afterSuccess?: () => void, afterFailure?: (error:string) => void) => {
    const {user} = this.props;
    const {isGettingToken} = this.state;
    if(!user || !user.billing.phone || isGettingToken) {
      return;
    }
    // toggle component auth pending state on
    this.setState({isGettingToken: true});

    // wait for component state to change
    await sleep(200);

    // get auth token
    try {
      const auth = await this.authenticate.fetch(user.billing.phone);

      // add token to state and toggle off pending
      this.setState({
        isGettingToken: false,
        token: auth.token
      }, () => {
        if(afterSuccess) {
          afterSuccess();
        }
      });
    } catch(e) {
      // stop if request was cancelled
      if(Axios.isCancel(e) || e.message === 'cancelled') {
        return;
      }

      // get error message
      let errorMessage = e.message;

      // use response error message if available
      if(e.response || e.response.message) {
        errorMessage = e.response.message;
      }

      // display proper network error
      if(/network/i.test(errorMessage)) {
        errorMessage = 'Please check your internet connection and try again.';
      }

      // toggle off pending mode
      this.setState({isGettingToken: false});

      // delay action for two ms
      await sleep(200);

      // display error message
      if(afterFailure) {
        afterFailure(errorMessage);
        return;
      }
      Toast.alert(errorMessage);
    }
  }

  render() {
    const { points, token, isGettingToken, isGettingPoints } = this.state;
    return (
      <PointsContextProvider
        value={{
          pointsToken: token,
          isGettingToekn: isGettingToken,
          totalPoints: points || 0,
          isGettingPoints: isGettingPoints,
          getTotalPoints: this.getTotalPoints,
          getPointsToken: this.getToken
        }}>
        {this.props.children}
      </PointsContextProvider>
    );
  }
}

export default withUser(PointsProvider);
