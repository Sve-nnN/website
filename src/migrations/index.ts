import * as migration_20260709_191127_initial from './20260709_191127_initial';
import * as migration_20260709_201401_phase2_i18n_seo from './20260709_201401_phase2_i18n_seo';
import * as migration_20260709_223458_phase3_cloudinary_media from './20260709_223458_phase3_cloudinary_media';
import * as migration_20260710_040235_phase5_header_footer_featured_authors from './20260710_040235_phase5_header_footer_featured_authors';

export const migrations = [
  {
    up: migration_20260709_191127_initial.up,
    down: migration_20260709_191127_initial.down,
    name: '20260709_191127_initial',
  },
  {
    up: migration_20260709_201401_phase2_i18n_seo.up,
    down: migration_20260709_201401_phase2_i18n_seo.down,
    name: '20260709_201401_phase2_i18n_seo',
  },
  {
    up: migration_20260709_223458_phase3_cloudinary_media.up,
    down: migration_20260709_223458_phase3_cloudinary_media.down,
    name: '20260709_223458_phase3_cloudinary_media',
  },
  {
    up: migration_20260710_040235_phase5_header_footer_featured_authors.up,
    down: migration_20260710_040235_phase5_header_footer_featured_authors.down,
    name: '20260710_040235_phase5_header_footer_featured_authors'
  },
];
