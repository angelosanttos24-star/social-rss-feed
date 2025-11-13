/**
 * Get the user ID for database operations
 * For Manus Auth, we use the numeric user ID directly
 */
export function getUserId(userId: string | number): number {
  const numId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  console.log(`[getUserId] userId=${userId} -> numId=${numId}`);
  return numId;
}

/**
 * Ensure user exists in Supabase users table
 */
export async function ensureUserInSupabase(
  supabaseAdmin: any,
  userId: string | number,
  openId: string,
  email?: string | null,
  name?: string | null
) {
  const numUserId = getUserId(userId);
  console.log(`[ensureUserInSupabase] Creating/checking user: userId=${userId}, openId=${openId}, numUserId=${numUserId}`);

  try {
    // Check if user exists
    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', numUserId)
      .maybeSingle();

    if (selectError) {
      console.error('[ensureUserInSupabase] Error checking user:', selectError);
    }

    console.log(`[ensureUserInSupabase] Existing user check:`, { existingUser, selectError });

    if (!existingUser) {
      console.log(`[ensureUserInSupabase] User does not exist, creating...`);
      
      // Create user
      const { data: insertedUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: numUserId,
          email: email || null,
          name: name || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[ensureUserInSupabase] Error creating user:', insertError);
        throw new Error(`Failed to create user: ${insertError.message}`);
      }

      console.log(`[ensureUserInSupabase] User created successfully:`, insertedUser);
    } else {
      console.log(`[ensureUserInSupabase] User already exists:`, existingUser);
    }

    return numUserId;
  } catch (error) {
    console.error('[ensureUserInSupabase] Error in ensureUserInSupabase:', error);
    throw error;
  }
}
