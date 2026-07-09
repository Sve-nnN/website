import * as migration_20260709_191127_initial from './20260709_191127_initial';

export const migrations = [
  {
    up: migration_20260709_191127_initial.up,
    down: migration_20260709_191127_initial.down,
    name: '20260709_191127_initial'
  },
];
