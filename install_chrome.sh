#!/bin/bash
# 安装Chrome和Playwright的脚本

export PATH=$PATH:/usr/local/sbin:/usr/sbin:/sbin

# 安装Chrome
echo "Installing Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update
apt-get install -y google-chrome-stable

# 安装Playwright
echo "Installing Playwright..."
pip3 install playwright --break-system-packages
playwright install chromium

echo "Installation complete!"
