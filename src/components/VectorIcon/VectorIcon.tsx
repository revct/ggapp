import React from 'react';
import propTypes from 'prop-types';
import IonIcons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import { VectorIconProps } from './interfaces';


const VectorIcon:React.FC<VectorIconProps> = function VectorIcon({
  type,
  ...props
}):React.ReactNode {

  // use font awesome four
  if(type === 'font-awesome'){
    return <FontAwesome {...props} />
  }

  // use font awesome five
  if(type === 'font-awesome-five'){
    return <FontAwesome5 {...props} />
  }

  // use feather icons
  if(type === 'feather'){
    return <Feather {...props} />
  }

  // return nothing if icon type is unknown
  return <IonIcons {...props} />
};

// component default props
VectorIcon.defaultProps = {
  type: 'mdi'
}

// Set component proptypes
VectorIcon.propTypes = {
  type: propTypes.oneOf([
    'mdi',
    'feather',
    'ion-icons',
    'font-awesome',
    'font-awesome-five'
  ]).isRequired,
};

// export vector icon as default
export default VectorIcon;
