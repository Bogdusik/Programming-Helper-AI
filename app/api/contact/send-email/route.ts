import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    // Validate input
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const TO_EMAIL = process.env.CONTACT_EMAIL || 'bogdyn13@proton.me'

    if (!RESEND_API_KEY) {
      // If Resend is not configured, just log the message
      console.log('=== CONTACT FORM SUBMISSION ===')
      console.log('Name:', name)
      console.log('Email:', email)
      console.log('Subject:', subject)
      console.log('Message:', message)
      console.log('==============================')
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Message logged (email service not configured)' 
        },
        { status: 200 }
      )
    }

    // Initialize Resend
    const resend = new Resend(RESEND_API_KEY)

    // Send email using Resend SDK
    const { data, error } = await resend.emails.send({
      from: 'Programming Helper AI <onboarding@resend.dev>', // Use Resend's default domain for testing, or your verified domain
      to: [TO_EMAIL],
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      text: `
        New Contact Form Submission
        
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        
        Message:
        ${message}
      `,
    })

    if (error) {
      console.error('Resend API error:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error.message },
        { status: 500 }
      )
    }

    console.log('Email sent successfully:', data)

    return NextResponse.json(
      { success: true, emailId: data?.id },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in send-email route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

