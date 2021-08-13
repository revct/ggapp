import React from 'react';
import {View, StyleSheet} from 'react-native';
import {InitialProps, InitialState} from './interfaces';
import { sleep } from 'utils/Misc';
import Spinner from 'components/Spinner/Spinner';

export class Initial extends React.Component<InitialProps, InitialState> {

  componentDidMount() {
    this.setAuthenticated();
  }

  async setAuthenticated() {
    const {navigation} = this.props;
    await sleep(1400);
    // navigate to guest stack
    return navigation.navigate('AppStack');
  }

  render(){
    return (
      <View style={styles.container}>
        <Spinner />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});


export default Initial;
