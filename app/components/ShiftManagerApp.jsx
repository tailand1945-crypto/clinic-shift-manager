const { data, error } = await supabase
  .from('staff_profiles')
  .select('*')
  .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
  .single();
if (data && !error) {
  setUser({
    id: data.id,
    name: data.last_name + ' ' + data.first_name,
    email: data.email,
    pos: data.position === 'doctor' ? 'doctor' : data.position === 'nurse' ? 'nurse' : data.position === 'receptionist' ? 'clerk' : 'assistant',
    role: data.user_role,
    night: data.can_work_night,
  });
