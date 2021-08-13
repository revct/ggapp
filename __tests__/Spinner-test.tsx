import 'react-native';
import React from 'react';
import {act, create} from 'react-test-renderer';
import {Spinner} from '../src/components/Spinner/Spinner';

describe('Spinner', () => {
  describe('Rendering', () => {
    it('should match snapshot', () => {
      let component:any;
      act(() => {
        component = create(<Spinner />);
      });
      expect(component.toJSON()).toMatchSnapshot();
      act(() => {
        component.update(<Spinner size="large" />);
      });
      expect(component.toJSON()).toMatchSnapshot();
    });
  });
});
