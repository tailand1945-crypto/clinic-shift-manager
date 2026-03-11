import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { email, staffProfileId, staffName, staffRole } = await request.json();

    if (!email || !staffProfileId) {
      return NextResponse.json(
        { error: 'メールアドレスとスタッフIDは必須です' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/set-password`,
        data: {
          staff_profile_id: staffProfileId,
          staff_name: staffName,
          staff_role: staffRole,
        },
      });

    if (inviteError) {
      if (
        inviteError.message.includes('already been invited') ||
        inviteError.message.includes('already registered') ||
        inviteError.message.includes('unique constraint')
      ) {
        return NextResponse.json(
          { error: 'このメールアドレスはすでに招待済みか登録済みです' },
          { status: 409 }
        );
      }
      throw inviteError;
    }

    const { error: updateError } = await supabaseAdmin
      .from('staff_profiles')
      .update({
        auth_user_id: inviteData.user.id,
        email: email,
        invite_status: 'invited',
        invite_sent_at: new Date().toISOString(),
      })
      .eq('id', staffProfileId);

    if (updateError) {
      console.error('[invite-staff] staff_profiles更新エラー:', updateError);
      return NextResponse.json(
        {
          warning: '招待メールは送信しましたが、プロフィール更新に失敗しました',
          userId: inviteData.user.id,
        },
        { status: 207 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${email} に招待メールを送信しました`,
      userId: inviteData.user.id,
    });
  } catch (error) {
    console.error('[invite-staff] エラー:', error);
    return NextResponse.json(
      { error: error.message || '招待処理に失敗しました' },
      { status: 500 }
    );
  }
}
