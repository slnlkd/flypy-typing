import asyncio
import logging
import smtplib
import socket
import ssl
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailDeliveryError(Exception):
    pass


def _create_ipv4_connection(host: str, port: int, timeout: int | float) -> socket.socket:
    last_error: OSError | None = None
    addresses = socket.getaddrinfo(host, port, family=socket.AF_INET, type=socket.SOCK_STREAM)

    for family, socktype, proto, _, sockaddr in addresses:
        sock = socket.socket(family, socktype, proto)
        try:
            sock.settimeout(timeout)
            sock.connect(sockaddr)
            return sock
        except OSError as exc:
            last_error = exc
            sock.close()

    if last_error is not None:
        raise last_error
    raise OSError(f"无法解析 SMTP IPv4 地址: {host}")


class IPv4SMTP(smtplib.SMTP):
    def _get_socket(self, host: str, port: int, timeout: int | float):  # type: ignore[override]
        if timeout is not None and not timeout:
            raise ValueError("Non-blocking socket (timeout=0) is not supported")
        return _create_ipv4_connection(host, port, timeout)


class IPv4SMTP_SSL(smtplib.SMTP_SSL):
    def _get_socket(self, host: str, port: int, timeout: int | float):  # type: ignore[override]
        if timeout is not None and not timeout:
            raise ValueError("Non-blocking socket (timeout=0) is not supported")
        sock = _create_ipv4_connection(host, port, timeout)
        return self.context.wrap_socket(sock, server_hostname=host)


def _build_login_code_message(to_email: str, code: str) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = f"{settings.smtp_subject_prefix}登录验证码"
    message["From"] = settings.smtp_from
    message["To"] = to_email
    message.set_content(
        (
            "您好，\n\n"
            f"您的登录验证码是：{code}\n"
            "验证码 10 分钟内有效，请勿泄露给他人。\n\n"
            "如果这不是您的操作，请忽略这封邮件。\n"
        ),
        subtype="plain",
        charset="utf-8",
    )
    return message


def _send_message_sync(message: EmailMessage) -> None:
    timeout = settings.smtp_timeout_seconds
    context = ssl.create_default_context()

    try:
        if settings.smtp_use_ssl:
            with IPv4SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=timeout, context=context) as server:
                if settings.smtp_username:
                    server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(message)
            return

        with IPv4SMTP(settings.smtp_host, settings.smtp_port, timeout=timeout) as server:
            server.ehlo()
            if settings.smtp_use_tls:
                server.starttls(context=context)
                server.ehlo()
            if settings.smtp_username:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(message)
    except Exception as exc:
        logger.exception("SMTP 发信失败")
        raise EmailDeliveryError("验证码邮件发送失败，请稍后重试") from exc


async def send_login_code_email(to_email: str, code: str) -> None:
    message = _build_login_code_message(to_email, code)
    await asyncio.to_thread(_send_message_sync, message)
