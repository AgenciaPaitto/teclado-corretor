/**
 * Entry point único do bundle JS.
 * Registramos DOIS componentes raiz no mesmo bundle:
 *  • "CorretorApp"      → MainActivity / AppDelegate (login + configurações)
 *  • "CorretorKeyboard" → CustomKeyboardService / KeyboardViewController (IME)
 */
import { AppRegistry } from 'react-native';
import App from './src/app/App';
import CorretorKeyboard from './src/keyboard/CorretorKeyboard';

AppRegistry.registerComponent('CorretorApp', () => App);
AppRegistry.registerComponent('CorretorKeyboard', () => CorretorKeyboard);
