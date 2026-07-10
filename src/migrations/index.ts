import * as migration_20260709_191127_initial from './20260709_191127_initial';
import * as migration_20260709_201401_phase2_i18n_seo from './20260709_201401_phase2_i18n_seo';
import * as migration_20260709_223458_phase3_cloudinary_media from './20260709_223458_phase3_cloudinary_media';
import * as migration_20260710_040235_phase5_header_footer_featured_authors from './20260710_040235_phase5_header_footer_featured_authors';
import * as migration_20260710_040718_phase5_new_blocks_and_category_filter from './20260710_040718_phase5_new_blocks_and_category_filter';
import * as migration_20260710_042812_phase5_archive_block_empty_state from './20260710_042812_phase5_archive_block_empty_state';
import * as migration_20260710_043753_phase5_case_studies_author from './20260710_043753_phase5_case_studies_author';
import * as migration_20260710_044516_phase5_search_plugin from './20260710_044516_phase5_search_plugin';
import * as migration_20260710_050300_phase5_content_block_localized_richtext from './20260710_050300_phase5_content_block_localized_richtext';
import * as migration_20260710_150154_phase10_5_footer_dynamic_columns from './20260710_150154_phase10_5_footer_dynamic_columns';
import * as migration_20260710_164937_phase10_7_about_testimonial_sections from './20260710_164937_phase10_7_about_testimonial_sections';
import * as migration_20260710_165940_phase10_8_hero_cta_breadcrumbs from './20260710_165940_phase10_8_hero_cta_breadcrumbs';

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
    name: '20260710_043753_phase5_case_studies_author',
  },
  {
    up: migration_20260710_044516_phase5_search_plugin.up,
    down: migration_20260710_044516_phase5_search_plugin.down,
    name: '20260710_044516_phase5_search_plugin',
  },
  {
    up: migration_20260710_050300_phase5_content_block_localized_richtext.up,
    down: migration_20260710_050300_phase5_content_block_localized_richtext.down,
    name: '20260710_050300_phase5_content_block_localized_richtext',
  },
  {
    up: migration_20260710_150154_phase10_5_footer_dynamic_columns.up,
    down: migration_20260710_150154_phase10_5_footer_dynamic_columns.down,
    name: '20260710_150154_phase10_5_footer_dynamic_columns',
  },
  {
    up: migration_20260710_164937_phase10_7_about_testimonial_sections.up,
    down: migration_20260710_164937_phase10_7_about_testimonial_sections.down,
    name: '20260710_164937_phase10_7_about_testimonial_sections',
  },
  {
    up: migration_20260710_165940_phase10_8_hero_cta_breadcrumbs.up,
    down: migration_20260710_165940_phase10_8_hero_cta_breadcrumbs.down,
    name: '20260710_165940_phase10_8_hero_cta_breadcrumbs'
  },
];
