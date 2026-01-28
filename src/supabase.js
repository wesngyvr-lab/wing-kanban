import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yghfuofzjwxeohmluvxp.supabase.co'
const supabaseKey = 'sb_publishable_fbPG2YsKSKI-yX9jofJ-FQ_xeYyQHP-'

export const supabase = createClient(supabaseUrl, supabaseKey)
