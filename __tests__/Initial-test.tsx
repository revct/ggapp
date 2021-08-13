import 'react-native';
import React from 'react';
import {act, create, ReactTestRenderer} from 'react-test-renderer';
import { Initial } from 'components/Initial/Initial';
import { NavigationParams } from 'react-navigation';

describe('Initial Screen', () => {
  describe('Rendering', () => {
    it('should render correctly', () => {
      let component:ReactTestRenderer;
      act(() => {
        component = create(<Initial
          auth={{
            token: null,
            setToken: jest.fn((token:string) => {})
          }}
          navigation={{
            navigate: (options:NavigationParams):any => true
          }}
        />)
      })
      expect(component.toJSON()).toMatchSnapshot();
    })
  })
});
