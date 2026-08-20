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
import * as migration_20260711_201023_phase12_author_eeat_fields from './20260711_201023_phase12_author_eeat_fields';
import * as migration_20260711_204216_phase12_speaking_events from './20260711_204216_phase12_speaking_events';
import * as migration_20260711_224308_phase13_about_features_faq from './20260711_224308_phase13_about_features_faq';
import * as migration_20260712_001122_phase14_target_keyword_field from './20260712_001122_phase14_target_keyword_field';
import * as migration_20260712_070605_phase18_authors_seo_meta from './20260712_070605_phase18_authors_seo_meta';
import * as migration_20260712_202954_phase19_calltoaction_localized from './20260712_202954_phase19_calltoaction_localized';
import * as migration_20260712_211605_phase_mcp_plugin from './20260712_211605_phase_mcp_plugin';
import * as migration_20260713_005924 from './20260713_005924';
import * as migration_20260713_022605 from './20260713_022605';
import * as migration_20260714_023126_phase33_local_landing_components from './20260714_023126_phase33_local_landing_components';
import * as migration_20260714_163429 from './20260714_163429';
import * as migration_20260714_170202 from './20260714_170202';
import * as migration_20260714_200158 from './20260714_200158';
import * as migration_20260714_200220_phase29_casestudies_services_localized from './20260714_200220_phase29_casestudies_services_localized';
import * as migration_20260725_155512_add_missing_media_columns from './20260725_155512_add_missing_media_columns';
import * as migration_20260819_195425_home_code_fixes_audit_offer from './20260819_195425_home_code_fixes_audit_offer';
import * as migration_20260819_204307_clientes_featured from './20260819_204307_clientes_featured';
import * as migration_20260820_000041_blog_promo_and_category_rows from './20260820_000041_blog_promo_and_category_rows';
import * as migration_20260820_001837_blog_promo_inline_title_and_rail from './20260820_001837_blog_promo_inline_title_and_rail';
import * as migration_20260820_153557_blog_promo_by_category from './20260820_153557_blog_promo_by_category';
import * as migration_20260820_155934_subscribers_collection from './20260820_155934_subscribers_collection';

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
    name: '20260710_165940_phase10_8_hero_cta_breadcrumbs',
  },
  {
    up: migration_20260711_201023_phase12_author_eeat_fields.up,
    down: migration_20260711_201023_phase12_author_eeat_fields.down,
    name: '20260711_201023_phase12_author_eeat_fields',
  },
  {
    up: migration_20260711_204216_phase12_speaking_events.up,
    down: migration_20260711_204216_phase12_speaking_events.down,
    name: '20260711_204216_phase12_speaking_events',
  },
  {
    up: migration_20260711_224308_phase13_about_features_faq.up,
    down: migration_20260711_224308_phase13_about_features_faq.down,
    name: '20260711_224308_phase13_about_features_faq',
  },
  {
    up: migration_20260712_001122_phase14_target_keyword_field.up,
    down: migration_20260712_001122_phase14_target_keyword_field.down,
    name: '20260712_001122_phase14_target_keyword_field',
  },
  {
    up: migration_20260712_070605_phase18_authors_seo_meta.up,
    down: migration_20260712_070605_phase18_authors_seo_meta.down,
    name: '20260712_070605_phase18_authors_seo_meta',
  },
  {
    up: migration_20260712_202954_phase19_calltoaction_localized.up,
    down: migration_20260712_202954_phase19_calltoaction_localized.down,
    name: '20260712_202954_phase19_calltoaction_localized',
  },
  {
    up: migration_20260712_211605_phase_mcp_plugin.up,
    down: migration_20260712_211605_phase_mcp_plugin.down,
    name: '20260712_211605_phase_mcp_plugin',
  },
  {
    up: migration_20260713_005924.up,
    down: migration_20260713_005924.down,
    name: '20260713_005924',
  },
  {
    up: migration_20260713_022605.up,
    down: migration_20260713_022605.down,
    name: '20260713_022605',
  },
  {
    up: migration_20260714_023126_phase33_local_landing_components.up,
    down: migration_20260714_023126_phase33_local_landing_components.down,
    name: '20260714_023126_phase33_local_landing_components',
  },
  {
    up: migration_20260714_163429.up,
    down: migration_20260714_163429.down,
    name: '20260714_163429',
  },
  {
    up: migration_20260714_170202.up,
    down: migration_20260714_170202.down,
    name: '20260714_170202',
  },
  {
    up: migration_20260714_200158.up,
    down: migration_20260714_200158.down,
    name: '20260714_200158',
  },
  {
    up: migration_20260714_200220_phase29_casestudies_services_localized.up,
    down: migration_20260714_200220_phase29_casestudies_services_localized.down,
    name: '20260714_200220_phase29_casestudies_services_localized',
  },
  {
    up: migration_20260725_155512_add_missing_media_columns.up,
    down: migration_20260725_155512_add_missing_media_columns.down,
    name: '20260725_155512_add_missing_media_columns',
  },
  {
    up: migration_20260819_195425_home_code_fixes_audit_offer.up,
    down: migration_20260819_195425_home_code_fixes_audit_offer.down,
    name: '20260819_195425_home_code_fixes_audit_offer',
  },
  {
    up: migration_20260819_204307_clientes_featured.up,
    down: migration_20260819_204307_clientes_featured.down,
    name: '20260819_204307_clientes_featured',
  },
  {
    up: migration_20260820_000041_blog_promo_and_category_rows.up,
    down: migration_20260820_000041_blog_promo_and_category_rows.down,
    name: '20260820_000041_blog_promo_and_category_rows',
  },
  {
    up: migration_20260820_001837_blog_promo_inline_title_and_rail.up,
    down: migration_20260820_001837_blog_promo_inline_title_and_rail.down,
    name: '20260820_001837_blog_promo_inline_title_and_rail',
  },
  {
    up: migration_20260820_153557_blog_promo_by_category.up,
    down: migration_20260820_153557_blog_promo_by_category.down,
    name: '20260820_153557_blog_promo_by_category',
  },
  {
    up: migration_20260820_155934_subscribers_collection.up,
    down: migration_20260820_155934_subscribers_collection.down,
    name: '20260820_155934_subscribers_collection'
  },
];
