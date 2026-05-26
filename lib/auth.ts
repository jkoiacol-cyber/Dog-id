import { supabase } from './supabase'

// Registro de nuevo propietario
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  })
  if (error) throw error

  // Crear perfil en tabla owners
  if (data.user) {
    const { error: profileError } = await supabase
      .from('owners')
      .insert({ id: data.user.id, full_name: fullName })
    if (profileError) throw profileError
  }

  return data
}

// Login
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// Logout
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Obtener sesión activa
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Obtener usuario actual
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}