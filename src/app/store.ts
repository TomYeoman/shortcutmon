import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';

// Ready to use if needed in future. For now, we're using local state
export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
  }
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
