import { createClient } from '@supabase/supabase-js'
import { CONFIG } from './config'

document.addEventListener('DOMContentLoaded', () => {
    console.log('GlobCart App Initialized (TypeScript)')
    
    // Initialize Supabase Client if keys are provided
    let supabase = null
    if (CONFIG.SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
        supabase = createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_ANON_KEY
        )
        console.log('Supabase client initialized', !!supabase)
    }

    // Check Backend Status
    checkBackendStatus()
})

async function checkBackendStatus() {
    const statusText = document.getElementById('status-text')
    const pulseIndicator = document.querySelector('.pulse')
    
    if (!statusText || !pulseIndicator) return

    try {
        const response = await fetch(`${CONFIG.BACKEND_API_URL}/`)
        
        if (response.ok) {
            const data = await response.json()
            console.log('Backend health:', data)
            
            pulseIndicator.classList.remove('checking')
            pulseIndicator.classList.add('online')
            
            let statusHtml = `<strong>Online:</strong> Backend connected. `
            if(data.supabase_connected) {
                 statusHtml += `<br/><small style="color: #10b981">Supabase linked ✅</small>`
            } else {
                 statusHtml += `<br/><small style="color: #fbbf24">Supabase missing config ⚠️</small>`
            }
            
            statusText.innerHTML = statusHtml
        } else {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
    } catch (error) {
        console.error('Backend connection failed:', error)
        
        pulseIndicator.classList.remove('checking')
        pulseIndicator.classList.add('offline')
        
        statusText.innerHTML = `<strong>Offline:</strong> Could not reach backend.<br/><small>Make sure Flask is running on port 5000.</small>`
    }
}
