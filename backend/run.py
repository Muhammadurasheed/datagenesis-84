#!/usr/bin/env python3
"""
DataGenesis AI Backend - Run Script
Start the DataGenesis AI FastAPI backend server.
"""

import os
import sys
import time
import platform
import signal
from pathlib import Path

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_banner():
    banner = f"""
{Colors.HEADER}
╔══════════════════════════════════════════════════════════════╗
║                 DataGenesis AI Backend Starting              ║
║                                                              ║
║             FastAPI + Multi-Agent AI Platform               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
{Colors.ENDC}
"""
    print(banner)

def check_environment():
    """Check if environment is properly configured."""
    print(f"{Colors.BOLD}Checking environment...{Colors.ENDC}")
    
    # Check if we're in conda environment
    conda_env = os.environ.get('CONDA_DEFAULT_ENV')
    if conda_env:
        print(f"{Colors.OKGREEN}✓ Running in conda environment: {conda_env}{Colors.ENDC}")
    else:
        print(f"{Colors.WARNING}⚠ Not in conda environment{Colors.ENDC}")
    
    return True

def check_dependencies():
    """Check if required packages are installed."""
    print(f"{Colors.BOLD}Checking dependencies...{Colors.ENDC}")
    
    required_packages = ['fastapi', 'uvicorn']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"{Colors.FAIL}✗ Missing packages: {', '.join(missing_packages)}{Colors.ENDC}")
        return False
    
    print(f"{Colors.OKGREEN}✓ All required packages available{Colors.ENDC}")
    return True

def start_fastapi_server():
    """Start the FastAPI server using uvicorn directly."""
    print(f"{Colors.OKCYAN}► Starting FastAPI server...{Colors.ENDC}")
    
    try:
        import uvicorn
        
        # Set the working directory to backend folder
        backend_dir = Path(__file__).parent
        os.chdir(backend_dir)
        
        print(f"{Colors.OKBLUE}Working directory: {os.getcwd()}{Colors.ENDC}")
        print(f"{Colors.OKBLUE}Starting server on 127.0.0.1:8000...{Colors.ENDC}")
        
        # Print server info before starting
        print_server_info()
        
        # Start uvicorn server directly (this will block)
        # CRITICAL: Use 127.0.0.1 to match proxy configuration
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",  # Match frontend proxy exactly
            port=8000,
            reload=True,
            log_level="info",
            access_log=True
        )
        
    except ImportError:
        print(f"{Colors.FAIL}✗ uvicorn not found{Colors.ENDC}")
        print(f"{Colors.WARNING}Try: pip install uvicorn{Colors.ENDC}")
        return False
    except Exception as e:
        print(f"{Colors.FAIL}✗ Failed to start FastAPI server: {e}{Colors.ENDC}")
        return False

def print_server_info():
    """Print server information."""
    print(f"""
{Colors.HEADER}
╔══════════════════════════════════════════════════════════════╗
║                🚀 DataGenesis AI Backend Ready!              ║
╚══════════════════════════════════════════════════════════════╝
{Colors.ENDC}

{Colors.BOLD}Server URLs:{Colors.ENDC}
{Colors.OKGREEN}Backend API:{Colors.ENDC}      http://127.0.0.1:8000/api
{Colors.OKGREEN}API Documentation:{Colors.ENDC} http://127.0.0.1:8000/api/docs  
{Colors.OKGREEN}Health Check:{Colors.ENDC}     http://127.0.0.1:8000/api/health
{Colors.OKGREEN}WebSocket:{Colors.ENDC}        ws://127.0.0.1:8000/ws/{{client_id}}

{Colors.BOLD}Frontend Communication:{Colors.ENDC}
{Colors.OKGREEN}Frontend URL:{Colors.ENDC}     http://localhost:8080
{Colors.OKGREEN}CORS Enabled:{Colors.ENDC}     ✓ Ready for frontend requests

{Colors.WARNING}CRITICAL:{Colors.ENDC}
- Backend running on 127.0.0.1:8000 (matches proxy config)
- Configure Gemini API key in .env for AI features
- Use Ctrl+C to stop the server

{Colors.OKGREEN}Ready to generate synthetic data! ✨{Colors.ENDC}
""")

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully."""
    print(f"\n{Colors.WARNING}Shutting down DataGenesis AI Backend...{Colors.ENDC}")
    sys.exit(0)

def main():
    """Main run function."""
    # Set up signal handler
    signal.signal(signal.SIGINT, signal_handler)
    
    print_banner()
    
    # Check environment
    if not check_environment():
        sys.exit(1)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Start FastAPI server (this will block)
    start_fastapi_server()

if __name__ == "__main__":
    main()