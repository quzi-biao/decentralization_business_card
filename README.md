# 🎴 Decentralized Business Card

A privacy-focused, decentralized digital business card application built with React Native and Expo. Exchange business cards securely using QR codes with end-to-end encryption.

[中文文档](./README_CN.md)

## ✨ Features

### 🔐 Privacy & Security
- **End-to-End Encryption**: All card data is encrypted using AES-256 before storage
- **Decentralized Identity**: Based on DID (Decentralized Identifier) system
- **Local-First Storage**: Your data stays on your device by default
- **Optional Cloud Backup**: Upload encrypted data to MinIO for cross-device sync

### 📇 Business Card Management
- **Digital Business Cards**: Create and manage your digital business card
- **QR Code Exchange**: Share your card via QR code scanning
- **Contact Organization**: Tag and categorize your contacts
- **Rich Media Support**: Add avatar, WeChat QR code, and company images
- **Smart Search**: Search contacts by name, company, position, or notes

### 🤖 AI-Powered Features
- **AI Assistant**: Chat with an AI assistant about your contacts
- **Card Evaluation**: Get AI-powered insights on your business card
- **Voice Input**: Speech-to-text support for hands-free interaction

### 🎨 User Experience
- **Modern UI**: Clean and intuitive interface with smooth animations
- **Dark Mode Ready**: Designed with theme support
- **Offline Support**: Works without internet connection
- **Network Recovery**: Auto-refresh when connection is restored

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Studio (for Android)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/business-card.git
cd business-card
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env and fill in your configuration
```

4. Start the development server
```bash
npx expo start
```

5. Run on your device
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan the QR code with Expo Go app on your physical device

## ⚙️ Configuration

### n8n Integration (Optional)

This app uses n8n for AI features. To enable AI functionality:

1. Set up an n8n instance (self-hosted or cloud)
2. Create workflows for:
   - AI Agent (chat assistant)
   - API Key management
   - Speech-to-text conversion
3. Update your `.env` file with n8n credentials

See [n8n Setup Guide](./docs/n8n-setup.md) for detailed instructions.

### MinIO Storage (Optional)

For cloud storage and cross-device sync:

1. Set up a MinIO server
2. Create a bucket for business cards
3. Update `.env` with MinIO credentials

## 📱 Usage

### Creating Your Business Card

1. Open the app and navigate to "My Card"
2. Fill in your information:
   - Name, position, company
   - Contact details (phone, email, WeChat)
   - Upload avatar and company images
3. Your card is automatically encrypted and saved

### Exchanging Cards

1. Navigate to "Exchange" tab
2. Show your QR code to others, or
3. Tap "Scan QR Code" to scan someone else's card
4. Cards are exchanged with end-to-end encryption

### Managing Contacts

1. View all contacts in "Cards" tab
2. Search by name, company, or position
3. Add tags and notes to organize contacts
4. View detailed contact information

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React Native + Expo
- **State Management**: Zustand
- **Storage**: AsyncStorage (local) + MinIO (cloud)
- **Encryption**: AES-256 encryption
- **AI Backend**: n8n workflows
- **Identity**: Custom DID implementation

### Project Structure

```
business-card/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components
│   ├── services/        # Business logic services
│   ├── store/           # Zustand state management
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   └── navigation/      # Navigation setup
├── assets/              # Images, fonts, etc.
├── .env.example         # Environment variables template
└── app.json             # Expo configuration
```

## 🔒 Security

- All business card data is encrypted using AES-256
- Private keys never leave your device
- QR codes contain encrypted data only
- Optional cloud storage uses encrypted packages
- No central server stores your unencrypted data

## 🛣️ Roadmap

### Completed Features
- ✅ Basic business card creation and editing
- ✅ QR code generation and scanning
- ✅ End-to-end encryption
- ✅ Contact management with tags and notes
- ✅ AI assistant integration
- ✅ Network recovery handling
- ✅ Duplicate prevention

### Upcoming Features

#### 📚 Documentation & Open Source
- [ ] Complete setup documentation
- [ ] API documentation
- [ ] Contributing guidelines
- [ ] Open source release

#### 🌐 Networking Plaza
- [ ] Public card marketplace
- [ ] Set viewing price for your card (can be free)
- [ ] Pay-per-view model for premium cards
- [ ] Discovery and networking features

#### 🎨 Card Design Studio
- [ ] AI-powered card design generation
- [ ] Multiple card style templates
- [ ] Custom branding and themes
- [ ] Export cards in various formats

#### 🤖 Smart Card Editing
- [ ] AI-assisted image upload and organization
- [ ] OCR for business card information extraction
- [ ] Auto-fill from uploaded documents
- [ ] Intelligent content generation from files

#### ⚙️ Customization
- [ ] Custom field definitions
- [ ] Flexible card display layouts
- [ ] Template system for different industries
- [ ] White-label support

#### 💬 Feedback System
- [ ] In-app feedback collection
- [ ] Bug reporting with screenshots
- [ ] Feature request voting
- [ ] User support chat

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- AI powered by [n8n](https://n8n.io/)
- Icons by [Expo Vector Icons](https://icons.expo.fyi/)

## 📞 Support

- 📧 Email: 0xnomean@gmail.com
- 💬 WeChat: godisdog007 (请备注：去中心化名片)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/business-card/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/business-card/discussions)

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐️

---

Made with ❤️ by the Decentralized Business Card Team
