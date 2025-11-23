#!/usr/bin/env python3
"""
Script to install Playwright browsers.
Run this during deployment to ensure browsers are available.
"""
import subprocess
import sys
import os

def install_playwright_browsers():
    """Install Playwright browsers"""
    print("Installing Playwright browsers...")
    try:
        # Install chromium only (smaller footprint)
        result = subprocess.run(
            [sys.executable, "-m", "playwright", "install", "chromium"],
            check=True,
            capture_output=True,
            text=True
        )
        print("✅ Playwright browsers installed successfully")
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing Playwright browsers: {e.stderr}")
        return False
    except FileNotFoundError:
        print("❌ Playwright not found. Install it first: pip install playwright")
        return False

if __name__ == "__main__":
    success = install_playwright_browsers()
    sys.exit(0 if success else 1)

