/**
 * TennisHQ — Drizzle ORM Schema
 *
 * Tables will be added here as features are built out.
 * See ARCHITECTURE.md for planned schema design.
 *
 * Planned tables:
 * - players
 * - tournaments
 * - matches
 * - match_stats
 * - rankings
 * - head_to_head
 */

// Re-export pgTable helper for use in feature-specific schema files
export { pgTable, serial, text, integer, timestamp, boolean, numeric, uuid } from 'drizzle-orm/pg-core';
