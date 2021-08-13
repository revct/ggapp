/**
 * This default namespace for all app
 * storage data.
 * @var string
 */
export const STORE_NAME = '@GOGenesisApp';

/**
 * These are the available keys for the
 * different storage data.
 * @var enum
 */
export enum STORE_KEYS {
  AUTHENTICATED = ':AUTHENTICATED',
  CINEMAS = ':CINEMAS',
  CUSTOMER = ':CUSTOMER',
  CINEMA_SITE = ':CINEMA_SITE',
  POINTS_TOKEN = ':LOYALTY_API_TOKEN:{userId}',
  SELECTED_CINEMA = ':SELECTED_CINEMA',
  TICKETS_HISTORY = ':TICKETS_HISTORY:{userId}',
  BOOKING_HISTORY = ':BOOKING_HISTORY:{userId}',
  LAST_GUEST = ':LAST_GUEST:{userId}',
  REMOTE_CONFIG = ':REMOTE_CONFIG:{key}',
  LAST_RESTAURANT = ':LAST_RESTAURANT',
  ASK_FOR_CRASHLYTICS = ':ASK_FOR_CRASHLYTICS',
  LAST_AREA = ':LAST_AREA:{restaurant}',
}
