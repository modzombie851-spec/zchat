begin;

alter table public.posts add column if not exists song jsonb;
do $sg$
begin
  if not exists (select 1 from pg_constraint where conname = 'zchat_posts_song_ok' and conrelid = 'public.posts'::regclass) then
    alter table public.posts add constraint zchat_posts_song_ok check (song is null or (jsonb_typeof(song) = 'object' and pg_column_size(song) <= 2048));
  end if;
end $sg$;

alter table public.zchat_post_tags drop constraint if exists zchat_post_tags_status_check;
alter table public.zchat_post_tags add constraint zchat_post_tags_status_check check (status in ('pending', 'approved', 'removed', 'hidden'));

create or replace function public.zchat_tag_decide(p_tag uuid, p_action text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  t record;
begin
  if me is null or p_tag is null or p_action not in ('approve', 'remove', 'hide') then return false; end if;
  select * into t from public.zchat_post_tags where id = p_tag for update;
  if not found or t.user_id <> me then return false; end if;
  if p_action = 'approve' then
    if t.status = 'removed' then return false; end if;
    update public.zchat_post_tags set status = 'approved', decided_at = now() where id = p_tag;
  elsif p_action = 'hide' then
    if t.status = 'removed' then return false; end if;
    update public.zchat_post_tags set status = 'hidden', decided_at = now() where id = p_tag;
  else
    update public.zchat_post_tags set status = 'removed', decided_at = now() where id = p_tag;
    delete from public.notifications n where n.user_id = me and n.kind = 'photo_tag' and n.meta ->> 'tag' = p_tag::text;
  end if;
  return true;
end $$;
revoke all on function public.zchat_tag_decide(uuid, text) from public, anon;
grant execute on function public.zchat_tag_decide(uuid, text) to authenticated;

create or replace function public.zchat_collab_leave(p_post uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or p_post is null then return false; end if;
  update public.posts set collab_status = 'declined' where id = p_post and collab_id = me and collab_status = 'accepted';
  return found;
end $$;
revoke all on function public.zchat_collab_leave(uuid) from public, anon;
grant execute on function public.zchat_collab_leave(uuid) to authenticated;

create or replace function public.zchat_db_manifest()
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  fn_app text[] := array[
    'admin_add_knowledge', 'admin_ban', 'admin_bot_knowledge_count', 'admin_broadcast', 'admin_delete_content', 'admin_delete_row',
    'admin_delete_user', 'admin_grant_reward', 'admin_lift_restriction', 'admin_list_tables', 'admin_log_action', 'admin_recent_log',
    'admin_remove_user_messages', 'admin_restrict', 'admin_revoke_reward', 'admin_send_mail', 'admin_set_admin', 'admin_set_verified',
    'admin_sign_out_user', 'admin_stats', 'admin_table_rows', 'admin_unban', 'admin_update_profile', 'admin_update_row',
    'admin_user_messages', 'admin_user_overview', 'ga2_create', 'is_blocked', 'public_post_preview', 'public_profile_decor',
    'public_profile_preview', 'send_bio_mention', 'send_report_warning', 'zchat_admin_coins', 'zchat_admin_db_check', 'zchat_admin_grant',
    'zchat_admin_health', 'zchat_admin_health_set', 'zchat_admin_login_approval_off', 'zchat_admin_photo_flags', 'zchat_admin_photo_review', 'zchat_admin_revoke',
    'zchat_admin_take_coins', 'zchat_admin_wallet', 'zchat_age_terms_save', 'zchat_age_terms_state', 'zchat_aiphoto_job', 'zchat_answer_question',
    'zchat_ask', 'zchat_bag_open', 'zchat_bag_send', 'zchat_bags', 'zchat_bday_candidates', 'zchat_bday_card_for',
    'zchat_bday_card_get', 'zchat_bday_card_invite', 'zchat_bday_card_mark', 'zchat_bday_card_sign', 'zchat_bday_card_start', 'zchat_bday_card_unsign',
    'zchat_bday_cards_mine', 'zchat_bday_gift_cancel', 'zchat_bday_gift_save', 'zchat_board_add', 'zchat_booth_clock', 'zchat_booth_join',
    'zchat_booth_leave', 'zchat_booth_open', 'zchat_booth_shot', 'zchat_booth_start', 'zchat_booth_state', 'zchat_break_check',
    'zchat_break_start', 'zchat_buy_deal', 'zchat_buy_drop', 'zchat_buy_item', 'zchat_buy_match_pair', 'zchat_buy_set',
    'zchat_buy_wrap', 'zchat_call_link', 'zchat_can_dm', 'zchat_can_interact', 'zchat_capsule_send', 'zchat_capsules_get',
    'zchat_channel_post_stats', 'zchat_channels', 'zchat_character_report', 'zchat_chat_list', 'zchat_chat_wallpaper', 'zchat_check_achievements',
    'zchat_check_chat_pin', 'zchat_chip_cancel', 'zchat_chip_pay', 'zchat_chip_start', 'zchat_chips', 'zchat_cl_plan_cancel',
    'zchat_cl_plan_rsvp', 'zchat_cl_plan_send', 'zchat_cl_plans_get', 'zchat_claim_free_bubble', 'zchat_claim_free_set', 'zchat_claim_invite',
    'zchat_claim_milestone', 'zchat_cm_lt_key', 'zchat_cm_sched_claim', 'zchat_cm_wait', 'zchat_code_create', 'zchat_code_redeem',
    'zchat_code_set', 'zchat_collab_leave', 'zchat_collab_respond', 'zchat_community_add_group', 'zchat_community_add_members', 'zchat_community_admin_set', 'zchat_community_create',
    'zchat_community_delete', 'zchat_community_edit', 'zchat_community_invite', 'zchat_community_invite_reset', 'zchat_community_join', 'zchat_community_join_group',
    'zchat_community_leave', 'zchat_community_mine', 'zchat_community_new_group', 'zchat_community_page', 'zchat_community_remove_group', 'zchat_community_remove_member',
    'zchat_compliment_send', 'zchat_compliment_set', 'zchat_compliments_mine', 'zchat_contacts_get', 'zchat_contacts_match', 'zchat_contacts_set_email',
    'zchat_contacts_set_phone', 'zchat_cr_chat_state', 'zchat_cr_group_join', 'zchat_cr_group_price', 'zchat_cr_me', 'zchat_cr_member_cancel',
    'zchat_cr_member_ids', 'zchat_cr_member_join', 'zchat_cr_msg_send', 'zchat_cr_pack_buy', 'zchat_cr_pack_sell', 'zchat_cr_pack_stop',
    'zchat_cr_packs_bought', 'zchat_cr_packs_top', 'zchat_cr_page', 'zchat_cr_settings_save', 'zchat_cr_shout_decline', 'zchat_cr_shout_deliver',
    'zchat_cr_shout_order', 'zchat_ct_remove', 'zchat_ct_summary', 'zchat_daily_reward', 'zchat_deal_today', 'zchat_delete_question',
    'zchat_dm_unread', 'zchat_edit_history', 'zchat_edition_left', 'zchat_equip_charm', 'zchat_friend_ranks', 'zchat_g1_clock_start',
    'zchat_g1_join_answer', 'zchat_g1_nick_clear', 'zchat_g1_pending_drop', 'zchat_g1_review', 'zchat_g1_rules_accept', 'zchat_g1_send',
    'zchat_g1_sudoku_done', 'zchat_game_kit_get', 'zchat_game_kit_of', 'zchat_game_kit_set', 'zchat_game_pair_counts', 'zchat_game_xp_finish',
    'zchat_game_xp_levels', 'zchat_game_xp_mine', 'zchat_gh_bot_move', 'zchat_gh_end', 'zchat_gh_get', 'zchat_gh_live',
    'zchat_gh_move', 'zchat_gh_new', 'zchat_gh_secret', 'zchat_gh_tour_cancel', 'zchat_gh_tour_join', 'zchat_gh_tour_new',
    'zchat_gh_tour_start', 'zchat_gift_item', 'zchat_gift_send', 'zchat_group_add_members', 'zchat_group_create', 'zchat_group_delete',
    'zchat_group_invite', 'zchat_group_kick', 'zchat_group_leave', 'zchat_group_member_mute', 'zchat_group_read', 'zchat_group_read_mark',
    'zchat_group_reads_get', 'zchat_group_role_set', 'zchat_group_transfer', 'zchat_group_update', 'zchat_grp_emoji_add', 'zchat_grp_emoji_remove',
    'zchat_grp_kw_any', 'zchat_grp_link_delete', 'zchat_grp_link_save', 'zchat_guestbook_decide', 'zchat_guestbook_delete', 'zchat_guestbook_page',
    'zchat_guestbook_write', 'zchat_import_add', 'zchat_import_finish', 'zchat_import_remove', 'zchat_import_start', 'zchat_join_group',
    'zchat_joke_save', 'zchat_leaderboard', 'zchat_listen_clock', 'zchat_live_ask', 'zchat_live_beat', 'zchat_live_clear',
    'zchat_live_comment', 'zchat_live_end', 'zchat_live_friends', 'zchat_live_get', 'zchat_live_gift', 'zchat_live_goal_end',
    'zchat_live_goal_set', 'zchat_live_moderate', 'zchat_live_now', 'zchat_live_poll_end', 'zchat_live_poll_now', 'zchat_live_poll_start',
    'zchat_live_poll_vote', 'zchat_live_question_set', 'zchat_live_questions', 'zchat_live_set', 'zchat_live_start', 'zchat_live_supporters',
    'zchat_live_supporters_show', 'zchat_live_thank', 'zchat_local_time', 'zchat_local_times', 'zchat_login_approval_set', 'zchat_login_approval_state',
    'zchat_login_codes_confirm', 'zchat_login_codes_new', 'zchat_login_decide', 'zchat_login_pending', 'zchat_login_recovery', 'zchat_lookalike',
    'zchat_lookalike_many', 'zchat_lost_streaks', 'zchat_match_pairs', 'zchat_match_with', 'zchat_memories', 'zchat_milestones',
    'zchat_mod_delete', 'zchat_mod_mute', 'zchat_mod_pin', 'zchat_mod_review_join', 'zchat_moment_add', 'zchat_msg_link',
    'zchat_my_avatar_anim', 'zchat_my_games', 'zchat_my_profile', 'zchat_my_questions', 'zchat_note_device', 'zchat_note_save',
    'zchat_passkey_remove', 'zchat_pf_extras', 'zchat_pf_tz_set', 'zchat_photo_find', 'zchat_photos_set', 'zchat_pin_message',
    'zchat_pin_post', 'zchat_place_feed', 'zchat_plan_cancel', 'zchat_plan_create', 'zchat_plan_edit', 'zchat_plan_get',
    'zchat_plan_list', 'zchat_plan_push', 'zchat_plan_remind', 'zchat_plan_room_open', 'zchat_playlist_add', 'zchat_poll_counts',
    'zchat_poll_finish', 'zchat_post_count', 'zchat_post_event', 'zchat_post_insights', 'zchat_post_place', 'zchat_post_poll_vote',
    'zchat_post_view_counts', 'zchat_post_views', 'zchat_profile_view', 'zchat_push_forget', 'zchat_push_save', 'zchat_qr_claim',
    'zchat_qr_devices', 'zchat_qr_logout', 'zchat_rec_deny', 'zchat_rec_for_me', 'zchat_rec_friend_code', 'zchat_rec_owner_cancel',
    'zchat_recap', 'zchat_record_game', 'zchat_restore_streak', 'zchat_review_join', 'zchat_revoke_device', 'zchat_roll',
    'zchat_room_join', 'zchat_room_kick', 'zchat_room_list', 'zchat_room_lobby', 'zchat_room_open', 'zchat_room_ping',
    'zchat_room_quick', 'zchat_room_set', 'zchat_room_set_enabled', 'zchat_room_state', 'zchat_room_sync', 'zchat_safety_end',
    'zchat_safety_extend', 'zchat_safety_loc', 'zchat_safety_start', 'zchat_santa_cancel', 'zchat_santa_join', 'zchat_santa_pick',
    'zchat_santa_start', 'zchat_santas', 'zchat_score', 'zchat_search_pref_get', 'zchat_search_pref_set', 'zchat_sender_signals',
    'zchat_session_claim', 'zchat_session_state', 'zchat_set_member_title', 'zchat_shared_add', 'zchat_shared_create', 'zchat_shared_remove',
    'zchat_shared_update', 'zchat_shop_list', 'zchat_shop_owners', 'zchat_shop_popular', 'zchat_snooze', 'zchat_spend_allow',
    'zchat_spend_limit', 'zchat_spend_limit_set', 'zchat_spend_pin', 'zchat_status_set', 'zchat_story_of_us', 'zchat_story_results',
    'zchat_streaks', 'zchat_streaks2', 'zchat_submit_score', 'zchat_tag_decide', 'zchat_tagged_posts', 'zchat_time_create',
    'zchat_time_pick', 'zchat_time_vote', 'zchat_tip_post', 'zchat_tip_summary', 'zchat_trade_cards', 'zchat_trade_offer',
    'zchat_trade_respond', 'zchat_trade_setup', 'zchat_trending_tags', 'zchat_trusted_list', 'zchat_trusted_set', 'zchat_unsnooze',
    'zchat_verified_gift_start', 'zchat_visit_profile', 'zchat_voice_intro_clear', 'zchat_voice_intro_say', 'zchat_voice_intro_set', 'zchat_wallet',
    'zchat_watch_add', 'zchat_watch_mark', 'zchat_watch_react', 'zchat_watch_remove', 'zchat_xw_get', 'zchat_xw_put',
    'zchat_zap_call', 'zchat_zap_catch', 'zchat_zap_draw', 'zchat_zap_end', 'zchat_zap_hand', 'zchat_zap_join',
    'zchat_zap_nudge', 'zchat_zap_pass', 'zchat_zap_play', 'zchat_zap_start', 'zchat_zapm_catch', 'zchat_zapm_draw',
    'zchat_zapm_nudge', 'zchat_zapm_pass', 'zchat_zapm_play'
  ]::text[];
  fn_srv text[] := array[
    'bot_find_knowledge', 'ga2_chain_srv', 'zchat_ai_bump', 'zchat_aiphoto_take', 'zchat_birthday_targets', 'zchat_character_bump',
    'zchat_character_mark_checked', 'zchat_claim_job', 'zchat_credit_order', 'zchat_digest_due', 'zchat_digest_mark', 'zchat_email_unsub',
    'zchat_export_begin', 'zchat_export_done', 'zchat_link_lookup', 'zchat_link_store', 'zchat_moment_targets', 'zchat_passkey_add',
    'zchat_passkey_challenge_new', 'zchat_passkey_challenge_take', 'zchat_passkey_fail', 'zchat_passkey_ids', 'zchat_passkey_lookup', 'zchat_passkey_used',
    'zchat_photo_begin', 'zchat_photo_claim', 'zchat_photo_done', 'zchat_photo_labels_put', 'zchat_photo_labels_todo', 'zchat_rec_cancel',
    'zchat_rec_check', 'zchat_rec_email', 'zchat_rec_mark_done', 'zchat_rec_ready', 'zchat_rec_start', 'zchat_rec_status',
    'zchat_refund_order', 'zchat_session_state_for', 'zchat_set_verified_sub', 'zchat_signup_precheck', 'zchat_verified_gift_paid', 'zchat_verified_gift_refund'
  ]::text[];
  tbls text[] := array[
    'achievements', 'admins', 'ai_character_messages', 'ai_characters', 'ai_flash_decks', 'ai_images',
    'ai_link_cache', 'ai_photo_jobs', 'ai_practice_sessions', 'album_photos', 'albums', 'birthday_gifts',
    'birthdays', 'blocks', 'bot_knowledge', 'broadcast_lists', 'call_hides', 'calls',
    'channel_follows', 'channel_post_likes', 'channel_posts', 'channels', 'chat_accepts', 'chat_imports',
    'chat_locks', 'client_errors', 'close_friends', 'coin_ledger', 'community_members', 'contact_nicknames',
    'conversations', 'creator_members', 'creator_packs', 'creator_settings', 'creator_shoutouts', 'device_keys',
    'drop_reminders', 'drops', 'follows', 'gift_codes', 'group_entry_payments', 'group_join_requests',
    'group_members', 'groups', 'hidden_messages', 'highlight_items', 'highlight_likes', 'highlights',
    'imported_messages', 'mails', 'message_likes', 'message_reports', 'messages', 'notes',
    'notifications', 'passkeys', 'photo_labels', 'post_comment_likes', 'post_comments', 'post_likes',
    'post_tips', 'posts', 'privacy_allow', 'profile_visits', 'profiles', 'push_subscriptions',
    'report_queue', 'reports', 'restricted_users', 'saved_collections', 'saved_looks', 'saved_messages',
    'saved_posts', 'scheduled_messages', 'self_aliases', 'shop_listings', 'spam_verdicts', 'sticker_favorites',
    'sticker_packs', 'stories', 'story_likes', 'story_responses', 'story_views', 'tag_follows',
    'user_devices', 'user_locations', 'user_restrictions', 'user_rewards', 'user_stickers', 'verified_gift_orders',
    'wallets', 'wishlist_items', 'zchat_app_prefs', 'zchat_chat_marks', 'zchat_chat_note_versions', 'zchat_chat_notes',
    'zchat_cl_live', 'zchat_cm_waiting', 'zchat_data_exports', 'zchat_drafts', 'zchat_grp_as_group', 'zchat_grp_emoji',
    'zchat_grp_hidden', 'zchat_grp_join_answers', 'zchat_grp_keywords', 'zchat_grp_links', 'zchat_grp_log', 'zchat_grp_pending',
    'zchat_grp_rules_ok', 'zchat_guestbook_prefs', 'zchat_post_poll_counts', 'zchat_post_poll_votes', 'zchat_post_tags', 'zchat_problem_reports',
    'zchat_safety_timers', 'zchat_saved_folders', 'zchat_search_prefs', 'zchat_shared_members', 'zchat_shared_stories', 'zchat_snoozes',
    'zchat_story_list_members', 'zchat_story_lists', 'zchat_tag_settings', 'zchat_time_polls', 'zchat_time_votes', 'zchat_tones',
    'zchat_trusted_friends', 'zchat_watch_items', 'zchat_watch_reacts'
  ]::text[];
  cols text[] := array[
    'achievements.earned_at', 'achievements.key', 'achievements.user_id', 'admins.user_id', 'ai_character_messages.character_id',
    'ai_character_messages.content', 'ai_character_messages.created_at', 'ai_character_messages.id', 'ai_character_messages.role', 'ai_character_messages.user_id',
    'ai_characters.chats', 'ai_characters.greeting', 'ai_characters.held', 'ai_characters.id', 'ai_characters.name',
    'ai_characters.owner_id', 'ai_characters.personality', 'ai_characters.published_at', 'ai_characters.updated_at', 'ai_characters.visibility',
    'ai_flash_decks.cards', 'ai_flash_decks.id', 'ai_flash_decks.known', 'ai_flash_decks.owner_id', 'ai_flash_decks.source',
    'ai_flash_decks.title', 'ai_flash_decks.updated_at', 'ai_images.created_at', 'ai_images.done_at', 'ai_images.error',
    'ai_images.id', 'ai_images.kind', 'ai_images.prompt', 'ai_images.ratio', 'ai_images.status',
    'ai_images.style', 'ai_images.url', 'ai_images.user_id', 'ai_link_cache.created_at', 'ai_link_cache.ok',
    'ai_link_cache.points', 'ai_link_cache.reason', 'ai_link_cache.title', 'ai_link_cache.url', 'ai_link_cache.url_hash',
    'ai_photo_jobs.created_at', 'ai_photo_jobs.done_at', 'ai_photo_jobs.error', 'ai_photo_jobs.id', 'ai_photo_jobs.kind',
    'ai_photo_jobs.prompt', 'ai_photo_jobs.status', 'ai_photo_jobs.style', 'ai_photo_jobs.urls', 'ai_photo_jobs.user_id',
    'ai_practice_sessions.created_at', 'ai_practice_sessions.good', 'ai_practice_sessions.id', 'ai_practice_sessions.level', 'ai_practice_sessions.next',
    'ai_practice_sessions.topic', 'ai_practice_sessions.user_id', 'album_photos.album_id', 'album_photos.created_at', 'album_photos.id',
    'album_photos.media_type', 'album_photos.media_url', 'album_photos.user_id', 'albums.chat_key', 'albums.created_at',
    'albums.created_by', 'albums.id', 'albums.title', 'birthday_gifts.coins', 'birthday_gifts.deliver_at',
    'birthday_gifts.from_id', 'birthday_gifts.held', 'birthday_gifts.id', 'birthday_gifts.item_key', 'birthday_gifts.kind',
    'birthday_gifts.md', 'birthday_gifts.note', 'birthday_gifts.pay', 'birthday_gifts.price', 'birthday_gifts.status',
    'birthday_gifts.to_id', 'birthday_gifts.wrap', 'birthdays.md', 'birthdays.show', 'birthdays.updated_at',
    'birthdays.user_id', 'blocks.blocked_id', 'blocks.blocker_id', 'blocks.created_at', 'bot_knowledge.created_at',
    'bot_knowledge.fact', 'bot_knowledge.id', 'bot_knowledge.taught_by', 'bot_knowledge.topic', 'broadcast_lists.created_at',
    'broadcast_lists.id', 'broadcast_lists.owner_id', 'call_hides.call_id', 'call_hides.user_id', 'calls.answered_at',
    'calls.callee_id', 'calls.caller_id', 'calls.created_at', 'calls.ended_at', 'calls.group_id',
    'calls.id', 'calls.kind', 'calls.link_code', 'calls.status', 'calls.title',
    'channel_follows.channel_id', 'channel_follows.muted', 'channel_follows.user_id', 'channel_post_likes.post_id', 'channel_post_likes.user_id',
    'channel_posts.author_id', 'channel_posts.channel_id', 'channel_posts.content', 'channel_posts.created_at', 'channel_posts.id',
    'channel_posts.media_type', 'channel_posts.media_url', 'channels.avatar', 'channels.bio', 'channels.id',
    'channels.name', 'channels.owner_id', 'chat_accepts.other_id', 'chat_accepts.user_id', 'chat_imports.count',
    'chat_imports.created_at', 'chat_imports.first_at', 'chat_imports.group_id', 'chat_imports.id', 'chat_imports.importer_id',
    'chat_imports.last_at', 'chat_imports.me_name', 'chat_imports.peer_id', 'chat_imports.status', 'chat_imports.title',
    'chat_locks.conversation_id', 'chat_locks.owner_id', 'chat_locks.pin_hash', 'client_errors.created_at', 'client_errors.extra',
    'client_errors.id', 'client_errors.message', 'client_errors.stack', 'client_errors.ua', 'client_errors.url',
    'client_errors.version', 'close_friends.created_at', 'close_friends.friend_id', 'close_friends.owner_id', 'coin_ledger.created_at',
    'coin_ledger.delta', 'coin_ledger.id', 'coin_ledger.note', 'coin_ledger.other_id', 'coin_ledger.reason',
    'coin_ledger.user_id', 'community_members.community_id', 'community_members.joined_at', 'community_members.role', 'community_members.user_id',
    'contact_nicknames.contact_id', 'contact_nicknames.nickname', 'contact_nicknames.owner_id', 'conversations.id', 'conversations.last_message',
    'conversations.last_message_at', 'conversations.last_sender_id', 'conversations.muted_until_a', 'conversations.muted_until_b', 'conversations.user_a',
    'conversations.user_b', 'creator_members.creator_id', 'creator_members.started_at', 'creator_members.status', 'creator_packs.created_at',
    'creator_packs.owner_id', 'creator_settings.msg_price', 'creator_settings.user_id', 'device_keys.fp', 'device_keys.pub',
    'device_keys.updated_at', 'device_keys.user_id', 'drop_reminders.drop_id', 'drop_reminders.user_id', 'drops.blurb',
    'drops.ends_at', 'drops.id', 'drops.item_key', 'drops.kind', 'drops.price',
    'drops.starts_at', 'drops.title', 'follows.created_at', 'follows.follower_id', 'follows.following_id',
    'follows.status', 'gift_codes.created_at', 'group_entry_payments.group_id', 'group_entry_payments.status', 'group_entry_payments.user_id',
    'group_join_requests.created_at', 'group_join_requests.group_id', 'group_join_requests.reviewed_at', 'group_join_requests.reviewed_by', 'group_join_requests.status',
    'group_join_requests.user_id', 'group_members.added_by', 'group_members.group_id', 'group_members.muted', 'group_members.nick',
    'group_members.notify_muted_until', 'group_members.role', 'group_members.user_id', 'groups.avatar', 'groups.created_by',
    'groups.id', 'groups.invite_code', 'groups.name', 'hidden_messages.created_at', 'hidden_messages.message_id',
    'hidden_messages.user_id', 'highlight_items.created_at', 'highlight_items.highlight_id', 'highlight_items.id', 'highlight_items.media_type',
    'highlight_items.media_url', 'highlight_items.user_id', 'highlight_likes.highlight_id', 'highlight_likes.user_id', 'highlights.cover_meta',
    'highlights.cover_type', 'highlights.cover_url', 'highlights.created_at', 'highlights.id', 'highlights.title',
    'highlights.user_id', 'imported_messages.body', 'imported_messages.import_id', 'imported_messages.seq', 'mails.created_at',
    'mails.id', 'mails.read', 'mails.recipient_id', 'message_likes.emoji', 'message_likes.message_id',
    'message_likes.super_key', 'message_likes.user_id', 'message_reports.message_id', 'message_reports.reason', 'message_reports.reporter_id',
    'messages.bot_reply', 'messages.client_id', 'messages.content', 'messages.created_at', 'messages.deleted',
    'messages.delivered', 'messages.edited', 'messages.expires_at', 'messages.group_id', 'messages.id',
    'messages.media_url', 'messages.overlay_url', 'messages.read', 'messages.receiver_id', 'messages.reply_to_id',
    'messages.sender_id', 'messages.story_id', 'messages.suggestions', 'messages.trim_end', 'messages.trim_start',
    'messages.type', 'notes.expires_at', 'notes.user_id', 'notifications.actor_id', 'notifications.created_at',
    'notifications.id', 'notifications.kind', 'notifications.meta', 'notifications.text', 'notifications.user_id',
    'passkeys.created_at', 'passkeys.device_name', 'passkeys.id', 'passkeys.last_used_at', 'passkeys.user_id',
    'photo_labels.labels', 'photo_labels.message_id', 'post_comment_likes.comment_id', 'post_comment_likes.user_id', 'post_comments.content',
    'post_comments.created_at', 'post_comments.id', 'post_comments.post_id', 'post_comments.user_id', 'post_likes.created_at',
    'post_likes.post_id', 'post_likes.user_id', 'post_tips.amount', 'post_tips.post_id', 'post_tips.tipper_id',
    'posts.song', 'posts.alt_texts', 'posts.archived_at', 'posts.caption', 'posts.captions', 'posts.created_at',
    'posts.id', 'posts.kind', 'posts.media_type', 'posts.media_url', 'posts.media_urls',
    'posts.overlay_url', 'posts.pinned_at', 'posts.pinned_comment_id', 'posts.poll', 'posts.remix_of',
    'posts.remix_ok', 'posts.sensitive', 'posts.user_id', 'posts.voice', 'privacy_allow.scope',
    'privacy_allow.user_id', 'privacy_allow.viewer_id', 'profile_visits.n', 'profile_visits.profile_id', 'profile_visits.viewed_at',
    'profile_visits.viewer_id', 'profiles.ama_on', 'profiles.avatar', 'profiles.avatar_cfg', 'profiles.avatar_frame',
    'profiles.banned', 'profiles.chat_lock_enabled', 'profiles.chat_lock_hash', 'profiles.cover_anim', 'profiles.cover_url',
    'profiles.created_at', 'profiles.custom_badge', 'profiles.device_id', 'profiles.hide_activity', 'profiles.id',
    'profiles.interests', 'profiles.is_bot', 'profiles.is_deleted', 'profiles.is_private', 'profiles.last_seen',
    'profiles.name', 'profiles.name_style', 'profiles.nameplate', 'profiles.profile_theme', 'profiles.song',
    'profiles.status_emoji', 'profiles.status_text', 'profiles.status_until', 'profiles.username', 'profiles.verified',
    'profiles.verified_seen', 'profiles.verified_until', 'profiles.visitors_on', 'push_subscriptions.auth', 'push_subscriptions.endpoint',
    'push_subscriptions.p256dh', 'push_subscriptions.user_id', 'reports.reason', 'reports.reported_id', 'reports.reporter_id',
    'restricted_users.owner_id', 'restricted_users.user_id', 'saved_collections.created_at', 'saved_collections.id', 'saved_collections.name',
    'saved_collections.user_id', 'saved_looks.slot', 'saved_looks.user_id', 'saved_messages.chat_label', 'saved_messages.content',
    'saved_messages.created_at', 'saved_messages.folder_id', 'saved_messages.from_name', 'saved_messages.id', 'saved_messages.kind',
    'saved_messages.media_url', 'saved_messages.source_message_id', 'saved_messages.user_id', 'saved_posts.collection_id', 'saved_posts.created_at',
    'saved_posts.post_id', 'saved_posts.user_id', 'scheduled_messages.content', 'scheduled_messages.id', 'scheduled_messages.send_at',
    'scheduled_messages.sender_id', 'self_aliases.alias', 'self_aliases.user_id', 'self_aliases.viewer_id', 'shop_listings.created_at',
    'shop_listings.id', 'shop_listings.owner_id', 'shop_listings.sold_out', 'spam_verdicts.other_id', 'spam_verdicts.updated_at',
    'spam_verdicts.user_id', 'spam_verdicts.verdict', 'sticker_favorites.sticker_key', 'sticker_favorites.user_id', 'sticker_packs.created_at',
    'sticker_packs.id', 'sticker_packs.owner_id', 'stories.audience', 'stories.caption', 'stories.created_at',
    'stories.expires_at', 'stories.id', 'stories.media_type', 'stories.media_url', 'stories.mentions',
    'stories.overlay_url', 'stories.repost_label', 'stories.repost_of', 'stories.shared_id', 'stories.user_id',
    'story_likes.story_id', 'story_likes.user_id', 'story_responses.created_at', 'story_responses.story_id', 'story_views.story_id',
    'story_views.viewer_id', 'tag_follows.tag', 'tag_follows.user_id', 'user_devices.device_id', 'user_devices.last_active',
    'user_devices.revoked', 'user_devices.user_id', 'user_locations.acc', 'user_locations.lat', 'user_locations.lng',
    'user_locations.share', 'user_locations.updated_at', 'user_locations.user_id', 'user_restrictions.lifted', 'user_restrictions.until',
    'user_restrictions.user_id', 'user_rewards.expires_at', 'user_rewards.granted_at', 'user_rewards.id', 'user_rewards.kind',
    'user_rewards.reward_key', 'user_rewards.seen', 'user_rewards.user_id', 'user_stickers.created_at', 'user_stickers.id',
    'user_stickers.url', 'user_stickers.user_id', 'verified_gift_orders.id', 'verified_gift_orders.status', 'wallets.coins',
    'wallets.free_bubbles', 'wallets.free_sets', 'wallets.last_claim', 'wallets.streak', 'wallets.updated_at',
    'wallets.user_id', 'wishlist_items.created_at', 'wishlist_items.item_key', 'wishlist_items.kind', 'wishlist_items.user_id',
    'zchat_app_prefs.user_id', 'zchat_chat_marks.actor_id', 'zchat_chat_marks.chat_key', 'zchat_chat_marks.created_at', 'zchat_chat_marks.kind',
    'zchat_chat_marks.message_id', 'zchat_chat_marks.user_id', 'zchat_chat_note_versions.body', 'zchat_chat_note_versions.chat_key', 'zchat_chat_note_versions.created_at',
    'zchat_chat_note_versions.edited_by', 'zchat_chat_note_versions.id', 'zchat_chat_note_versions.updated_at', 'zchat_chat_note_versions.version', 'zchat_chat_notes.body',
    'zchat_chat_notes.chat_key', 'zchat_chat_notes.updated_at', 'zchat_chat_notes.updated_by', 'zchat_chat_notes.version', 'zchat_cl_live.beat_at',
    'zchat_cl_live.call_id', 'zchat_cl_live.can_move', 'zchat_cl_live.dev', 'zchat_cl_live.group_id', 'zchat_cl_live.kind',
    'zchat_cl_live.mode', 'zchat_cl_live.move_at', 'zchat_cl_live.move_to', 'zchat_cl_live.peer_id', 'zchat_cl_live.started_at',
    'zchat_cl_live.title', 'zchat_cl_live.user_id', 'zchat_cm_waiting.client_id', 'zchat_cm_waiting.content', 'zchat_cm_waiting.created_at',
    'zchat_cm_waiting.id', 'zchat_cm_waiting.receiver_id', 'zchat_data_exports.created_at', 'zchat_data_exports.error', 'zchat_data_exports.expires_at',
    'zchat_data_exports.id', 'zchat_data_exports.parts', 'zchat_data_exports.status', 'zchat_data_exports.updated_at', 'zchat_data_exports.user_id',
    'zchat_drafts.data', 'zchat_drafts.id', 'zchat_drafts.kind', 'zchat_drafts.thumb', 'zchat_drafts.updated_at',
    'zchat_drafts.user_id', 'zchat_grp_as_group.message_id', 'zchat_grp_as_group.sender_id', 'zchat_grp_emoji.animated', 'zchat_grp_emoji.created_at',
    'zchat_grp_emoji.group_id', 'zchat_grp_emoji.id', 'zchat_grp_emoji.name', 'zchat_grp_emoji.url', 'zchat_grp_hidden.created_at',
    'zchat_grp_hidden.group_id', 'zchat_grp_hidden.hidden_id', 'zchat_grp_hidden.id', 'zchat_grp_hidden.user_id', 'zchat_grp_join_answers.answers',
    'zchat_grp_join_answers.group_id', 'zchat_grp_join_answers.user_id', 'zchat_grp_keywords.group_id', 'zchat_grp_keywords.user_id', 'zchat_grp_keywords.words',
    'zchat_grp_links.created_at', 'zchat_grp_links.group_id', 'zchat_grp_log.action', 'zchat_grp_log.actor_id', 'zchat_grp_log.created_at',
    'zchat_grp_log.detail', 'zchat_grp_log.group_id', 'zchat_grp_log.id', 'zchat_grp_log.target_id', 'zchat_grp_pending.client_id',
    'zchat_grp_pending.created_at', 'zchat_grp_pending.group_id', 'zchat_grp_pending.id', 'zchat_grp_pending.payload', 'zchat_grp_pending.sender_id',
    'zchat_grp_pending.status', 'zchat_grp_rules_ok.group_id', 'zchat_grp_rules_ok.user_id', 'zchat_grp_rules_ok.version', 'zchat_guestbook_prefs.updated_at',
    'zchat_guestbook_prefs.user_id', 'zchat_guestbook_prefs.who', 'zchat_post_poll_counts.counts', 'zchat_post_poll_counts.post_id', 'zchat_post_poll_counts.total',
    'zchat_post_poll_votes.choice', 'zchat_post_poll_votes.post_id', 'zchat_post_tags.created_at', 'zchat_post_tags.id', 'zchat_post_tags.media_idx',
    'zchat_post_tags.post_id', 'zchat_post_tags.status', 'zchat_post_tags.tagger_id', 'zchat_post_tags.user_id', 'zchat_post_tags.x',
    'zchat_post_tags.y', 'zchat_problem_reports.body', 'zchat_problem_reports.device', 'zchat_problem_reports.kind', 'zchat_problem_reports.lab',
    'zchat_problem_reports.shots', 'zchat_problem_reports.user_id', 'zchat_safety_timers.friends', 'zchat_safety_timers.id', 'zchat_safety_timers.owner_id',
    'zchat_safety_timers.started_at', 'zchat_safety_timers.status', 'zchat_saved_folders.created_at', 'zchat_saved_folders.id', 'zchat_saved_folders.name',
    'zchat_saved_folders.user_id', 'zchat_search_prefs.user_id', 'zchat_search_prefs.visible', 'zchat_shared_members.added_by', 'zchat_shared_members.created_at',
    'zchat_shared_members.shared_id', 'zchat_shared_members.user_id', 'zchat_shared_stories.created_at', 'zchat_shared_stories.expires_at', 'zchat_shared_stories.id',
    'zchat_shared_stories.keep', 'zchat_shared_stories.owner_id', 'zchat_snoozes.chat_key', 'zchat_snoozes.prev_mute', 'zchat_snoozes.until',
    'zchat_snoozes.user_id', 'zchat_story_list_members.list_id', 'zchat_story_list_members.member_id', 'zchat_story_list_members.owner_id', 'zchat_story_lists.created_at',
    'zchat_story_lists.id', 'zchat_story_lists.name', 'zchat_story_lists.owner_id', 'zchat_tag_settings.auto', 'zchat_tag_settings.updated_at',
    'zchat_tag_settings.user_id', 'zchat_time_polls.id', 'zchat_time_votes.chat_key', 'zchat_time_votes.poll_id', 'zchat_time_votes.slots',
    'zchat_time_votes.updated_at', 'zchat_time_votes.user_id', 'zchat_tones.created_at', 'zchat_tones.id', 'zchat_tones.name',
    'zchat_tones.path', 'zchat_tones.secs', 'zchat_tones.user_id', 'zchat_trusted_friends.added_at', 'zchat_trusted_friends.friend_id',
    'zchat_trusted_friends.owner_id', 'zchat_watch_items.chat_key', 'zchat_watch_items.created_at', 'zchat_watch_items.removed_at', 'zchat_watch_reacts.chat_key',
    'zchat_watch_reacts.emoji', 'zchat_watch_reacts.item_id', 'zchat_watch_reacts.user_id'
  ]::text[];
begin
  return jsonb_build_object('fn_app', to_jsonb(fn_app), 'fn_srv', to_jsonb(fn_srv), 'tables', to_jsonb(tbls), 'cols', to_jsonb(cols));
end $$;
revoke all on function public.zchat_db_manifest() from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
