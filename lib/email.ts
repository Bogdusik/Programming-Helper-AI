import { Resend } from 'resend'

export async function sendContactEmail(data: {
  name: string
  email: string
  subject: string
  message: string
}): Promise<{ success: boolean; error?: string }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const TO_EMAIL = process.env.CONTACT_EMAIL || 'bogdyn13@proton.me'

  if (!RESEND_API_KEY) {
    // If Resend is not configured, just log the message
    console.log('=== CONTACT FORM SUBMISSION ===')
    console.log('Name:', data.name)
    console.log('Email:', data.email)
    console.log('Subject:', data.subject)
    console.log('Message:', data.message)
    console.log('==============================')
    
    return { success: true }
  }

  try {
    // Initialize Resend
    const resend = new Resend(RESEND_API_KEY)

    // Send email using Resend SDK
    const { data: emailData, error } = await resend.emails.send({
      from: 'Programming Helper AI <onboarding@resend.dev>', // Use Resend's default domain for testing, or your verified domain
      to: [TO_EMAIL],
      replyTo: data.email,
      subject: `Contact Form: ${data.subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
      `,
      text: `
        New Contact Form Submission
        
        Name: ${data.name}
        Email: ${data.email}
        Subject: ${data.subject}
        
        Message:
        ${data.message}
      `,
    })

    if (error) {
      console.error('Resend API error:', error)
      return { success: false, error: error.message }
    }

    console.log('Email sent successfully:', emailData)
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

