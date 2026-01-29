import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yghfuofzjwxeohmluvxp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnaGZ1b2Z6and4ZW9obWx1dnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDY2MzcsImV4cCI6MjA4NTEyMjYzN30.fdgrCQ5sUBrcGI90h2yDjYDvWy0zcPGCVCNGMx9FO_Q'

export const supabase = createClient(supabaseUrl, supabaseKey)
