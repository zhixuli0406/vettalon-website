import { createContext } from 'react';
import { initialReviewState } from '../review-demo.js';
export const ReviewCtx = createContext({ state: initialReviewState, dispatch: () => {} });
