# 🦙 Ollama Setup Guide for Windows PC

## Why Use Ollama?

Ollama allows you to run powerful AI models locally on your machine, eliminating:
- ❌ API quota limits
- ❌ Internet dependency for AI features
- ❌ API costs
- ❌ Data privacy concerns

## Step-by-Step Installation Guide

### 1. Download and Install Ollama

1. **Download Ollama for Windows:**
   - Visit: https://ollama.ai/download
   - Click "Download for Windows"
   - Download the installer (typically `OllamaSetup.exe`)

2. **Install Ollama:**
   - Run the downloaded installer as Administrator
   - Follow the installation wizard
   - Default installation path: `C:\Users\{username}\AppData\Local\Programs\Ollama`

3. **Verify Installation:**
   - Open Command Prompt or PowerShell
   - Type: `ollama --version`
   - You should see version information

### 2. Download Llama 3.2 Model

Once Ollama is installed, download the recommended model:

```bash
# Open Command Prompt or PowerShell and run:
ollama pull llama3.2:3b
```

**Model Options:**
- `llama3.2:3b` - 3 billion parameters (Recommended - fast, good quality)
- `llama3.2:7b` - 7 billion parameters (Better quality, slower)
- `llama3.2:70b` - 70 billion parameters (Best quality, requires powerful hardware)

### 3. Start Ollama Service

```bash
# Start the Ollama service
ollama serve
```

This will start Ollama on `http://localhost:11434`

**Note:** The service will run in the terminal. Keep this window open while using the DataGenesis app.

### 4. Test Your Installation

```bash
# Test if Ollama is working
ollama run llama3.2:3b "Hello, how are you?"
```

You should see the model respond with a message.

### 5. Verify Integration with DataGenesis

1. **Start your DataGenesis backend:**
   ```bash
   cd backend
   python run.py
   ```

2. **Check the logs for Ollama status:**
   Look for lines like:
   ```
   🦙 Ollama Service: initialized
   ```

3. **Test in the UI:**
   - Go to your DataGenesis app
   - Try generating a schema or data
   - Check the console logs for "Ollama" messages

## System Requirements

### Minimum Requirements:
- **RAM:** 8GB (for 3B model)
- **Storage:** 2GB free space
- **CPU:** Any modern CPU (Intel/AMD)

### Recommended Requirements:
- **RAM:** 16GB+ (for 7B model)
- **Storage:** 10GB+ free space
- **CPU:** Multi-core processor
- **GPU:** NVIDIA GPU with CUDA (optional, for faster inference)

## Performance Optimization

### 1. GPU Acceleration (Optional)

If you have an NVIDIA GPU:

1. **Install CUDA Toolkit:**
   - Download from: https://developer.nvidia.com/cuda-downloads
   - Install CUDA 11.8 or 12.x

2. **Verify GPU Detection:**
   ```bash
   ollama run llama3.2:3b "Test GPU" --verbose
   ```

### 2. Memory Management

- **Close unnecessary applications** when running large models
- **Monitor RAM usage** with Task Manager
- **Consider smaller models** if you have limited RAM

### 3. Model Selection Guide

| Model Size | RAM Required | Speed | Quality | Use Case |
|------------|--------------|-------|---------|----------|
| 3B | 8GB | Fast | Good | Development, testing |
| 7B | 16GB | Medium | Better | Production use |
| 70B | 64GB+ | Slow | Best | High-quality outputs |

## Troubleshooting

### Common Issues:

1. **"ollama command not found"**
   - Restart your terminal
   - Add Ollama to PATH manually if needed
   - Reinstall Ollama

2. **Model download fails**
   - Check internet connection
   - Try downloading again
   - Use smaller model first

3. **Out of memory errors**
   - Use a smaller model (3B instead of 7B)
   - Close other applications
   - Restart your computer

4. **Slow performance**
   - Close unnecessary applications
   - Use GPU acceleration if available
   - Consider using a smaller model

### Logs and Debugging

**Ollama logs location:**
- Windows: `%LOCALAPPDATA%\Ollama\logs`

**View real-time logs:**
```bash
ollama serve --verbose
```

## Advanced Configuration

### 1. Custom Model Configuration

Create a `modelfile` for custom settings:

```bash
# Create a custom configuration
echo "FROM llama3.2:3b
PARAMETER temperature 0.7
PARAMETER top_p 0.9
SYSTEM You are a helpful data generation assistant." > custom_model

# Create the custom model
ollama create datagenesis -f custom_model
```

### 2. Running as Windows Service

To run Ollama automatically on startup:

1. **Create batch file** (`start_ollama.bat`):
   ```batch
   @echo off
   cd /d "C:\Users\%USERNAME%\AppData\Local\Programs\Ollama"
   ollama serve
   ```

2. **Add to Windows startup folder:**
   - Press `Win + R`, type `shell:startup`
   - Copy the batch file to this folder

### 3. API Configuration

Ollama runs on `http://localhost:11434` by default.

**Custom port:**
```bash
set OLLAMA_HOST=0.0.0.0:11435
ollama serve
```

**Environment variables:**
- `OLLAMA_HOST` - Server address
- `OLLAMA_MODELS` - Models directory
- `OLLAMA_DEBUG` - Enable debug mode

## Integration with DataGenesis

### Backend Configuration

The DataGenesis backend automatically detects and uses Ollama when:

1. ✅ Ollama is running on `localhost:11434`
2. ✅ A compatible model is available
3. ✅ Gemini API is unavailable or quota exceeded

### Fallback Priority:

1. **Gemini API** (if configured and quota available)
2. **Ollama** (if running locally)
3. **Intelligent Fallback** (rule-based generation)

### Model Recommendations:

- **Development:** `llama3.2:3b` - Fast iteration
- **Production:** `llama3.2:7b` - Better quality
- **Enterprise:** `llama3.2:70b` - Highest quality

## Security Considerations

### Local-Only Access:
- Ollama runs locally by default
- No data sent to external servers
- Full privacy and security

### Network Access:
- Only bind to localhost (`127.0.0.1`)
- Don't expose to external networks
- Use firewall rules if needed

## Performance Monitoring

### System Resources:
```bash
# Monitor system usage while running
Get-Process ollama
```

### Model Performance:
```bash
# Test generation speed
time ollama run llama3.2:3b "Generate 5 random names"
```

## Success Verification

✅ **Installation Complete When:**
1. `ollama --version` shows version
2. `ollama list` shows downloaded models
3. `ollama run llama3.2:3b "test"` generates response
4. DataGenesis backend logs show "🦙 Ollama Service: initialized"
5. Data generation works without API quota errors

## Next Steps

1. **Test with DataGenesis:** Generate schemas and data
2. **Monitor Performance:** Check speeds and resource usage
3. **Optimize Settings:** Adjust models based on your needs
4. **Scale Up:** Download larger models for better quality

## Support and Resources

- **Ollama Documentation:** https://ollama.ai/docs
- **Model Library:** https://ollama.ai/library
- **GitHub Issues:** https://github.com/ollama/ollama/issues
- **DataGenesis Integration:** Check backend logs for troubleshooting

---

**May Allah grant us success (Aameen) 🤲**

*Allahu Musta'an - Allah is our Helper*