import {createAppContainer, createSwitchNavigator} from 'react-navigation';
import AppStack from './AppStack';
import Initial from 'components/Initial/Initial';

export default createAppContainer(
  createSwitchNavigator(
    {
      Initial: Initial,
      AppStack: AppStack,
    },
    {
      initialRouteName: 'Initial',
    },
  ),
);
