/** Content reports, the moderation queue and admin checks (SRS 3.12). */
import { getSupabaseClient } from './client';

export type ReportTarget = 'post' | 'comment' | 'message' | 'profile' | 'community';

/** Files a report. Visible only to the reporter and to admins. */
export async function reportContent(
  targetType: ReportTarget,
  targetId: string,
  reason: string
) {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Supabase not configured') };
  try {
    const { data: userData } = await client.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return { error: new Error('Sign in to report content.') };

    const { error } = await client.from('reports').insert([
      { reporter_id: userId, target_type: targetType, target_id: targetId, reason },
    ]);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export type ModerationReport = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
};

/** Admin queue. RLS returns only the caller's own reports unless they are an admin. */
export async function getOpenReports(): Promise<ModerationReport[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('reports')
      .select('*')
      .in('status', ['open', 'reviewing'])
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at,
    }));
  } catch (err) {
    console.warn('Reports fetch error:', err);
    return [];
  }
}

/** Admin-only: enforced by the "Admins resolve reports" policy. */
export async function resolveReport(reportId: string, status: 'resolved' | 'dismissed') {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Supabase not configured') };
  const { data: userData } = await client.auth.getUser();
  return client
    .from('reports')
    .update({
      status,
      resolved_by: userData?.user?.id ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', reportId);
}

/** Whether the signed-in user can see the moderation queue. */
export async function getIsAdmin(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { data: userData } = await client.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return false;
    const { data } = await client
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    return Boolean(data?.is_admin);
  } catch {
    return false;
  }
}
