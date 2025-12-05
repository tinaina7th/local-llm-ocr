#!/bin/bash
cd "$(dirname "$0")"

# Try to load user profile to get npm in PATH
if [ -f ~/.zshrc ]; then
    source ~/.zshrc
elif [ -f ~/.bash_profile ]; then
    source ~/.bash_profile
fi

echo "Starting Local DeepSeek OCR..."
npm run dev

echo "Application exited."
read -p "Press Enter to close this window..."
