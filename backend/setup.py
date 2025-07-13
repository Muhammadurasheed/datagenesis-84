#!/usr/bin/env python3
"""
DataGenesis AI Backend - Setup Script
Automated setup for the DataGenesis AI backend with miniconda support.
"""

import os
import sys
import subprocess
import json
import platform
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
    UNDERLINE = '\033[4m'

def print_banner():
    banner = f"""
{Colors.HEADER}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                DataGenesis AI Backend Setup                  ║
║                                                              ║
║         FastAPI + Multi-Agent Synthetic Data Platform       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
{Colors.ENDC}
"""
    print(banner)

def run_command(command, description, check=True, shell=True):
    """Run a command with colored output."""
    print(f"{Colors.OKCYAN}► {description}...{Colors.ENDC}")
    try:
        result = subprocess.run(command, shell=shell, check=check, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"{Colors.OKGREEN}✓ {description} completed successfully{Colors.ENDC}")
            return True
        else:
            print(f"{Colors.FAIL}✗ {description} failed{Colors.ENDC}")
            if result.stderr:
                print(f"{Colors.FAIL}Error: {result.stderr}{Colors.ENDC}")
            return False
    except subprocess.CalledProcessError as e:
        print(f"{Colors.FAIL}✗ {description} failed: {e}{Colors.ENDC}")
        if e.stderr:
            print(f"{Colors.FAIL}Error: {e.stderr}{Colors.ENDC}")
        return False
    except Exception as e:
        print(f"{Colors.FAIL}✗ Unexpected error in {description}: {e}{Colors.ENDC}")
        return False

def check_conda_environment():
    """Check if we're in a conda environment and which one."""
    print(f"{Colors.BOLD}Checking conda environment...{Colors.ENDC}")
    
    # Check if conda is available
    try:
        result = subprocess.run(['conda', '--version'], capture_output=True, text=True, shell=True)
        if result.returncode != 0:
            print(f"{Colors.FAIL}✗ Conda not found. Please install Anaconda or Miniconda.{Colors.ENDC}")
            return False, None
    except:
        print(f"{Colors.FAIL}✗ Conda not found. Please install Anaconda or Miniconda.{Colors.ENDC}")
        return False, None
    
    # Check current environment
    conda_env = os.environ.get('CONDA_DEFAULT_ENV', 'base')
    print(f"{Colors.OKGREEN}✓ Conda available, current environment: {conda_env}{Colors.ENDC}")
    
    return True, conda_env

def create_conda_environment():
    """Create a dedicated conda environment for DataGenesis AI."""
    print(f"{Colors.BOLD}Setting up conda environment...{Colors.ENDC}")
    
    env_name = "datagenesis-ai"
    
    # Check if environment already exists
    result = subprocess.run(['conda', 'env', 'list'], capture_output=True, text=True, shell=True)
    if env_name in result.stdout:
        print(f"{Colors.WARNING}Environment '{env_name}' already exists{Colors.ENDC}")
        choice = input(f"Do you want to use the existing environment? (y/n): ").lower()
        if choice == 'y':
            return env_name
        else:
            # Remove existing environment
            run_command(f'conda env remove -n {env_name}', f'Removing existing environment {env_name}')
    
    # Create new environment with Python 3.11
    success = run_command(
        f'conda create -n {env_name} python=3.11 -y',
        f'Creating conda environment: {env_name}'
    )
    
    if success:
        return env_name
    else:
        return None

def install_requirements_conda(env_name):
    """Install requirements in conda environment."""
    print(f"{Colors.BOLD}Installing Python packages in conda environment...{Colors.ENDC}")
    
    if platform.system() == 'Windows':
        activate_cmd = f'conda activate {env_name}'
        install_cmd = f'{activate_cmd} && pip install -r requirements.txt'
    else:
        install_cmd = f'conda run -n {env_name} pip install -r requirements.txt'
    
    return run_command(install_cmd, 'Installing Python packages')

def setup_environment_file():
    """Set up environment file."""
    print(f"{Colors.BOLD}Setting up environment file...{Colors.ENDC}")
    
    if os.path.exists('.env'):
        print(f"{Colors.WARNING}⚠ .env file already exists{Colors.ENDC}")
        return True
    
    if os.path.exists('.env.example'):
        if platform.system() == 'Windows':
            return run_command('copy .env.example .env', 'Creating environment file from template')
        else:
            return run_command('cp .env.example .env', 'Creating environment file from template')
    else:
        # Create basic .env file
        env_content = """# DataGenesis AI Backend Configuration

# Database
SUPABASE_URL=https://yrwcudnujriyppmpxtko.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlyd2N1ZG51anJpeXBwbXB4dGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDQ4NzgsImV4cCI6MjA2NzIyMDg3OH0.qKktoZ_cg0zUbPtJiLlindE4iNUExPp3txtZrhOP9SY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlyd2N1ZG51anJpeXBwbXB4dGtvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY0NDg3OCwiZXhwIjoyMDY3MjIwODc4fQ.oPHhxSMmV2CaZm_RpmY-A06FqRCcaf4iQ2Py1dosYt8


# Redis (for production, use local Redis for development)
REDIS_URL=redis://default:2kjMvjplKbYLVZSrNftrWfFfC6bGNak9@redis-13890.c16.us-east-1-3.ec2.redns.redis-cloud.com:13890
REDIS_PASSWORD=2kjMvjplKbYLVZSrNftrWfFfC6bGNak9

# AI Services
GEMINI_API_KEY=AIzaSyDOFWw2dk2W28l52mXJxJXrcdYbxsQz13s
GOOGLE_CLOUD_PROJECT_ID=gen-lang-client-0626319060

# Vector Database (optional for enhanced features)
PINECONE_API_KEY=pcsk_5bsEtw_SwNGTxmapgiejijc9sYQ6X3ygsToxgzeutJ2Rj3xVpbApPbueQ9n1eNKYY8Di23
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=databank

# Security
SECRET_KEY=databank@super_secure_key115
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Performance
MAX_CONCURRENT_GENERATIONS=5
MAX_DATASET_SIZE_MB=100
DEFAULT_CACHE_TTL=3600

# CORS Origins (add your frontend URL)
CORS_ORIGINS=http://localhost:8080,https://localhost:8080
"""
        
        try:
            with open('.env', 'w') as f:
                f.write(env_content)
            print(f"{Colors.OKGREEN}✓ Created basic .env file{Colors.ENDC}")
            return True
        except Exception as e:
            print(f"{Colors.FAIL}✗ Failed to create .env file: {e}{Colors.ENDC}")
            return False

def verify_installation(env_name):
    """Verify the installation."""
    print(f"{Colors.BOLD}Verifying installation...{Colors.ENDC}")
    
    # Check if requirements.txt exists
    if os.path.exists('requirements.txt'):
        print(f"{Colors.OKGREEN}✓ Requirements file found{Colors.ENDC}")
    else:
        print(f"{Colors.FAIL}✗ Requirements file missing{Colors.ENDC}")
        return False
    
    # Check if .env exists
    if os.path.exists('.env'):
        print(f"{Colors.OKGREEN}✓ Environment file exists{Colors.ENDC}")
    else:
        print(f"{Colors.WARNING}⚠ Environment file missing{Colors.ENDC}")
    
    # Test conda environment
    if platform.system() == 'Windows':
        test_cmd = f'conda activate {env_name} && python -c "import fastapi; print(\\"FastAPI available\\")"'
    else:
        test_cmd = f'conda run -n {env_name} python -c "import fastapi; print(\\"FastAPI available\\")"'
    
    if run_command(test_cmd, 'Testing FastAPI installation', check=False):
        print(f"{Colors.OKGREEN}✓ FastAPI installation verified{Colors.ENDC}")
    else:
        print(f"{Colors.WARNING}⚠ FastAPI test failed, but setup may still work{Colors.ENDC}")
    
    return True

def print_next_steps(env_name):
    """Print next steps for the user."""
    print(f"""
{Colors.HEADER}
╔══════════════════════════════════════════════════════════════╗
║                    Backend Setup Complete!                   ║
╚══════════════════════════════════════════════════════════════╝
{Colors.ENDC}

{Colors.BOLD}Next steps:{Colors.ENDC}

{Colors.OKGREEN}1. Configure your environment variables:{Colors.ENDC}
   Edit backend/.env file with your API keys:
   - SUPABASE_URL and SUPABASE_KEY from: https://supabase.com
   - GEMINI_API_KEY from: https://makersuite.google.com/app/apikey

{Colors.OKGREEN}2. Activate the conda environment:{Colors.ENDC}
   {Colors.OKCYAN}conda activate {env_name}{Colors.ENDC}

{Colors.OKGREEN}3. Start the backend server:{Colors.ENDC}
   {Colors.OKCYAN}python run.py{Colors.ENDC}
   
   Or manually:
   {Colors.OKCYAN}uvicorn app.main:app --reload --host 0.0.0.0 --port 8000{Colors.ENDC}

{Colors.OKGREEN}4. Test the backend:{Colors.ENDC}
   Backend API: http://localhost:8000/api
   API Documentation: http://localhost:8000/api/docs
   Health Check: http://localhost:8000/api/health

{Colors.WARNING}Important:{Colors.ENDC}
- The frontend should run on http://localhost:8080
- Backend will run on http://localhost:8000
- CORS is configured to allow frontend-backend communication
- Make sure both frontend and backend are running for full functionality

{Colors.BOLD}Environment: {env_name}{Colors.ENDC}
{Colors.BOLD}Backend ready for: Multi-agent AI, Real-time WebSockets, Advanced Analytics{Colors.ENDC}

{Colors.OKGREEN}Happy coding! 🚀{Colors.ENDC}
""")

def main():
    """Main setup function."""
    print_banner()
    
    try:
        # Check conda environment
        conda_available, current_env = check_conda_environment()
        if not conda_available:
            print(f"{Colors.FAIL}Please install Anaconda or Miniconda first.{Colors.ENDC}")
            sys.exit(1)
        
        # Create or use conda environment
        env_name = create_conda_environment()
        if not env_name:
            print(f"{Colors.FAIL}✗ Failed to set up conda environment{Colors.ENDC}")
            sys.exit(1)
        
        # Set up environment file
        if not setup_environment_file():
            print(f"{Colors.FAIL}✗ Environment file setup failed{Colors.ENDC}")
            sys.exit(1)
        
        # Install requirements
        if not install_requirements_conda(env_name):
            print(f"{Colors.FAIL}✗ Package installation failed{Colors.ENDC}")
            print(f"{Colors.WARNING}Try manually: conda activate {env_name} && pip install -r requirements.txt{Colors.ENDC}")
            sys.exit(1)
        
        # Verify installation
        if not verify_installation(env_name):
            print(f"{Colors.WARNING}⚠ Installation verification had issues{Colors.ENDC}")
        
        # Print next steps
        print_next_steps(env_name)
        
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Setup interrupted by user{Colors.ENDC}")
        sys.exit(1)
    except Exception as e:
        print(f"{Colors.FAIL}✗ Setup failed with error: {e}{Colors.ENDC}")
        sys.exit(1)

if __name__ == "__main__":
    main()