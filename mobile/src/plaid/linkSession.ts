/**
 * Native-only Plaid Link session. Web imports `linkSession.web.ts` instead (no native SDK).
 */
export {
  create,
  open,
  destroy,
  dismissLink,
  LinkIOSPresentationStyle,
} from "react-native-plaid-link-sdk";
