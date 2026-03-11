'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setSessionReady(true);
          const name = session.user.user_metadata?.staff_name;
          if (name) setStaffName(name);
        }
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionReady(true);
        const name = session.user?.user_metadata?.staff_name;
        if (name) setStaffName(name);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score+
