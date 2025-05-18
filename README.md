# Farhan's Portfolio Website

## 🚀 Overview

This is my personal portfolio website built with Blazor WebAssembly, designed to showcase my skills, projects, and professional experience to potential employers and recruiters.

## ✨ Features

- **Interactive Resume**: A dynamic presentation of my professional experience and skills
- **Project Showcase**: Detailed case studies of my most significant work
- **Contact Form**: Direct communication channel using Azure Functions backend
- **Performance Optimised**: Fast-loading SPA with client-side WebAssembly execution
- **Responsive Design**: Seamless experience across all devices and screen sizes

## 🛠️ Technology Stack

- **Frontend**:

  - Blazor WebAssembly (.NET 8)
  - HTML5, CSS3, JavaScript
  - Progressive Web App (PWA) capabilities
- **Backend**:

  - Azure Functions
  - .NET Core API
  - Entity Framework Core
- **DevOps**:

  - Docker containerization
  - CI/CD pipeline
  - Nginx for web server configuration

## 📂 Project Structure

The solution follows a clean architecture approach:

- **Core**: Contains domain entities and business logic
- **Infrastructure**: Data access and external service integrations
- **Web**: Blazor WebAssembly UI components and pages
- **Functions**: Azure Functions for backend processing

## 🔧 Setup and Installation

### Prerequisites

- .NET 8 SDK or later
- Docker (optional for containerised deployment)

### Local Development

1. Clone the repository
2. Navigate to the `FarhanS.Portfolio` directory
3. Run `dotnet restore` to restore dependencies
4. Run `dotnet run --project src/Web/FarhanS.Portfolio.csproj`
5. Access the application at `https://localhost:5001`

### Docker Deployment

```bash
docker-compose up -d
```

## 📝 Contact

Feel free to reach out to me for any opportunities or collaborations through the contact form on my website or via my professional channels.

---

© 2025 Farhan S. All Rights Reserved.
