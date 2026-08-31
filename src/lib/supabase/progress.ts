/** Attendance records and the learner progress summary (SRS 3.9). */
import { getSupabaseClient } from './client';
import { DEFAULT_AVATAR } from '@/data/mockData';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Records that the user joined a session. Safe to call more than once.
 *
 * sessions.id is a UUID, so a seeded mock id like 'live-1' would be rejected by
 * Postgres and the write would fail silently — guard rather than round-trip.
 */
export async function recordSessionAttendance(sessionId: string) {
  const client = getSupabaseClient();
  if (!client || !sessionId) return;
  if (!UUID_RE.test(sessionId)) {
    console.warn('Skipping attendance for non-persisted session:', sessionId);
    return;
  }
  try {
    const { data: userData } = await client.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    await client.from('session_attendance').upsert(
      { session_id: sessionId, user_id: userId, joined_at: new Date().toISOString() },
      { onConflict: 'session_id,user_id' }
    );
  } catch (err) {
    console.warn('Attendance record warning:', err);
  }
}

export type AttendanceRecord = {
  sessionId: string;
  title: string;
  tag: string;
  joinedAt: string;
  minutes: number;
};

/** The signed-in user's own session history. */
export async function getMyAttendance(limit = 50): Promise<AttendanceRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data: userData } = await client.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return [];

    const { data, error } = await client
      .from('session_attendance')
      .select('session_id, joined_at, minutes_attended, sessions(title, tag)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map((row: any) => ({
      sessionId: row.session_id,
      title: row.sessions?.title || 'Study session',
      tag: row.sessions?.tag || 'General',
      joinedAt: row.joined_at,
      minutes: row.minutes_attended ?? 0,
    }));
  } catch (err) {
    console.warn('Attendance history error:', err);
    return [];
  }
}

export type ProgressSummary = {
  sessionsAttended: number;
  minutesLearned: number;
  pointsEarned: number;
};

/** Totals for the profile screen, derived rather than stored on the profile row. */
export async function getMyProgress(): Promise<ProgressSummary> {
  const empty = { sessionsAttended: 0, minutesLearned: 0, pointsEarned: 0 };
  const client = getSupabaseClient();
  if (!client) return empty;
  try {
    const { data: userData } = await client.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return empty;

    const [attendance, points] = await Promise.all([
      client.from('session_attendance').select('minutes_attended').eq('user_id', userId),
      client.from('points_ledger').select('points').eq('user_id', userId),
    ]);

    const rows = attendance.data ?? [];
    return {
      sessionsAttended: rows.length,
      minutesLearned: rows.reduce((sum: number, r: any) => sum + (r.minutes_attended ?? 0), 0),
      pointsEarned: (points.data ?? []).reduce((sum: number, r: any) => sum + (r.points ?? 0), 0),
    };
  } catch (err) {
    console.warn('Progress summary error:', err);
    return empty;
  }
}

/** Tutor-side view: who attended a session you host (SRS 3.9). */
export async function getSessionParticipation(sessionId: string) {
  const client = getSupabaseClient();
  if (!client || !sessionId) return [];
  try {
    const { data, error } = await client
      .from('session_attendance')
      .select('user_id, joined_at, minutes_attended, profiles(full_name, avatar_url)')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });

    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.user_id,
      name: row.profiles?.full_name || 'Student',
      avatar: row.profiles?.avatar_url || DEFAULT_AVATAR,
      joinedAt: row.joined_at,
      minutes: row.minutes_attended ?? 0,
    }));
  } catch (err) {
    console.warn('Participation error:', err);
    return [];
  }
}
