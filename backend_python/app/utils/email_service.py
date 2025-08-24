import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional
import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models.models import ApplicationSettings
from ..schemas.schemas import UserRole

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = None
        self.smtp_port = None
        self.smtp_username = None
        self.smtp_password = None
        self.admin_email = None
        self.app_name = "Do Good Hub"
        self.app_logo = None
    
    async def load_settings(self, db: AsyncSession):
        """Load email settings from database."""
        try:
            stmt = select(ApplicationSettings).limit(1)
            result = await db.execute(stmt)
            settings = result.scalar_one_or_none()
            
            if settings:
                self.smtp_server = settings.smtp_server
                self.smtp_port = settings.smtp_port
                self.smtp_username = settings.smtp_username
                self.smtp_password = settings.smtp_password
                self.admin_email = settings.admin_email
                self.app_name = settings.app_name or "Do Good Hub"
                self.app_logo = settings.app_logo
            else:
                # Use default settings if no settings found
                self.admin_email = "shibinsp43@gmail.com"
                logger.warning("No application settings found, using default admin email")
        except Exception as e:
            logger.error(f"Error loading email settings: {e}")
            self.admin_email = "shibinsp43@gmail.com"
    
    def _create_connection(self):
        """Create SMTP connection."""
        if not all([self.smtp_server, self.smtp_port, self.smtp_username, self.smtp_password]):
            logger.warning("SMTP settings not configured, email will not be sent")
            return None
        
        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            return server
        except Exception as e:
            logger.error(f"Failed to create SMTP connection: {e}")
            return None
    
    def _create_email_template(self, subject: str, body: str, recipient_email: str) -> MIMEMultipart:
        """Create email template with HTML formatting."""
        msg = MIMEMultipart('alternative')
        msg['From'] = self.smtp_username or self.admin_email
        msg['To'] = recipient_email
        msg['Subject'] = subject
        
        # Create HTML version
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{subject}</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #4CAF50;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 5px 5px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    padding: 10px;
                    font-size: 12px;
                    color: #666;
                }}
                .button {{
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px 0;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{self.app_name}</h1>
            </div>
            <div class="content">
                {body}
            </div>
            <div class="footer">
                <p>This is an automated message from {self.app_name}.</p>
                <p>Please do not reply to this email.</p>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version
        text_body = body.replace('<br>', '\n').replace('<p>', '').replace('</p>', '\n')
        
        # Attach both versions
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        return msg
    
    async def send_registration_approval_request(
        self, 
        db: AsyncSession,
        user_name: str, 
        user_email: str, 
        user_role: UserRole,
        registration_details: dict
    ) -> bool:
        """Send registration approval request to admin."""
        await self.load_settings(db)
        
        if not self.admin_email:
            logger.error("Admin email not configured")
            return False
        
        role_name = "NGO" if user_role == UserRole.NGO else "Vendor"
        subject = f"New {role_name} Registration Approval Required - {self.app_name}"
        
        # Create detailed registration info
        details_html = "<h3>Registration Details:</h3><ul>"
        for key, value in registration_details.items():
            if value:
                details_html += f"<li><strong>{key.replace('_', ' ').title()}:</strong> {value}</li>"
        details_html += "</ul>"
        
        body = f"""
        <h2>New {role_name} Registration Request</h2>
        <p>A new {role_name.lower()} has registered and requires your approval to access the system.</p>
        
        <h3>User Information:</h3>
        <ul>
            <li><strong>Name:</strong> {user_name}</li>
            <li><strong>Email:</strong> {user_email}</li>
            <li><strong>Role:</strong> {role_name}</li>
            <li><strong>Registration Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
        </ul>
        
        {details_html}
        
        <p>Please log in to the admin dashboard to review and approve this registration.</p>
        
        <p><strong>Action Required:</strong> Review the registration details and approve or reject the application.</p>
        """
        
        return await self._send_email(subject, body, self.admin_email)
    
    async def send_approval_notification(
        self, 
        db: AsyncSession,
        user_name: str, 
        user_email: str, 
        user_role: UserRole,
        approved: bool,
        admin_notes: Optional[str] = None
    ) -> bool:
        """Send approval/rejection notification to user."""
        await self.load_settings(db)
        
        role_name = "NGO" if user_role == UserRole.NGO else "Vendor"
        status = "Approved" if approved else "Rejected"
        subject = f"Registration {status} - {self.app_name}"
        
        if approved:
            body = f"""
            <h2>Registration Approved! 🎉</h2>
            <p>Dear {user_name},</p>
            
            <p>Congratulations! Your {role_name.lower()} registration has been approved.</p>
            
            <p>You can now log in to your account and start using all the features available to {role_name.lower()}s.</p>
            
            <p><strong>What's next?</strong></p>
            <ul>
                <li>Log in to your dashboard</li>
                <li>Complete your profile information</li>
                <li>Start using the platform features</li>
            </ul>
            
            <p>Welcome to {self.app_name}!</p>
            """
        else:
            body = f"""
            <h2>Registration Update</h2>
            <p>Dear {user_name},</p>
            
            <p>Thank you for your interest in joining {self.app_name} as a {role_name.lower()}.</p>
            
            <p>After reviewing your application, we are unable to approve your registration at this time.</p>
            
            {f'<p><strong>Admin Notes:</strong> {admin_notes}</p>' if admin_notes else ''}
            
            <p>If you have any questions or would like to reapply, please contact our support team.</p>
            
            <p>Thank you for your understanding.</p>
            """
        
        return await self._send_email(subject, body, user_email)
    
    async def send_invoice_notification(
        self, 
        db: AsyncSession,
        vendor_name: str,
        invoice_number: str,
        invoice_amount: float,
        transaction_id: str
    ) -> bool:
        """Send invoice submission notification to admin."""
        await self.load_settings(db)
        
        if not self.admin_email:
            logger.error("Admin email not configured")
            return False
        
        subject = f"New Invoice Submitted for Review - {self.app_name}"
        
        body = f"""
        <h2>New Invoice Submission</h2>
        <p>A vendor has submitted an invoice for review and approval.</p>
        
        <h3>Invoice Details:</h3>
        <ul>
            <li><strong>Vendor:</strong> {vendor_name}</li>
            <li><strong>Invoice Number:</strong> {invoice_number}</li>
            <li><strong>Amount:</strong> ₹{invoice_amount:,.2f}</li>
            <li><strong>Transaction ID:</strong> {transaction_id}</li>
            <li><strong>Submitted Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
        </ul>
        
        <p>Please log in to the admin dashboard to review and process this invoice.</p>
        
        <p><strong>Action Required:</strong> Review the invoice details and approve or reject the submission.</p>
        """
        
        return await self._send_email(subject, body, self.admin_email)
    
    async def send_invoice_status_notification(
        self, 
        db: AsyncSession,
        vendor_name: str,
        vendor_email: str,
        invoice_number: str,
        approved: bool,
        admin_notes: Optional[str] = None
    ) -> bool:
        """Send invoice approval/rejection notification to vendor."""
        await self.load_settings(db)
        
        status = "Approved" if approved else "Rejected"
        subject = f"Invoice {status} - {self.app_name}"
        
        if approved:
            body = f"""
            <h2>Invoice Approved ✅</h2>
            <p>Dear {vendor_name},</p>
            
            <p>Your invoice has been approved and processed.</p>
            
            <h3>Invoice Details:</h3>
            <ul>
                <li><strong>Invoice Number:</strong> {invoice_number}</li>
                <li><strong>Status:</strong> Approved</li>
                <li><strong>Processed Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
            </ul>
            
            {f'<p><strong>Admin Notes:</strong> {admin_notes}</p>' if admin_notes else ''}
            
            <p>Payment processing will begin shortly.</p>
            """
        else:
            body = f"""
            <h2>Invoice Requires Attention</h2>
            <p>Dear {vendor_name},</p>
            
            <p>Your invoice submission requires revision before it can be processed.</p>
            
            <h3>Invoice Details:</h3>
            <ul>
                <li><strong>Invoice Number:</strong> {invoice_number}</li>
                <li><strong>Status:</strong> Rejected</li>
                <li><strong>Review Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
            </ul>
            
            {f'<p><strong>Admin Notes:</strong> {admin_notes}</p>' if admin_notes else ''}
            
            <p>Please review the feedback and resubmit your invoice with the necessary corrections.</p>
            """
        
        return await self._send_email(subject, body, vendor_email)
    
    async def send_invoice_approval_notification(
        self, 
        vendor_email: str,
        vendor_name: str,
        invoice_number: str,
        invoice_amount: float,
        admin_notes: Optional[str] = None
    ) -> bool:
        """Send invoice approval notification to vendor."""
        subject = f"Invoice Approved - {self.app_name}"
        
        body = f"""
        <h2>Invoice Approved ✅</h2>
        <p>Dear {vendor_name},</p>
        
        <p>Your invoice has been approved and processed.</p>
        
        <h3>Invoice Details:</h3>
        <ul>
            <li><strong>Invoice Number:</strong> {invoice_number}</li>
            <li><strong>Amount:</strong> ₹{invoice_amount:,.2f}</li>
            <li><strong>Status:</strong> Approved</li>
            <li><strong>Processed Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
        </ul>
        
        {f'<p><strong>Admin Notes:</strong> {admin_notes}</p>' if admin_notes else ''}
        
        <p>Payment processing will begin shortly.</p>
        """
        
        return await self._send_email(subject, body, vendor_email)
    
    async def send_invoice_rejection_notification(
        self, 
        vendor_email: str,
        vendor_name: str,
        invoice_number: str,
        invoice_amount: float,
        admin_notes: Optional[str] = None
    ) -> bool:
        """Send invoice rejection notification to vendor."""
        subject = f"Invoice Requires Attention - {self.app_name}"
        
        body = f"""
        <h2>Invoice Requires Attention</h2>
        <p>Dear {vendor_name},</p>
        
        <p>Your invoice submission requires revision before it can be processed.</p>
        
        <h3>Invoice Details:</h3>
        <ul>
            <li><strong>Invoice Number:</strong> {invoice_number}</li>
            <li><strong>Amount:</strong> ₹{invoice_amount:,.2f}</li>
            <li><strong>Status:</strong> Rejected</li>
            <li><strong>Review Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
        </ul>
        
        {f'<p><strong>Admin Notes:</strong> {admin_notes}</p>' if admin_notes else ''}
        
        <p>Please review the feedback and resubmit your invoice with the necessary corrections.</p>
        """
        
        return await self._send_email(subject, body, vendor_email)
    
    async def _send_email(self, subject: str, body: str, recipient_email: str) -> bool:
        """Send email using SMTP."""
        try:
            server = self._create_connection()
            if not server:
                logger.warning(f"Could not send email to {recipient_email} - SMTP not configured")
                return False
            
            msg = self._create_email_template(subject, body, recipient_email)
            
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email sent successfully to {recipient_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {recipient_email}: {e}")
            return False
    
    async def send_login_welcome_email(
        self, 
        db: AsyncSession,
        user_name: str, 
        user_email: str, 
        user_role: str
    ) -> bool:
        """Send welcome email to user after successful login."""
        try:
            await self.load_settings(db)
            
            if not self.smtp_server or not self.smtp_username:
                logger.warning("Email configuration is incomplete, skipping welcome email")
                return False
            
            subject = f"Welcome to {self.app_name} - Account Login Confirmation"
            
            # Create personalized welcome message based on user role
            role_message = {
                'admin': 'As an administrator, you have full access to manage the platform.',
                'ngo': 'As an NGO member, you can create and manage projects to make a difference.',
                'vendor': 'As a vendor, you can submit invoices and manage your business transactions.',
                'user': 'Welcome to our community! You can now explore and participate in various initiatives.'
            }.get(user_role.lower(), 'Welcome to our platform!')
            
            body = f"""
            <h2>Welcome back, {user_name}!</h2>
            <p>You have successfully logged into your {self.app_name} account.</p>
            <p><strong>Account Details:</strong></p>
            <ul>
                <li><strong>Email:</strong> {user_email}</li>
                <li><strong>Role:</strong> {user_role.title()}</li>
                <li><strong>Login Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
            </ul>
            <p>{role_message}</p>
            <p>If you did not initiate this login, please contact our support team immediately.</p>
            <p>Thank you for being part of our community!</p>
            """
            
            return await self._send_email(subject, body, user_email)
        except Exception as e:
            logger.error(f"Error sending login welcome email: {e}")
            return False
    
    async def test_email_configuration(self, db: AsyncSession, test_recipient: str) -> bool:
        """Test email configuration by sending a test email."""
        await self.load_settings(db)
        
        subject = f"Test Email - {self.app_name}"
        body = f"""
        <h2>Email Configuration Test</h2>
        <p>This is a test email to verify that the email configuration is working correctly.</p>
        
        <p><strong>Test Details:</strong></p>
        <ul>
            <li><strong>Sent At:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
            <li><strong>SMTP Server:</strong> {self.smtp_server}</li>
            <li><strong>SMTP Port:</strong> {self.smtp_port}</li>
            <li><strong>From:</strong> {self.smtp_username}</li>
        </ul>
        
        <p>If you received this email, the configuration is working properly.</p>
        """
        
        return await self._send_email(subject, body, test_recipient)

# Global email service instance
email_service = EmailService()