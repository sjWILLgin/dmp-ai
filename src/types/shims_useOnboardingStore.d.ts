declare module '../store/useOnboardingStore' {
  import { useOnboardingStore as _useOnboardingStore } from '../store/useOnboardingStore'
  export const useOnboardingStore: typeof _useOnboardingStore
  export type DataSource = import('../store/useOnboardingStore').DataSource
  export type DiscoveredTable = import('../store/useOnboardingStore').DiscoveredTable
  export type State = import('../store/useOnboardingStore').State
}
