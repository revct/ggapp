import React from 'react';
import { View } from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';

export default function BottomSafeArea () {
  return <View style={{
    marginBottom: (getStatusBarHeight(true) > 20 ? 80 : 72),
  }}/>
}
