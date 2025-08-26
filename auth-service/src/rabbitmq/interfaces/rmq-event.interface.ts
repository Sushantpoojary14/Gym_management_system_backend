export interface RmqEvent {
  pattern: string;
  data: any;
  timestamp: string;
}

export enum AuthEventPatterns {
  USER_REGISTERED = 'auth.user.registered',
  USER_LOGGED_IN = 'auth.user.logged_in',
  USER_LOGGED_OUT = 'auth.user.logged_out',
  USER_PASSWORD_CHANGED = 'auth.user.password_changed',
  USER_PROFILE_UPDATED = 'auth.user.profile_updated',
}
