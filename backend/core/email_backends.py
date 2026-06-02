import base64
import logging
from typing import Any, Iterable, List, Optional, Tuple

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.message import EmailMessage

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import (
        Mail,
        Email as SendGridEmail,
        Content,
        Attachment,
        FileContent,
        FileName,
        FileType,
        Disposition,
    )
except ImportError as exc:
    raise ImportError(
        'sendgrid package is required for the SendGrid email backend. Install it with `pip install sendgrid`.'
    ) from exc

logger = logging.getLogger(__name__)


class SendGridEmailBackend(BaseEmailBackend):
    """Django email backend using the SendGrid Web API."""

    def __init__(self, **kwargs: Any):
        super().__init__(**kwargs)
        self.api_key = getattr(settings, 'SENDGRID_API_KEY', '')
        if not self.api_key:
            raise ImproperlyConfigured(
                'SENDGRID_API_KEY must be configured when using the SendGrid email backend.'
            )
        self.client = SendGridAPIClient(api_key=self.api_key)

    def send_messages(self, email_messages: Iterable[EmailMessage]) -> int:
        if not email_messages:
            return 0

        sent_count = 0
        for message in email_messages:
            if not message.recipients():
                continue

            try:
                mail = self._build_sendgrid_message(message)
                response = self.client.send(mail)
                status_code = getattr(response, 'status_code', 0)

                if 200 <= status_code < 300:
                    sent_count += 1
                else:
                    error_text = getattr(response, 'body', None) or getattr(response, 'text', None)
                    logger.error(
                        'SendGrid send failed: status=%s response=%s',
                        status_code,
                        error_text,
                    )
                    if not self.fail_silently:
                        raise Exception(
                            f'SendGrid send failed with status {status_code}: {error_text}'
                        )
            except Exception as exc:
                if self.fail_silently:
                    logger.warning('SendGrid email failed silently: %s', exc)
                    continue
                raise

        return sent_count

    def _build_sendgrid_message(self, message: EmailMessage) -> Mail:
        from_email = message.from_email or settings.DEFAULT_FROM_EMAIL

        mail = Mail(
            from_email=SendGridEmail(from_email),
            to_emails=message.to,
            subject=message.subject,
            plain_text_content=message.body or '',
            html_content=self._html_content(message),
        )

        if message.cc:
            mail.cc = message.cc

        if message.bcc:
            mail.bcc = message.bcc

        if message.extra_headers and message.extra_headers.get('Reply-To'):
            reply_to_value = message.extra_headers.get('Reply-To')
            mail.reply_to = SendGridEmail(reply_to_value)
        elif message.reply_to:
            mail.reply_to = SendGridEmail(message.reply_to[0])

        self._attach_files(mail, message)

        return mail

    def _html_content(self, message: EmailMessage) -> str:
        for alternative in getattr(message, 'alternatives', []) or []:
            if isinstance(alternative, tuple) and alternative[1] == 'text/html':
                return alternative[0]
        return message.body or ''

    def _attach_files(self, mail: Mail, message: EmailMessage) -> None:
        attachments = getattr(message, 'attachments', None) or []
        if not attachments:
            return

        mail.attachment = []
        for attachment in attachments:
            filename, content, mime_type = self._normalize_attachment(attachment)
            if filename is None or content is None:
                continue

            if isinstance(content, str):
                content = content.encode('utf-8')
            encoded = base64.b64encode(content).decode('utf-8')

            sg_attachment = Attachment(
                file_content=FileContent(encoded),
                file_type=FileType(mime_type),
                file_name=FileName(filename),
                disposition=Disposition('attachment'),
            )
            mail.attachment.append(sg_attachment)

    def _normalize_attachment(self, attachment: Any) -> Tuple[Optional[str], Optional[bytes], str]:
        if isinstance(attachment, tuple):
            filename = attachment[0]
            content = attachment[1]
            mime_type = attachment[2] if len(attachment) > 2 else 'application/octet-stream'
            return filename, content, mime_type

        filename = getattr(attachment, 'name', None)
        content = None
        if hasattr(attachment, 'read'):
            try:
                content = attachment.read()
            except Exception:
                content = None
        elif hasattr(attachment, 'content'):
            content = attachment.content

        mime_type = getattr(attachment, 'content_type', None) or getattr(attachment, 'mimetype', 'application/octet-stream')
        return filename, content, mime_type
