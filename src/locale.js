import { createContext, useContext } from 'react';
import { content } from './i18n.js';

// Separate module (not App.jsx) so components can read locale without a
// circular import back into App.
export const LocaleCtx = createContext({ locale: 'zh', t: content.zh });

export const useT = () => useContext(LocaleCtx).t;
export const useLocale = () => useContext(LocaleCtx).locale;
