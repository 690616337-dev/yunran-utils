#!/usr/bin/env python3
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
import os

# QQ邮箱配置
smtp_server = "smtp.qq.com"
smtp_port = 587  # STARTTLS端口
sender_email = "690616337@qq.com"
password = "optfkmdmxvlzbeic"  # 授权码

# 收件人
receiver_email = "690616337@qq.com"

# 邮件内容
subject = "2025燃舞者年度总决赛选手积分汇总"
body = "您好，\n\n请查收附件：2025燃舞者年度总决赛选手积分汇总\n\n此邮件由系统自动发送。"

# 附件路径
attachment_path = "/root/.openclaw/workspace/2025燃舞者年度总决赛选手积分汇总.xlsx"

# 创建邮件
msg = MIMEMultipart()
msg['From'] = sender_email
msg['To'] = receiver_email
msg['Subject'] = subject

# 添加邮件正文
msg.attach(MIMEText(body, 'plain', 'utf-8'))

# 添加附件
if os.path.exists(attachment_path):
    with open(attachment_path, 'rb') as f:
        attachment = MIMEBase('application', 'octet-stream')
        attachment.set_payload(f.read())
    
    encoders.encode_base64(attachment)
    filename = os.path.basename(attachment_path)
    attachment.add_header(
        'Content-Disposition',
        f'attachment; filename="{filename}"'
    )
    msg.attach(attachment)
    print(f"附件已添加: {filename}")
else:
    print(f"警告: 附件文件不存在: {attachment_path}")

# 发送邮件
try:
    context = ssl.create_default_context()
    
    # 连接到SMTP服务器
    print(f"连接到 {smtp_server}:{smtp_port}...")
    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls(context=context)
        print("TLS加密已启用")
        
        # 登录
        print("正在登录...")
        server.login(sender_email, password)
        print("登录成功")
        
        # 发送邮件
        print("正在发送邮件...")
        server.sendmail(sender_email, receiver_email, msg.as_string())
        print("邮件发送成功！")
        
except Exception as e:
    print(f"发送失败: {e}")
    import traceback
    traceback.print_exc()
