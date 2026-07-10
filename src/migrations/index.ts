import * as migration_20260709_191127_initial from './20260709_191127_initial';
import * as migration_20260709_201401_phase2_i18n_seo from './20260709_201401_phase2_i18n_seo';
import * as migration_20260709_223458_phase3_cloudinary_media from './20260709_223458_phase3_cloudinary_media';
import * as migration_20260710_040235_phase5_header_footer_featured_authors from './20260710_040235_phase5_header_footer_featured_authors';
import * as migration_20260710_040718_phase5_new_blocks_and_category_filter from './20260710_040718_phase5_new_blocks_and_category_filter';
import * as migration_20260710_042812_phase5_archive_block_empty_state from './20260710_042812_phase5_archive_block_empty_state';
import * as migration_20260710_043753_phase5_case_studies_author from './20260710_043753_phase5_case_studies_author';

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
    name: '20260710_040235_phase5_header_footer_featured_authors',
  },
  {
    up: migration_20260710_040718_phase5_new_blocks_and_category_filter.up,
    down: migration_20260710_040718_phase5_new_blocks_and_category_filter.down,
    name: '20260710_040718_phase5_new_blocks_and_category_filter',
  },
  {
    up: migration_20260710_042812_phase5_archive_block_empty_state.up,
    down: migration_20260710_042812_phase5_archive_block_empty_state.down,
    name: '20260710_042812_phase5_archive_block_empty_state',
  },
  {
    up: migration_20260710_043753_phase5_case_studies_author.up,
    down: migration_20260710_043753_phase5_case_studies_author.down,
    name: '20260710_043753_phase5_case_studies_author'
  },
];
