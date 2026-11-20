import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
// Defines the background location task. Must load before the app renders.
import './src/tasks/backgroundLocation';
import App from './App';

registerRootComponent(App);
