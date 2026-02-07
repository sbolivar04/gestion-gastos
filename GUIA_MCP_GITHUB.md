# 🚀 Guía de Configuración: MCP de GitHub

Para que pueda gestionar tus repositorios directamente (crear, editar, pull requests), necesitamos configurar el servidor MCP de GitHub. Sigue estos pasos:

## Paso 1: Generar un Token de Acceso Personal (PAT)

1.  Ve a [GitHub Developer Settings > Personal access tokens > Fine-grained tokens](https://github.com/settings/tokens?type=beta).
2.  Haz clic en **Generate new token**.
3.  Asigna un nombre (ej: `Mcp-Assistant`).
4.  **Expiration**: Elige un tiempo prudente (ej: 30 o 60 días).
5.  **Repository access**: Selecciona "All repositories" (o solo los que quieras que yo gestione).
6.  **Permissions** (Despliega "Repository permissions" y habilita):
    -   `Contents`: **Read and Write** (Vital para leer y escribir código).
    -   `Pull requests`: **Read and Write**.
    -   `Issues`: **Read and Write**.
    -   `Metadata`: **Read-only** (Se selecciona solo).
7.  Haz clic en **Generate token** y **CÓPIALO INMEDIATAMENTE** (no lo podrás ver después).

## Paso 2: Configurar el Cliente MCP

Debes editar el archivo de configuración de tu cliente MCP.
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac/Linux**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Abre ese archivo con cualquier editor de texto (Notepad, VS Code) y agrega la sección `github` dentro de `mcpServers`.

Tu archivo debería verse algo así (asegúrate de mantener las comas válidas en el JSON):

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "TU_TOKEN_AQUI_PEGALO_TAL_CUAL"
      }
    },
    // ... otras configuraciones que ya tengas (como supabase o notebooklm)
    "supabase": { ... },
    "notebooklm": { ... }
  }
}
```

> **Nota**: Reemplaza `"TU_TOKEN_AQUI_PEGALO_TAL_CUAL"` con el token que copiaste en el Paso 1.

## Paso 3: Reiniciar

1.  Guarda el archivo `claude_desktop_config.json`.
2.  Cierra completamente la aplicación de escritorio (asegúrate de que no esté en la bandeja del sistema).
3.  Vuelve a abrirla.

Si todo salió bien, en nuestra próxima conversación podré ver herramientas como `create_repository`, `create_pull_request`, etc.
