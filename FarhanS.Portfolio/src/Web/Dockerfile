FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["FarhanS.Portfolio/src/Web/FarhanS.Portfolio.csproj", "Web/"]
COPY ["FarhanS.Portfolio/src/Core/Core.csproj", "Core/"]
COPY ["FarhanS.Portfolio/src/Infrastructure/Infrastructure.csproj", "Infrastructure/"]
RUN dotnet restore "Web/FarhanS.Portfolio.csproj"
COPY FarhanS.Portfolio/src .
WORKDIR "/src/Web"
RUN dotnet build "FarhanS.Portfolio.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "FarhanS.Portfolio.csproj" -c Release -o /app/publish

FROM nginx:alpine AS final
WORKDIR /usr/share/nginx/html
COPY --from=publish /app/publish/wwwroot .
COPY FarhanS.Portfolio/src/Web/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
EXPOSE 443