import { configure } from '@testing-library/react-native';

// CI always starts with a cold Babel/Jest transform cache, which makes the first
// render of heavy screens (e.g. WhereScreen) slow enough to blow the default
// 1s waitFor / 5s test budgets. Give them headroom so `pnpm verify` is stable.
configure({ asyncUtilTimeout: 5000 });
