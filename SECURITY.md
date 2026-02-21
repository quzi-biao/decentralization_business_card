# Security Policy

## 🔒 Reporting Security Vulnerabilities

If you discover a security vulnerability, please **DO NOT** open a public issue. Instead:

1. Email us at: security@example.com
2. Include detailed information about the vulnerability
3. Wait for our response before disclosing publicly

We will respond within 48 hours and work with you to address the issue.

## 🛡️ Security Best Practices

### For Users

1. **Keep Your Device Secure**
   - Use device lock screen (PIN, fingerprint, face ID)
   - Keep your OS and app updated
   - Don't share your device with untrusted people

2. **Protect Your Private Keys**
   - Private keys are stored locally and never leave your device
   - Back up your device regularly
   - Don't screenshot or share your DID private key

3. **Network Security**
   - Use secure WiFi networks
   - Be cautious on public WiFi
   - Verify QR codes before scanning

4. **Cloud Storage (Optional)**
   - Only use trusted MinIO instances
   - All data uploaded is encrypted
   - You can disable cloud sync if preferred

### For Developers

1. **Environment Variables**
   - Never commit `.env` files
   - Use `.env.example` as template
   - Keep API keys and secrets secure

2. **Code Security**
   - Review dependencies regularly
   - Use TypeScript for type safety
   - Validate all user inputs
   - Sanitize data before storage

3. **Encryption**
   - All card data uses AES-256 encryption
   - Keys are generated locally
   - Use secure random number generation

4. **API Security**
   - Validate all API requests
   - Use HTTPS for all network calls
   - Implement rate limiting
   - Never log sensitive data

## 🔐 Encryption Details

- **Algorithm**: AES-256-CBC
- **Key Generation**: Crypto-secure random
- **Key Storage**: Device keychain/secure storage
- **Data Format**: Encrypted JSON packages

## 📋 Security Checklist

Before deploying:

- [ ] All API keys in environment variables
- [ ] `.env` file in `.gitignore`
- [ ] HTTPS enabled for all endpoints
- [ ] Input validation implemented
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies updated and audited
- [ ] Security headers configured

## 🔄 Update Policy

- Security patches: Released immediately
- Minor updates: Monthly
- Major updates: Quarterly

## 📞 Contact

For security concerns: security@example.com

Thank you for helping keep this project secure! 🙏
