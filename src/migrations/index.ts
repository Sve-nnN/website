import * as migration_20260709_191127_initial from './20260709_191127_initial';
import * as migration_20260709_201401_phase2_i18n_seo from './20260709_201401_phase2_i18n_seo';

export const migrations = [
  {
    up: migration_20260709_191127_initial.up,
    down: migration_20260709_191127_initial.down,
    name: '20260709_191127_initial',
  },
  {
    up: migration_20260709_201401_phase2_i18n_seo.up,
    down: migration_20260709_201401_phase2_i18n_seo.down,
    name: '20260709_201401_phase2_i18n_seo'
  },
];
