FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files first and restore as distinct layers to take advantage of Docker caching
COPY ["src/Core/Core.csproj", "Core/"]
COPY ["src/Infrastructure/Infrastructure.csproj", "Infrastructure/"]
COPY ["src/Web/FarhanS.Portfolio.csproj", "Web/"]

# Restore packages
RUN dotnet restore "Web/FarhanS.Portfolio.csproj"

# Copy the remaining source code
COPY src .

# Build and publish
WORKDIR "/src/Web"
RUN dotnet build "FarhanS.Portfolio.csproj" -c Release -o /app/build
RUN dotnet publish "FarhanS.Portfolio.csproj" -c Release -o /app/publish

# Create final image
FROM nginx:alpine AS final
WORKDIR /usr/share/nginx/html

# Configure nginx for Blazor WebAssembly
COPY src/Web/nginx.conf /etc/nginx/nginx.conf

# Copy published app
COPY --from=build /app/publish/wwwroot .

# Add proper MIME types for Blazor WebAssembly - fixed to use correct format
RUN sed -i 's/\(^.*types {\s*$\)/\1\n    application\/wasm wasm;/g' /etc/nginx/mime.types

# Expose ports
EXPOSE 80
EXPOSE 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1